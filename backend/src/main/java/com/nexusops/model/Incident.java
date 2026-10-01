package com.nexusops.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "incidents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "incident_number", nullable = false, length = 50)
    private String incidentNumber;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "primary_server_id")
    private UUID primaryServerId;

    @Column(nullable = false, length = 50)
    private String severity; // WARNING, CRITICAL

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "OPEN"; // OPEN, INVESTIGATING, MITIGATED, RESOLVED

    @Column(nullable = false)
    private String title;

    private String summary;

    @CreationTimestamp
    @Column(name = "opened_at", nullable = false, updatable = false)
    private OffsetDateTime openedAt;

    @Column(name = "acknowledged_at")
    private OffsetDateTime acknowledgedAt;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;
}
