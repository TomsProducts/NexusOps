package com.nexusops.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "server_id", nullable = false)
    private UUID serverId;

    @Column(name = "service_id")
    private UUID serviceId;

    @Column(nullable = false, length = 50)
    private String severity; // INFO, WARNING, CRITICAL

    @Column(nullable = false, length = 100)
    private String type; // CPU_HIGH, MEM_HIGH, DISK_FULL, SERVICE_DOWN, PING_FAIL

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "OPEN"; // OPEN, ACKNOWLEDGED, RESOLVED

    @Column(nullable = false)
    private String fingerprint;

    @CreationTimestamp
    @Column(name = "first_seen_at", nullable = false, updatable = false)
    private OffsetDateTime firstSeenAt;

    @Column(name = "last_seen_at", nullable = false)
    private OffsetDateTime lastSeenAt;

    @Column(name = "acknowledged_at")
    private OffsetDateTime acknowledgedAt;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;
}
