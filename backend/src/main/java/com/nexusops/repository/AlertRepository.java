package com.nexusops.repository;

import com.nexusops.model.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlertRepository extends JpaRepository<Alert, UUID> {
    List<Alert> findByOrganizationIdAndStatus(UUID organizationId, String status);
    Page<Alert> findByOrganizationIdOrderByLastSeenAtDesc(UUID organizationId, Pageable pageable);
    Optional<Alert> findByIdAndOrganizationId(UUID id, UUID organizationId);
    Optional<Alert> findByOrganizationIdAndFingerprintAndStatus(UUID organizationId, String fingerprint, String status);
    long countByOrganizationIdAndStatus(UUID organizationId, String status);
}
