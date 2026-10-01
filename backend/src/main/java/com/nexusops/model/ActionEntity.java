package com.nexusops.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "actions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "incident_id")
    private UUID incidentId;

    @Column(name = "server_id", nullable = false)
    private UUID serverId;

    @Column(name = "action_type", nullable = false, length = 100)
    private String actionType; // RESTART_SERVICE, ROTATE_LOGS, CLEAR_TEMP_FILES, CHECK_SERVICE_STATUS, COLLECT_DIAGNOSTICS

    @Column(name = "risk_level", nullable = false, length = 50)
    private String riskLevel; // SAFE, MODERATE, HIGH

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PROPOSED"; // PROPOSED, APPROVED, REJECTED, QUEUED, RUNNING, COMPLETED, VERIFIED, FAILED

    @Column(name = "requested_by", nullable = false)
    @Builder.Default
    private String requestedBy = "AI_ASSISTANT";

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String parameters = "{}"; // JSON string

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String result = "{}"; // JSON string

    @CreationTimestamp
    @Column(name = "requested_at", nullable = false, updatable = false)
    private OffsetDateTime requestedAt;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "verified_at")
    private OffsetDateTime verifiedAt;
}
