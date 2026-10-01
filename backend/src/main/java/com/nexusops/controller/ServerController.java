package com.nexusops.controller;

import com.nexusops.dto.ServerDTOs;
import com.nexusops.service.ServerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/servers")
public class ServerController {

    private final ServerService serverService;
    private final com.nexusops.service.ActionService actionService;

    public ServerController(ServerService serverService, com.nexusops.service.ActionService actionService) {
        this.serverService = serverService;
        this.actionService = actionService;
    }

    @GetMapping
    public ResponseEntity<List<ServerDTOs.ServerDTO>> getServers() {
        return ResponseEntity.ok(serverService.getServers());
    }

    @PostMapping
    public ResponseEntity<ServerDTOs.ServerDTO> registerServer(@RequestBody ServerDTOs.RegisterServerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(serverService.registerServer(request));
    }

    @GetMapping("/{serverId}")
    public ResponseEntity<ServerDTOs.ServerDetailDTO> getServerDetail(@PathVariable UUID serverId) {
        return ResponseEntity.ok(serverService.getServerDetail(serverId));
    }

    @PostMapping("/{serverId}/agent-token")
    public ResponseEntity<ServerDTOs.EnrollmentTokenResponse> createToken(@PathVariable UUID serverId) {
        return ResponseEntity.ok(serverService.createEnrollmentToken(serverId));
    }

    @PostMapping("/{serverId}/actions/dispatch")
    public ResponseEntity<com.nexusops.dto.ActionDTOs.ActionDTO> dispatchAction(
            @PathVariable UUID serverId,
            @RequestBody com.nexusops.dto.ActionDTOs.CreateActionRequest request) {
        UUID orgId = com.nexusops.config.TenantContext.getTenantId();
        return ResponseEntity.ok(actionService.dispatchAction(orgId, serverId, request.getActionType(), request.getParameters()));
    }
}
