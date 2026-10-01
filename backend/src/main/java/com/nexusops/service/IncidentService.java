package com.nexusops.service;

import com.nexusops.config.TenantContext;
import com.nexusops.dto.ActionDTOs;
import com.nexusops.dto.AiDTOs;
import com.nexusops.dto.IncidentDTOs;
import com.nexusops.model.*;
import com.nexusops.repository.*;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final IncidentEventRepository eventRepository;
    private final ServerRepository serverRepository;
    private final AiAnalysisRepository aiAnalysisRepository;
    private final ActionRepository actionRepository;
    private final AiEngineService aiEngineService;
    private final AuditService auditService;
    private final WebSocketService webSocketService;

    public IncidentService(
            IncidentRepository incidentRepository,
            IncidentEventRepository eventRepository,
            ServerRepository serverRepository,
            AiAnalysisRepository aiAnalysisRepository,
            ActionRepository actionRepository,
            @Lazy AiEngineService aiEngineService,
            AuditService auditService,
            WebSocketService webSocketService) {
        this.incidentRepository = incidentRepository;
        this.eventRepository = eventRepository;
        this.serverRepository = serverRepository;
        this.aiAnalysisRepository = aiAnalysisRepository;
        this.actionRepository = actionRepository;
        this.aiEngineService = aiEngineService;
        this.auditService = auditService;
        this.webSocketService = webSocketService;
    }

    @Transactional(readOnly = true)
    public List<IncidentDTOs.IncidentDTO> getIncidents(String status) {
        UUID orgId = TenantContext.getTenantId();
        List<Incident> incidents = (status != null && !status.isBlank())
                ? incidentRepository.findByOrganizationIdAndStatus(orgId, status.toUpperCase())
                : incidentRepository.findByOrganizationIdAndStatus(orgId, "OPEN");

        return incidents.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public IncidentDTOs.IncidentDetailDTO getIncidentDetail(UUID incidentId) {
        UUID orgId = TenantContext.getTenantId();
        Incident incident = incidentRepository.findByIdAndOrganizationId(incidentId, orgId)
                .orElseThrow(() -> new RuntimeException("Incident not found"));

        List<IncidentEvent> events = eventRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId);
        List<IncidentDTOs.IncidentEventDTO> timeline = events.stream()
                .map(e -> IncidentDTOs.IncidentEventDTO.builder()
                        .id(e.getId())
                        .eventType(e.getEventType())
                        .message(e.getMessage())
                        .createdAt(e.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        AiAnalysis latestAi = aiAnalysisRepository.findTopByIncidentIdOrderByCreatedAtDesc(incidentId).orElse(null);
        AiDTOs.AiAnalysisDTO aiDTO = latestAi != null ? aiEngineService.mapToDTO(latestAi) : null;

        List<ActionEntity> actions = actionRepository.findByOrganizationIdAndStatus(orgId, "PROPOSED");
        List<ActionDTOs.ActionDTO> relatedActions = actions.stream()
                .filter(a -> incidentId.equals(a.getIncidentId()))
                .map(this::mapActionToDTO)
                .collect(Collectors.toList());

        return IncidentDTOs.IncidentDetailDTO.builder()
                .incident(mapToDTO(incident))
                .timeline(timeline)
                .latestAiAnalysis(aiDTO)
                .relatedActions(relatedActions)
                .build();
    }

    @Transactional
    public void correlateAlert(Alert alert) {
        if (!"CRITICAL".equalsIgnoreCase(alert.getSeverity())) {
            return; // Only correlate critical alerts into top-level incidents in MVP
        }

        UUID orgId = alert.getOrganizationId();
        String incNum = "INC-" + (1000 + (int)(Math.random() * 9000));

        Incident incident = Incident.builder()
                .incidentNumber(incNum)
                .organizationId(orgId)
                .primaryServerId(alert.getServerId())
                .severity(alert.getSeverity())
                .status("OPEN")
                .title(alert.getTitle())
                .summary(alert.getDescription())
                .build();

        Incident saved = incidentRepository.save(incident);

        // Timeline event
        recordEvent(orgId, saved.getId(), "CREATED", "Incident created from critical alert: " + alert.getTitle());

        auditService.recordAudit(orgId, null, "SYSTEM", "INCIDENT_CREATED", "INCIDENT", saved.getId().toString(),
                String.format("{\"number\":\"%s\",\"title\":\"%s\"}", incNum, saved.getTitle()));

        webSocketService.broadcastOrgEvent(orgId, "INCIDENT_CREATED", saved.getId().toString(),
                Map.of("number", incNum, "title", saved.getTitle(), "severity", saved.getSeverity()));

        // Auto trigger AI investigation
        aiEngineService.investigateIncident(saved);
    }

    @Transactional
    public void recordEvent(UUID orgId, UUID incidentId, String eventType, String message) {
        IncidentEvent event = IncidentEvent.builder()
                .organizationId(orgId)
                .incidentId(incidentId)
                .eventType(eventType)
                .message(message)
                .build();
        eventRepository.save(event);
    }

    @Transactional
    public void acknowledgeIncident(UUID incidentId) {
        UUID orgId = TenantContext.getTenantId();
        Incident incident = incidentRepository.findByIdAndOrganizationId(incidentId, orgId)
                .orElseThrow(() -> new RuntimeException("Incident not found"));
        incident.setStatus("INVESTIGATING");
        incident.setAcknowledgedAt(OffsetDateTime.now());
        incidentRepository.save(incident);
        recordEvent(orgId, incidentId, "ACKNOWLEDGED", "Incident acknowledged by user.");
    }

    @Transactional
    public void resolveIncident(UUID incidentId) {
        UUID orgId = TenantContext.getTenantId();
        Incident incident = incidentRepository.findByIdAndOrganizationId(incidentId, orgId)
                .orElseThrow(() -> new RuntimeException("Incident not found"));
        incident.setStatus("RESOLVED");
        incident.setResolvedAt(OffsetDateTime.now());
        incidentRepository.save(incident);
        recordEvent(orgId, incidentId, "RESOLVED", "Incident marked as resolved.");
    }

    private IncidentDTOs.IncidentDTO mapToDTO(Incident i) {
        Server server = i.getPrimaryServerId() != null ? serverRepository.findById(i.getPrimaryServerId()).orElse(null) : null;
        return IncidentDTOs.IncidentDTO.builder()
                .id(i.getId())
                .incidentNumber(i.getIncidentNumber())
                .primaryServerId(i.getPrimaryServerId())
                .primaryServerName(server != null ? server.getDisplayName() : "Unknown")
                .severity(i.getSeverity())
                .status(i.getStatus())
                .title(i.getTitle())
                .summary(i.getSummary())
                .openedAt(i.getOpenedAt())
                .acknowledgedAt(i.getAcknowledgedAt())
                .resolvedAt(i.getResolvedAt())
                .build();
    }

    private ActionDTOs.ActionDTO mapActionToDTO(ActionEntity a) {
        Server server = serverRepository.findById(a.getServerId()).orElse(null);
        return ActionDTOs.ActionDTO.builder()
                .id(a.getId())
                .incidentId(a.getIncidentId())
                .serverId(a.getServerId())
                .serverName(server != null ? server.getDisplayName() : "Server")
                .actionType(a.getActionType())
                .riskLevel(a.getRiskLevel())
                .status(a.getStatus())
                .requestedBy(a.getRequestedBy())
                .parameters(a.getParameters())
                .result(a.getResult())
                .requestedAt(a.getRequestedAt())
                .approvedAt(a.getApprovedAt())
                .verifiedAt(a.getVerifiedAt())
                .build();
    }
}
