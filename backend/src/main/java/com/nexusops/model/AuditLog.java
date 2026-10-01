package com.nexusops.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "actor_user_id")
    private UUID actorUserId;

    @Column(name = "actor_type", nullable = false, length = 50)
    private String actorType; // USER, AGENT, AI_SYSTEM, SYSTEM

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "resource_type", nullable = false, length = 100)
    private String resourceType;

    @Column(name = "resource_id", nullable = false)
    private String resourceId;

    @Column(columnDefinition = "TEXT")
    private String metadata; // JSON string

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
