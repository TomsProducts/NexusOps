package com.nexusops.repository;

import com.nexusops.model.ActionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ActionRepository extends JpaRepository<ActionEntity, UUID> {
    List<ActionEntity> findByOrganizationIdAndStatus(UUID organizationId, String status);
    Page<ActionEntity> findByOrganizationIdOrderByRequestedAtDesc(UUID organizationId, Pageable pageable);
    Optional<ActionEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);
    List<ActionEntity> findByServerIdAndStatus(UUID serverId, String status);
    Optional<ActionEntity> findFirstByServerIdAndStatusOrderByApprovedAtAsc(UUID serverId, String status);
}
