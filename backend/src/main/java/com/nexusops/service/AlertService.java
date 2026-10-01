package com.nexusops.service;

import com.nexusops.config.TenantContext;
import com.nexusops.dto.AlertDTOs;
import com.nexusops.model.Alert;
import com.nexusops.model.Server;
import com.nexusops.model.ServerMetric;
import com.nexusops.repository.AlertRepository;
import com.nexusops.repository.ServerRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AlertService {

    private final AlertRepository alertRepository;
    private final ServerRepository serverRepository;
    private final IncidentService incidentService;
    private final AuditService auditService;
    private final WebSocketService webSocketService;

    public AlertService(
            AlertRepository alertRepository,
            ServerRepository serverRepository,
            @Lazy IncidentService incidentService,
            AuditService auditService,
            WebSocketService webSocketService) {
        this.alertRepository = alertRepository;
        this.serverRepository = serverRepository;
        this.incidentService = incidentService;
        this.auditService = auditService;
        this.webSocketService = webSocketService;
    }

    @Transactional(readOnly = true)
    public List<AlertDTOs.AlertDTO> getAlerts(String status) {
        UUID orgId = TenantContext.getTenantId();
        List<Alert> alerts = (status != null && !status.isBlank())
                ? alertRepository.findByOrganizationIdAndStatus(orgId, status.toUpperCase())
                : alertRepository.findByOrganizationIdAndStatus(orgId, "OPEN");

        return alerts.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public void evaluateMetrics(UUID orgId, UUID serverId, ServerMetric metric) {
        Server server = serverRepository.findById(serverId).orElse(null);
        String hostname = server != null ? server.getDisplayName() : serverId.toString();

        // Check Disk
        if (metric.getDiskPercent().compareTo(new BigDecimal("90.0")) >= 0) {
            triggerAlert(orgId, serverId, "CRITICAL", "DISK_FULL",
                    String.format("Server %s disk usage critical (%s%%)", hostname, metric.getDiskPercent()),
                    String.format("Root filesystem storage utilization reached %s%%", metric.getDiskPercent()));
        }

        // Check CPU
        if (metric.getCpuPercent().compareTo(new BigDecimal("90.0")) >= 0) {
            triggerAlert(orgId, serverId, "CRITICAL", "CPU_HIGH",
                    String.format("Server %s CPU utilization critical (%s%%)", hostname, metric.getCpuPercent()),
                    String.format("CPU sustained above 90%% (currently %s%%)", metric.getCpuPercent()));
        } else if (metric.getCpuPercent().compareTo(new BigDecimal("80.0")) >= 0) {
            triggerAlert(orgId, serverId, "WARNING", "CPU_HIGH",
                    String.format("Server %s CPU utilization warning (%s%%)", hostname, metric.getCpuPercent()),
                    String.format("CPU elevated above 80%% (currently %s%%)", metric.getCpuPercent()));
        }

        // Check Memory
        if (metric.getMemoryPercent().compareTo(new BigDecimal("85.0")) >= 0) {
            triggerAlert(orgId, serverId, "WARNING", "MEM_HIGH",
                    String.format("Server %s RAM utilization elevated (%s%%)", hostname, metric.getMemoryPercent()),
                    String.format("System memory consumption reached %s%%", metric.getMemoryPercent()));
        }
    }

    @Transactional
    public void triggerAlert(UUID orgId, UUID serverId, String severity, String type, String title, String description) {
        String fingerprint = serverId.toString() + ":" + type;
        Optional<Alert> existing = alertRepository.findByOrganizationIdAndFingerprintAndStatus(orgId, fingerprint, "OPEN");

        if (existing.isPresent()) {
            Alert alert = existing.get();
            alert.setLastSeenAt(OffsetDateTime.now());
            alertRepository.save(alert);
        } else {
            Alert alert = Alert.builder()
                    .organizationId(orgId)
                    .serverId(serverId)
                    .severity(severity)
                    .type(type)
                    .title(title)
                    .description(description)
                    .status("OPEN")
                    .fingerprint(fingerprint)
                    .lastSeenAt(OffsetDateTime.now())
                    .build();

            Alert saved = alertRepository.save(alert);
            auditService.recordAudit(orgId, null, "SYSTEM", "ALERT_TRIGGERED", "ALERT", saved.getId().toString(),
                    String.format("{\"type\":\"%s\",\"severity\":\"%s\"}", type, severity));

            // Escalate critical or repeated alerts to incidents
            incidentService.correlateAlert(saved);
        }
    }

    @Transactional
    public void acknowledgeAlert(UUID alertId) {
        UUID orgId = TenantContext.getTenantId();
        Alert alert = alertRepository.findByIdAndOrganizationId(alertId, orgId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
        alert.setStatus("ACKNOWLEDGED");
        alert.setAcknowledgedAt(OffsetDateTime.now());
        alertRepository.save(alert);
    }

    @Transactional
    public void resolveAlert(UUID alertId) {
        UUID orgId = TenantContext.getTenantId();
        Alert alert = alertRepository.findByIdAndOrganizationId(alertId, orgId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
        alert.setStatus("RESOLVED");
        alert.setResolvedAt(OffsetDateTime.now());
        alertRepository.save(alert);
    }

    private AlertDTOs.AlertDTO mapToDTO(Alert a) {
        Server server = serverRepository.findById(a.getServerId()).orElse(null);
        return AlertDTOs.AlertDTO.builder()
                .id(a.getId())
                .serverId(a.getServerId())
                .serverName(server != null ? server.getDisplayName() : "Unknown")
                .severity(a.getSeverity())
                .type(a.getType())
                .title(a.getTitle())
                .description(a.getDescription())
                .status(a.getStatus())
                .firstSeenAt(a.getFirstSeenAt())
                .lastSeenAt(a.getLastSeenAt())
                .build();
    }
}
