package com.nexusops.repository;

import com.nexusops.model.ServerMetric;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ServerMetricRepository extends JpaRepository<ServerMetric, Long> {
    List<ServerMetric> findByOrganizationIdAndServerIdAndRecordedAtBetweenOrderByRecordedAtDesc(
            UUID organizationId, UUID serverId, OffsetDateTime from, OffsetDateTime to, Pageable pageable);

    List<ServerMetric> findTop20ByOrganizationIdAndServerIdOrderByRecordedAtDesc(
            UUID organizationId, UUID serverId);
}
