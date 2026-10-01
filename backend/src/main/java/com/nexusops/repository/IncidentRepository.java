package com.nexusops.repository;

import com.nexusops.model.Incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, UUID> {
    List<Incident> findByOrganizationIdAndStatus(UUID organizationId, String status);
    Page<Incident> findByOrganizationIdOrderByOpenedAtDesc(UUID organizationId, Pageable pageable);
    Optional<Incident> findByIdAndOrganizationId(UUID id, UUID organizationId);
    long countByOrganizationIdAndStatus(UUID organizationId, String status);
    long countByOrganizationIdAndSeverityAndStatus(UUID organizationId, String severity, String status);
}
