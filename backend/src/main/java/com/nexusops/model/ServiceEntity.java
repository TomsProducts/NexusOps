package com.nexusops.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "server_id", nullable = false)
    private UUID serverId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "service_type", length = 50)
    @Builder.Default
    private String serviceType = "SYSTEMD"; // SYSTEMD, DOCKER, HTTP, TCP

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "RUNNING"; // RUNNING, STOPPED, DEGRADED, FAILED

    private Integer port;

    @Column(name = "check_url", length = 512)
    private String checkUrl;

    @Column(name = "last_check_at")
    private OffsetDateTime lastCheckAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
