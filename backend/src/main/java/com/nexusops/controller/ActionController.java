package com.nexusops.controller;

import com.nexusops.dto.ActionDTOs;
import com.nexusops.service.ActionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/actions")
public class ActionController {

    private final ActionService actionService;

    public ActionController(ActionService actionService) {
        this.actionService = actionService;
    }

    @GetMapping
    public ResponseEntity<List<ActionDTOs.ActionDTO>> getActions(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(actionService.getActions(status));
    }

    @GetMapping("/{actionId}")
    public ResponseEntity<ActionDTOs.ActionDTO> getAction(@PathVariable UUID actionId) {
        return ResponseEntity.ok(actionService.getAction(actionId));
    }

    @PostMapping
    public ResponseEntity<ActionDTOs.ActionDTO> createAction(@RequestBody ActionDTOs.CreateActionRequest request) {
        UUID orgId = com.nexusops.config.TenantContext.getTenantId();
        return ResponseEntity.ok(actionService.proposeAction(orgId, request));
    }

    @PostMapping("/{actionId}/approve")
    public ResponseEntity<ActionDTOs.ActionDTO> approve(
            @PathVariable UUID actionId,
            @AuthenticationPrincipal String userIdStr,
            @RequestBody(required = false) ActionDTOs.ApproveActionRequest request) {

        UUID userId = (userIdStr != null) ? UUID.fromString(userIdStr) : null;
        ActionDTOs.ApproveActionRequest req = (request != null) ? request : new ActionDTOs.ApproveActionRequest("APPROVED", "Approved via console");
        return ResponseEntity.ok(actionService.approveAction(actionId, userId, req));
    }

    @PostMapping("/{actionId}/reject")
    public ResponseEntity<ActionDTOs.ActionDTO> reject(
            @PathVariable UUID actionId,
            @AuthenticationPrincipal String userIdStr,
            @RequestBody(required = false) ActionDTOs.ApproveActionRequest request) {

        UUID userId = (userIdStr != null) ? UUID.fromString(userIdStr) : null;
        ActionDTOs.ApproveActionRequest req = (request != null) ? request : new ActionDTOs.ApproveActionRequest("REJECTED", "Rejected via console");
        return ResponseEntity.ok(actionService.approveAction(actionId, userId, req));
    }
}
