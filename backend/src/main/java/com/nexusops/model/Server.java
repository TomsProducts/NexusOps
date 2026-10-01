package com.nexusops.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "servers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Server {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(nullable = false)
    private String hostname;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "ip_address", nullable = false, length = 64)
    private String ipAddress;

    @Column(name = "os_name", length = 100)
    @Builder.Default
    private String osName = "Linux";

    @Column(name = "os_version", length = 100)
    private String osVersion;

    @Column(name = "agent_version", length = 50)
    private String agentVersion;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "OFFLINE"; // ONLINE, WARNING, CRITICAL, OFFLINE, MAINTENANCE

    @Column(name = "last_seen_at")
    private OffsetDateTime lastSeenAt;

    @Column(name = "docker_containers", columnDefinition = "TEXT")
    private String dockerContainers;

    @Column(name = "top_processes", columnDefinition = "TEXT")
    private String topProcesses;

    @Column(name = "critical_logs", columnDefinition = "TEXT")
    private String criticalLogs;

    @Column(name = "service_plugins", columnDefinition = "TEXT")
    private String servicePlugins;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
