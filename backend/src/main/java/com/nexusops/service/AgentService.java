package com.nexusops.service;

import com.nexusops.dto.AgentDTOs;
import com.nexusops.model.*;
import com.nexusops.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AgentService {

    private final AgentEnrollmentTokenRepository tokenRepository;
    private final ServerRepository serverRepository;
    private final ServerAgentRepository agentRepository;
    private final ServerMetricRepository metricRepository;
    private final ActionRepository actionRepository;
    private final AlertService alertService;
    private final AuditService auditService;
    private final WebSocketService webSocketService;
    private final PasswordEncoder passwordEncoder;

    public AgentService(
            AgentEnrollmentTokenRepository tokenRepository,
            ServerRepository serverRepository,
            ServerAgentRepository agentRepository,
            ServerMetricRepository metricRepository,
            ActionRepository actionRepository,
            AlertService alertService,
            AuditService auditService,
            WebSocketService webSocketService,
            PasswordEncoder passwordEncoder) {
        this.tokenRepository = tokenRepository;
        this.serverRepository = serverRepository;
        this.agentRepository = agentRepository;
        this.metricRepository = metricRepository;
        this.actionRepository = actionRepository;
        this.alertService = alertService;
        this.auditService = auditService;
        this.webSocketService = webSocketService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AgentDTOs.AgentEnrollResponse enroll(AgentDTOs.AgentEnrollRequest req) {
        AgentEnrollmentToken token = tokenRepository.findByToken(req.getEnrollmentToken())
                .orElseThrow(() -> new RuntimeException("Invalid enrollment token"));

        if (!token.isValid()) {
            throw new RuntimeException("Enrollment token has expired or already been used");
        }

        UUID orgId = token.getOrganizationId();
        Server server;

        String displayName = (req.getDisplayName() != null && !req.getDisplayName().isBlank())
                ? req.getDisplayName() : req.getHostname();
        String ipAddress = (req.getIpAddress() != null && !req.getIpAddress().isBlank())
                ? req.getIpAddress() : "127.0.0.1";

        if (token.getServerId() != null) {
            server = serverRepository.findById(token.getServerId())
                    .orElseThrow(() -> new RuntimeException("Target server record missing"));
            server.setDisplayName(displayName);
            server.setIpAddress(ipAddress);
        } else {
            server = Server.builder()
                    .organizationId(orgId)
                    .hostname(req.getHostname())
                    .displayName(displayName)
                    .ipAddress(ipAddress)
                    .osName(req.getOsName() != null ? req.getOsName() : "Linux")
                    .osVersion(req.getOsVersion() != null ? req.getOsVersion() : "Ubuntu")
                    .agentVersion(req.getAgentVersion())
                    .status("ONLINE")
                    .lastSeenAt(OffsetDateTime.now())
                    .build();
            server = serverRepository.save(server);
        }

        server.setDisplayName(displayName);
        server.setIpAddress(ipAddress);
        server.setOsName(req.getOsName() != null ? req.getOsName() : "Linux");
        server.setOsVersion(req.getOsVersion() != null ? req.getOsVersion() : "Ubuntu");
        server.setAgentVersion(req.getAgentVersion());
        server.setStatus("ONLINE");
        server.setLastSeenAt(OffsetDateTime.now());
        serverRepository.save(server);

        String agentId = "ag_" + UUID.randomUUID().toString().replace("-", "");
        String rawSecret = UUID.randomUUID().toString() + UUID.randomUUID().toString();

        ServerAgent agent = ServerAgent.builder()
                .organizationId(orgId)
                .serverId(server.getId())
                .agentId(agentId)
                .credentialHash(passwordEncoder.encode(rawSecret))
                .enrolledAt(OffsetDateTime.now())
                .lastHeartbeatAt(OffsetDateTime.now())
                .build();
        agentRepository.save(agent);

        token.setUsedAt(OffsetDateTime.now());
        tokenRepository.save(token);

        auditService.recordAudit(orgId, null, "AGENT", "AGENT_ENROLLED", "SERVER", server.getId().toString(),
                String.format("{\"agentId\":\"%s\",\"hostname\":\"%s\"}", agentId, req.getHostname()));

        webSocketService.broadcastOrgEvent(orgId, "SERVER_STATUS_CHANGED", server.getId().toString(),
                Map.of("status", "ONLINE", "hostname", server.getHostname()));

        return AgentDTOs.AgentEnrollResponse.builder()
                .agentId(agentId)
                .agentToken(rawSecret)
                .serverId(server.getId())
                .organizationId(orgId)
                .build();
    }

    @Transactional
    public void processHeartbeat(String agentId) {
        ServerAgent agent = agentRepository.findByAgentId(agentId)
                .orElseThrow(() -> new RuntimeException("Unknown agent"));

        agent.setLastHeartbeatAt(OffsetDateTime.now());
        agentRepository.save(agent);

        Server server = serverRepository.findById(agent.getServerId()).orElse(null);
        if (server != null) {
            server.setLastSeenAt(OffsetDateTime.now());
            if ("OFFLINE".equalsIgnoreCase(server.getStatus())) {
                server.setStatus("ONLINE");
                webSocketService.broadcastOrgEvent(agent.getOrganizationId(), "SERVER_STATUS_CHANGED", server.getId().toString(),
                        Map.of("status", "ONLINE"));
            }
            serverRepository.save(server);
        }
    }

    @Transactional
    public void ingestMetrics(String agentId, AgentDTOs.MetricSubmissionRequest req) {
        ServerAgent agent = agentRepository.findByAgentId(agentId)
                .orElseThrow(() -> new RuntimeException("Unknown agent"));

        ServerMetric metric = ServerMetric.builder()
                .organizationId(agent.getOrganizationId())
                .serverId(agent.getServerId())
                .recordedAt(req.getTimestamp() != null ? req.getTimestamp() : OffsetDateTime.now())
                .cpuPercent(req.getCpuPercent())
                .memoryPercent(req.getMemoryPercent())
                .diskPercent(req.getDiskPercent())
                .load1m(req.getLoad1m())
                .load5m(req.getLoad5m() != null ? req.getLoad5m() : req.getLoad1m())
                .load15m(req.getLoad15m() != null ? req.getLoad15m() : req.getLoad1m())
                .networkInBytes(req.getNetworkInBytes() != null ? req.getNetworkInBytes() : 0L)
                .networkOutBytes(req.getNetworkOutBytes() != null ? req.getNetworkOutBytes() : 0L)
                .processCount(req.getProcessCount() != null ? req.getProcessCount() : 0)
                .build();

        metricRepository.save(metric);

        Server server = serverRepository.findById(agent.getServerId()).orElse(null);
        if (server != null) {
            server.setLastSeenAt(OffsetDateTime.now());
            if ("OFFLINE".equalsIgnoreCase(server.getStatus())) {
                server.setStatus("ONLINE");
            }
            if (req.getDockerContainers() != null && !req.getDockerContainers().isBlank()) {
                server.setDockerContainers(req.getDockerContainers());
            }
            if (req.getTopProcesses() != null && !req.getTopProcesses().isBlank()) {
                server.setTopProcesses(req.getTopProcesses());
            }
            if (req.getCriticalLogs() != null && !req.getCriticalLogs().isBlank()) {
                server.setCriticalLogs(req.getCriticalLogs());
            }
            if (req.getServicePlugins() != null && !req.getServicePlugins().isBlank()) {
                server.setServicePlugins(req.getServicePlugins());
            }
            serverRepository.save(server);
        }

        // Run alert threshold evaluator
        alertService.evaluateMetrics(agent.getOrganizationId(), agent.getServerId(), metric);

        // Broadcast real-time metric update
        webSocketService.broadcastOrgEvent(agent.getOrganizationId(), "METRIC_UPDATE", agent.getServerId().toString(),
                Map.of(
                        "cpu", metric.getCpuPercent(),
                        "memory", metric.getMemoryPercent(),
                        "disk", metric.getDiskPercent()
                ));
    }

    @Transactional
    public Optional<ActionEntity> getPendingActionForAgent(String agentId) {
        ServerAgent agent = agentRepository.findByAgentId(agentId)
                .orElseThrow(() -> new RuntimeException("Unknown agent"));

        Optional<ActionEntity> actionOpt = actionRepository.findFirstByServerIdAndStatusOrderByApprovedAtAsc(agent.getServerId(), "APPROVED");
        if (actionOpt.isPresent()) {
            ActionEntity act = actionOpt.get();
            act.setStatus("RUNNING");
            act.setStartedAt(OffsetDateTime.now());
            actionRepository.save(act);
            return Optional.of(act);
        }
        return Optional.empty();
    }

    @Transactional
    public void reportActionResult(String agentId, AgentDTOs.AgentActionResultRequest req) {
        ServerAgent agent = agentRepository.findByAgentId(agentId)
                .orElseThrow(() -> new RuntimeException("Unknown agent"));

        ActionEntity action = actionRepository.findByIdAndOrganizationId(req.getActionId(), agent.getOrganizationId())
                .orElseThrow(() -> new RuntimeException("Action not found"));

        action.setStatus(req.isVerified() ? "VERIFIED" : ("COMPLETED".equalsIgnoreCase(req.getStatus()) ? "COMPLETED" : "FAILED"));
        action.setCompletedAt(OffsetDateTime.now());
        if (req.isVerified()) {
            action.setVerifiedAt(OffsetDateTime.now());
        }
        action.setResult(String.format("{\"output\":%s,\"verified\":%b}",
                req.getOutput() != null ? "\"" + req.getOutput().replace("\"", "\\\"").replace("\n", "\\n") + "\"" : "\"\"",
                req.isVerified()));

        actionRepository.save(action);

        auditService.recordAudit(agent.getOrganizationId(), null, "AGENT", "ACTION_COMPLETED", "ACTION", action.getId().toString(),
                String.format("{\"verified\":%b,\"status\":\"%s\"}", req.isVerified(), action.getStatus()));

        webSocketService.broadcastOrgEvent(agent.getOrganizationId(), "ACTION_STATUS_CHANGED", action.getId().toString(),
                Map.of("status", action.getStatus(), "verified", req.isVerified()));
    }
}
