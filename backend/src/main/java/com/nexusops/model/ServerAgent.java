package com.nexusops.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "server_agents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServerAgent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "server_id", nullable = false)
    private UUID serverId;

    @Column(name = "agent_id", nullable = false, unique = true, length = 128)
    private String agentId;

    @Column(name = "credential_hash", nullable = false)
    private String credentialHash;

    @CreationTimestamp
    @Column(name = "enrolled_at", nullable = false, updatable = false)
    private OffsetDateTime enrolledAt;

    @Column(name = "last_heartbeat_at")
    private OffsetDateTime lastHeartbeatAt;

    @Column(name = "revoked_at")
    private OffsetDateTime revokedAt;
}
