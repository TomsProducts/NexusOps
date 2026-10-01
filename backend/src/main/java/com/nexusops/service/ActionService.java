package com.nexusops.service;

import com.nexusops.config.TenantContext;
import com.nexusops.dto.ActionDTOs;
import com.nexusops.dto.DashboardDTOs;
import com.nexusops.dto.IncidentDTOs;
import com.nexusops.dto.ServerDTOs;
import com.nexusops.model.*;
import com.nexusops.repository.*;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ActionService {

    private static final Set<String> ALLOWED_ACTION_TYPES = Set.of(
            "RESTART_SERVICE",
            "ROTATE_LOGS",
            "CLEAR_TEMP_FILES",
            "CHECK_SERVICE_STATUS",
            "COLLECT_DIAGNOSTICS",
            "DOCKER_LIST_CONTAINERS",
            "DOCKER_GET_LOGS",
            "DOCKER_RESTART_CONTAINER",
            "GET_PROCESS_LIST",
            "GET_CRITICAL_LOGS"
    );

    private final ActionRepository actionRepository;
    private final ActionApprovalRepository approvalRepository;
    private final OrganizationRepository organizationRepository;
    private final ServerRepository serverRepository;
    private final IncidentRepository incidentRepository;
    private final AuditService auditService;
    private final WebSocketService webSocketService;
    private final ServerService serverService;
    private final IncidentService incidentService;

    public ActionService(
            ActionRepository actionRepository,
            ActionApprovalRepository approvalRepository,
            OrganizationRepository organizationRepository,
            ServerRepository serverRepository,
            IncidentRepository incidentRepository,
            AuditService auditService,
            WebSocketService webSocketService,
            @Lazy ServerService serverService,
            @Lazy IncidentService incidentService) {
        this.actionRepository = actionRepository;
        this.approvalRepository = approvalRepository;
        this.organizationRepository = organizationRepository;
        this.serverRepository = serverRepository;
        this.incidentRepository = incidentRepository;
        this.auditService = auditService;
        this.webSocketService = webSocketService;
        this.serverService = serverService;
        this.incidentService = incidentService;
    }

    @Transactional(readOnly = true)
    public List<ActionDTOs.ActionDTO> getActions(String status) {
        UUID orgId = TenantContext.getTenantId();
        List<ActionEntity> actions = (status != null && !status.isBlank())
                ? actionRepository.findByOrganizationIdAndStatus(orgId, status.toUpperCase())
                : actionRepository.findByOrganizationIdAndStatus(orgId, "PROPOSED");

        return actions.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ActionDTOs.ActionDTO getAction(UUID actionId) {
        UUID orgId = TenantContext.getTenantId();
        ActionEntity action = actionRepository.findByIdAndOrganizationId(actionId, orgId)
                .orElseThrow(() -> new RuntimeException("Action not found"));
        return mapToDTO(action);
    }

    @Transactional
    public ActionDTOs.ActionDTO dispatchAction(UUID orgId, UUID serverId, String actionType, String parameters) {
        if (!ALLOWED_ACTION_TYPES.contains(actionType)) {
            throw new RuntimeException("Action type '" + actionType + "' is not permitted.");
        }

        ActionEntity action = ActionEntity.builder()
                .organizationId(orgId)
                .serverId(serverId)
                .actionType(actionType)
                .riskLevel("SAFE")
                .status("APPROVED")
                .requestedBy("CONSOLE_OPERATOR")
                .parameters(parameters != null && !parameters.isBlank() ? parameters : "{}")
                .approvedAt(OffsetDateTime.now())
                .build();

        ActionEntity saved = actionRepository.save(action);

        auditService.recordAudit(orgId, null, "USER", "ACTION_DISPATCHED", "ACTION", saved.getId().toString(),
                String.format("{\"actionType\":\"%s\",\"serverId\":\"%s\"}", actionType, serverId));

        webSocketService.broadcastOrgEvent(orgId, "ACTION_STATUS_CHANGED", saved.getId().toString(),
                Map.of("actionType", actionType, "status", "APPROVED"));

        return mapToDTO(saved);
    }

    @Transactional
    public ActionDTOs.ActionDTO proposeAction(UUID orgId, ActionDTOs.CreateActionRequest req) {
        if (!ALLOWED_ACTION_TYPES.contains(req.getActionType())) {
            throw new RuntimeException("Action type '" + req.getActionType() + "' is not permitted.");
        }

        Organization org = organizationRepository.findById(orgId).orElse(null);
        boolean isAutonomous = org != null && "AUTONOMOUS".equalsIgnoreCase(org.getAutonomousMode());
        boolean isSafe = "SAFE".equalsIgnoreCase(req.getRiskLevel());

        String initialStatus = (isAutonomous && isSafe) ? "APPROVED" : "PROPOSED";

        ActionEntity action = ActionEntity.builder()
                .organizationId(orgId)
                .incidentId(req.getIncidentId())
                .serverId(req.getServerId())
                .actionType(req.getActionType())
                .riskLevel(req.getRiskLevel())
                .status(initialStatus)
                .requestedBy("AI_ASSISTANT")
                .parameters(req.getParameters() != null ? req.getParameters() : "{}")
                .approvedAt(initialStatus.equals("APPROVED") ? OffsetDateTime.now() : null)
                .build();

        ActionEntity saved = actionRepository.save(action);

        auditService.recordAudit(orgId, null, "AI_SYSTEM", "ACTION_PROPOSED", "ACTION", saved.getId().toString(),
                String.format("{\"actionType\":\"%s\",\"risk\":\"%s\",\"autoApproved\":%b}",
                        req.getActionType(), req.getRiskLevel(), initialStatus.equals("APPROVED")));

        webSocketService.broadcastOrgEvent(orgId, "ACTION_STATUS_CHANGED", saved.getId().toString(),
                Map.of("actionType", req.getActionType(), "status", initialStatus));

        return mapToDTO(saved);
    }

    @Transactional
    public ActionDTOs.ActionDTO approveAction(UUID actionId, UUID userId, ActionDTOs.ApproveActionRequest req) {
        UUID orgId = TenantContext.getTenantId();
        ActionEntity action = actionRepository.findByIdAndOrganizationId(actionId, orgId)
                .orElseThrow(() -> new RuntimeException("Action not found"));

        if (!"PROPOSED".equals(action.getStatus())) {
            throw new RuntimeException("Action is not in PROPOSED state");
        }

        String decision = (req.getDecision() != null) ? req.getDecision().toUpperCase() : "APPROVED";
        action.setStatus(decision);
        if ("APPROVED".equals(decision)) {
            action.setApprovedAt(OffsetDateTime.now());
            action.setApprovedBy(userId);
        }
        actionRepository.save(action);

        ActionApproval approval = ActionApproval.builder()
                .organizationId(orgId)
                .actionId(actionId)
                .userId(userId)
                .decision(decision)
                .comment(req.getComment())
                .build();
        approvalRepository.save(approval);

        auditService.recordAudit(orgId, userId, "USER", "ACTION_" + decision, "ACTION", actionId.toString(),
                String.format("{\"comment\":\"%s\"}", req.getComment() != null ? req.getComment() : ""));

        webSocketService.broadcastOrgEvent(orgId, "ACTION_STATUS_CHANGED", actionId.toString(),
                Map.of("status", decision));

        return mapToDTO(action);
    }

    @Transactional(readOnly = true)
    public DashboardDTOs.DashboardSummaryDTO getDashboardSummary() {
        UUID orgId = TenantContext.getTenantId();
        List<ServerDTOs.ServerDTO> servers = serverService.getServers();
        List<IncidentDTOs.IncidentDTO> activeIncidents = incidentService.getIncidents("OPEN");
        List<ActionDTOs.ActionDTO> pendingActions = getActions("PROPOSED");

        long totalServers = servers.size();
        long healthy = servers.stream().filter(s -> "ONLINE".equalsIgnoreCase(s.getStatus())).count();
        long warning = servers.stream().filter(s -> "WARNING".equalsIgnoreCase(s.getStatus())).count();
        long critical = servers.stream().filter(s -> "CRITICAL".equalsIgnoreCase(s.getStatus())).count();

        // Calculate health score: 100 - (critical * 15) - (warning * 5)
        int health = 100 - (int)(critical * 15) - (int)(warning * 5);
        if (health < 0) health = 0;

        List<DashboardDTOs.ActivityItemDTO> activity = List.of(
                DashboardDTOs.ActivityItemDTO.builder().id("1").type("ALERT").title("Database disk > 90%").timeAgo("2m ago").status("CRITICAL").build(),
                DashboardDTOs.ActivityItemDTO.builder().id("2").type("AI").title("AI Analysis completed for INC-1042").timeAgo("5m ago").status("SAFE").build(),
                DashboardDTOs.ActivityItemDTO.builder().id("3").type("ACTION").title("Remediation proposed: ROTATE_LOGS").timeAgo("7m ago").status("APPROVED").build()
        );

        return DashboardDTOs.DashboardSummaryDTO.builder()
                .systemHealth(health)
                .totalServers(totalServers)
                .healthyServers(healthy)
                .warningServers(warning)
                .criticalServers(critical)
                .totalServices(142)
                .uptimePercent(99.98)
                .openIncidentsCount(activeIncidents.size())
                .pendingApprovalsCount(pendingActions.size())
                .servers(servers)
                .activeIncidents(activeIncidents)
                .pendingActions(pendingActions)
                .recentActivity(activity)
                .build();
    }

    private ActionDTOs.ActionDTO mapToDTO(ActionEntity a) {
        Server server = serverRepository.findById(a.getServerId()).orElse(null);
        Incident incident = a.getIncidentId() != null ? incidentRepository.findById(a.getIncidentId()).orElse(null) : null;

        return ActionDTOs.ActionDTO.builder()
                .id(a.getId())
                .incidentId(a.getIncidentId())
                .incidentNumber(incident != null ? incident.getIncidentNumber() : null)
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
