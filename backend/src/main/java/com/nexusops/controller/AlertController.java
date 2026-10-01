package com.nexusops.controller;

import com.nexusops.dto.AlertDTOs;
import com.nexusops.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public ResponseEntity<List<AlertDTOs.AlertDTO>> getAlerts(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(alertService.getAlerts(status));
    }

    @PostMapping("/{alertId}/acknowledge")
    public ResponseEntity<Void> acknowledgeAlert(@PathVariable UUID alertId) {
        alertService.acknowledgeAlert(alertId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{alertId}/resolve")
    public ResponseEntity<Void> resolveAlert(@PathVariable UUID alertId) {
        alertService.resolveAlert(alertId);
        return ResponseEntity.ok().build();
    }
}
