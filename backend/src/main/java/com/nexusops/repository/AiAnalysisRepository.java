package com.nexusops.repository;

import com.nexusops.model.AiAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiAnalysisRepository extends JpaRepository<AiAnalysis, UUID> {
    List<AiAnalysis> findByIncidentIdOrderByCreatedAtDesc(UUID incidentId);
    Optional<AiAnalysis> findTopByIncidentIdOrderByCreatedAtDesc(UUID incidentId);
}
