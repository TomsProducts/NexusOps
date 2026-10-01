package com.nexusops.repository;

import com.nexusops.model.Server;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServerRepository extends JpaRepository<Server, UUID> {
    List<Server> findByOrganizationId(UUID organizationId);
    Page<Server> findByOrganizationId(UUID organizationId, Pageable pageable);
    Optional<Server> findByIdAndOrganizationId(UUID id, UUID organizationId);
    long countByOrganizationId(UUID organizationId);
    long countByOrganizationIdAndStatus(UUID organizationId, String status);
}
