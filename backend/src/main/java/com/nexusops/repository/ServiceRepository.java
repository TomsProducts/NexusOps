package com.nexusops.repository;

import com.nexusops.model.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceEntity, UUID> {
    List<ServiceEntity> findByOrganizationIdAndServerId(UUID organizationId, UUID serverId);
    Optional<ServiceEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
