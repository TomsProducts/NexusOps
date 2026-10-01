package com.nexusops.service;

import com.nexusops.config.TenantContext;
import com.nexusops.dto.ServerDTOs;
import com.nexusops.model.AgentEnrollmentToken;
import com.nexusops.model.Server;
import com.nexusops.model.ServerMetric;
import com.nexusops.model.ServiceEntity;
import com.nexusops.repository.AgentEnrollmentTokenRepository;
import com.nexusops.repository.ServerMetricRepository;
import com.nexusops.repository.ServerRepository;
import com.nexusops.repository.ServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ServerService {

    private final ServerRepository serverRepository;
    private final ServerMetricRepository metricRepository;
    private final ServiceRepository serviceRepository;
    private final AgentEnrollmentTokenRepository tokenRepository;
    private final AuditService auditService;

    public ServerService(
            ServerRepository serverRepository,
            ServerMetricRepository metricRepository,
            ServiceRepository serviceRepository,
            AgentEnrollmentTokenRepository tokenRepository,
            AuditService auditService) {
        this.serverRepository = serverRepository;
        this.metricRepository = metricRepository;
        this.serviceRepository = serviceRepository;
        this.tokenRepository = tokenRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ServerDTOs.ServerDTO> getServers() {
        UUID orgId = TenantContext.getTenantId();
        return serverRepository.findByOrganizationId(orgId).stream()
                .map(this::mapToServerDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ServerDTOs.ServerDetailDTO getServerDetail(UUID serverId) {
        UUID orgId = TenantContext.getTenantId();
        Server server = serverRepository.findByIdAndOrganizationId(serverId, orgId)
                .orElseThrow(() -> new RuntimeException("Server not found"));

        List<ServerMetric> metrics = metricRepository.findTop20ByOrganizationIdAndServerIdOrderByRecordedAtDesc(orgId, serverId);
        List<ServiceEntity> services = serviceRepository.findByOrganizationIdAndServerId(orgId, serverId);

        List<ServerDTOs.MetricPointDTO> metricPoints = metrics.stream()
                .map(m -> ServerDTOs.MetricPointDTO.builder()
                        .timestamp(m.getRecordedAt())
                        .cpu(m.getCpuPercent())
                        .memory(m.getMemoryPercent())
                        .disk(m.getDiskPercent())
                        .load1m(m.getLoad1m())
                        .networkIn(m.getNetworkInBytes())
                        .networkOut(m.getNetworkOutBytes())
                        .build())
                .collect(Collectors.toList());

        List<ServerDTOs.ServiceDTO> serviceDTOs = services.stream()
                .map(s -> ServerDTOs.ServiceDTO.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .serviceType(s.getServiceType())
                        .status(s.getStatus())
                        .port(s.getPort())
                        .lastCheckAt(s.getLastCheckAt())
                        .build())
                .collect(Collectors.toList());

        return ServerDTOs.ServerDetailDTO.builder()
                .server(mapToServerDTO(server))
                .metricsHistory(metricPoints)
                .services(serviceDTOs)
                .build();
    }

    @Transactional
    public ServerDTOs.ServerDTO registerServer(ServerDTOs.RegisterServerRequest req) {
        UUID orgId = TenantContext.getTenantId();
        Server server = Server.builder()
                .organizationId(orgId)
                .hostname(req.getHostname())
                .displayName(req.getDisplayName() != null ? req.getDisplayName() : req.getHostname())
                .ipAddress(req.getIpAddress())
                .status("OFFLINE")
                .build();

        Server saved = serverRepository.save(server);
        auditService.recordAudit(orgId, null, "USER", "SERVER_REGISTERED", "SERVER", saved.getId().toString(), "{}");
        return mapToServerDTO(saved);
    }

    @Transactional
    public ServerDTOs.EnrollmentTokenResponse createEnrollmentToken(UUID serverId) {
        UUID orgId = TenantContext.getTenantId();
        String tokenStr = "nx_tok_" + UUID.randomUUID().toString().replace("-", "");
        OffsetDateTime expiresAt = OffsetDateTime.now().plusHours(24);

        AgentEnrollmentToken token = AgentEnrollmentToken.builder()
                .organizationId(orgId)
                .serverId(serverId)
                .token(tokenStr)
                .expiresAt(expiresAt)
                .build();

        tokenRepository.save(token);

        String installCmd = String.format("curl -sSL http://nexusops.local/install.sh | sudo bash -s -- --token %s", tokenStr);

        return ServerDTOs.EnrollmentTokenResponse.builder()
                .token(tokenStr)
                .expiresAt(expiresAt)
                .installCommand(installCmd)
                .build();
    }

    private ServerDTOs.ServerDTO mapToServerDTO(Server s) {
        List<ServerMetric> recent = metricRepository.findTop20ByOrganizationIdAndServerIdOrderByRecordedAtDesc(s.getOrganizationId(), s.getId());
        ServerMetric latest = recent.isEmpty() ? null : recent.get(0);

        return ServerDTOs.ServerDTO.builder()
                .id(s.getId())
                .hostname(s.getHostname())
                .displayName(s.getDisplayName() != null ? s.getDisplayName() : s.getHostname())
                .ipAddress(s.getIpAddress())
                .osName(s.getOsName())
                .osVersion(s.getOsVersion())
                .agentVersion(s.getAgentVersion())
                .status(s.getStatus())
                .lastSeenAt(s.getLastSeenAt())
                .currentCpu(latest != null ? latest.getCpuPercent() : null)
                .currentMemory(latest != null ? latest.getMemoryPercent() : null)
                .currentDisk(latest != null ? latest.getDiskPercent() : null)
                .dockerContainers(s.getDockerContainers())
                .topProcesses(s.getTopProcesses())
                .criticalLogs(s.getCriticalLogs())
                .servicePlugins(s.getServicePlugins())
                .build();
    }
}
