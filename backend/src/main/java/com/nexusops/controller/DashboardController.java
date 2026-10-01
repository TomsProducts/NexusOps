package com.nexusops.controller;

import com.nexusops.dto.DashboardDTOs;
import com.nexusops.service.ActionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ActionService actionService;

    public DashboardController(ActionService actionService) {
        this.actionService = actionService;
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardDTOs.DashboardSummaryDTO> getSummary() {
        return ResponseEntity.ok(actionService.getDashboardSummary());
    }
}
