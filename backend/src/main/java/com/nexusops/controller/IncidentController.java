package com.nexusops.controller;

import com.nexusops.dto.IncidentDTOs;
import com.nexusops.service.IncidentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping
    public ResponseEntity<List<IncidentDTOs.IncidentDTO>> getIncidents(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(incidentService.getIncidents(status));
    }

    @GetMapping("/{incidentId}")
    public ResponseEntity<IncidentDTOs.IncidentDetailDTO> getIncidentDetail(@PathVariable UUID incidentId) {
        return ResponseEntity.ok(incidentService.getIncidentDetail(incidentId));
    }

    @PostMapping("/{incidentId}/acknowledge")
    public ResponseEntity<Void> acknowledge(@PathVariable UUID incidentId) {
        incidentService.acknowledgeIncident(incidentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{incidentId}/resolve")
    public ResponseEntity<Void> resolve(@PathVariable UUID incidentId) {
        incidentService.resolveIncident(incidentId);
        return ResponseEntity.ok().build();
    }
}
