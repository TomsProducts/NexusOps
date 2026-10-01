package com.nexusops.controller;

import com.nexusops.config.TenantContext;
import com.nexusops.dto.AuthDTOs;
import com.nexusops.model.Organization;
import com.nexusops.repository.OrganizationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private final OrganizationRepository organizationRepository;

    public OrganizationController(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    @GetMapping("/current")
    public ResponseEntity<AuthDTOs.OrganizationDTO> getCurrentOrg() {
        UUID orgId = TenantContext.getTenantId();
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        return ResponseEntity.ok(AuthDTOs.OrganizationDTO.builder()
                .id(org.getId())
                .name(org.getName())
                .slug(org.getSlug())
                .plan(org.getPlan())
                .autonomousMode(org.getAutonomousMode())
                .build());
    }
}
