package com.nexusops.controller;

import com.nexusops.dto.AiDTOs;
import com.nexusops.model.Incident;
import com.nexusops.repository.IncidentRepository;
import com.nexusops.service.AiEngineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiEngineService aiEngineService;
    private final IncidentRepository incidentRepository;

    public AiController(AiEngineService aiEngineService, IncidentRepository incidentRepository) {
        this.aiEngineService = aiEngineService;
        this.incidentRepository = incidentRepository;
    }

    @PostMapping("/incidents/{incidentId}/analyze")
    public ResponseEntity<AiDTOs.AiAnalysisDTO> triggerAnalysis(@PathVariable UUID incidentId) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident not found"));
        return ResponseEntity.ok(aiEngineService.investigateIncident(incident));
    }

    @PostMapping("/chat")
    public ResponseEntity<AiDTOs.AiChatResponse> chat(@RequestBody AiDTOs.AiChatRequest request) {
        return ResponseEntity.ok(aiEngineService.chat(request));
    }
}
