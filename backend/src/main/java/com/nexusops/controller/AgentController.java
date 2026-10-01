package com.nexusops.controller;

import com.nexusops.dto.AgentDTOs;
import com.nexusops.model.ActionEntity;
import com.nexusops.service.AgentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/agent")
public class AgentController {

    private final AgentService agentService;

    public AgentController(AgentService agentService) {
        this.agentService = agentService;
    }

    @PostMapping("/enroll")
    public ResponseEntity<AgentDTOs.AgentEnrollResponse> enroll(@RequestBody AgentDTOs.AgentEnrollRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(agentService.enroll(request));
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<Void> heartbeat(@RequestHeader("X-Agent-ID") String agentId) {
        agentService.processHeartbeat(agentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/metrics")
    public ResponseEntity<Void> metrics(
            @RequestHeader("X-Agent-ID") String agentId,
            @RequestBody AgentDTOs.MetricSubmissionRequest request) {
        agentService.ingestMetrics(agentId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/actions/pending")
    public ResponseEntity<?> pollActions(@RequestHeader("X-Agent-ID") String agentId) {
        Optional<ActionEntity> actionOpt = agentService.getPendingActionForAgent(agentId);
        if (actionOpt.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        ActionEntity action = actionOpt.get();
        return ResponseEntity.ok(Map.of(
                "action_id", action.getId(),
                "action_type", action.getActionType(),
                "parameters", action.getParameters(),
                "timeout_sec", 60
        ));
    }

    @PostMapping("/action-result")
    public ResponseEntity<Void> reportActionResult(
            @RequestHeader("X-Agent-ID") String agentId,
            @RequestBody AgentDTOs.AgentActionResultRequest request) {
        agentService.reportActionResult(agentId, request);
        return ResponseEntity.ok().build();
    }
}
