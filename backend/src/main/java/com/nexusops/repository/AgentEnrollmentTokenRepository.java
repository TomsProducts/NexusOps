package com.nexusops.repository;

import com.nexusops.model.AgentEnrollmentToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgentEnrollmentTokenRepository extends JpaRepository<AgentEnrollmentToken, UUID> {
    Optional<AgentEnrollmentToken> findByToken(String token);
}
