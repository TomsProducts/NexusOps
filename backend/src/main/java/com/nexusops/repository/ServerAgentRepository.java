package com.nexusops.repository;

import com.nexusops.model.ServerAgent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServerAgentRepository extends JpaRepository<ServerAgent, UUID> {
    Optional<ServerAgent> findByAgentId(String agentId);
    Optional<ServerAgent> findByOrganizationIdAndServerId(UUID organizationId, UUID serverId);
}
