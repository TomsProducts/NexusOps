package com.nexusops.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "server_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServerMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "server_id", nullable = false)
    private UUID serverId;

    @Column(name = "recorded_at", nullable = false)
    private OffsetDateTime recordedAt;

    @Column(name = "cpu_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal cpuPercent;

    @Column(name = "memory_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal memoryPercent;

    @Column(name = "disk_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal diskPercent;

    @Column(name = "load_1m", nullable = false, precision = 6, scale = 2)
    private BigDecimal load1m;

    @Column(name = "load_5m", nullable = false, precision = 6, scale = 2)
    private BigDecimal load5m;

    @Column(name = "load_15m", nullable = false, precision = 6, scale = 2)
    private BigDecimal load15m;

    @Column(name = "network_in_bytes", nullable = false)
    private Long networkInBytes;

    @Column(name = "network_out_bytes", nullable = false)
    private Long networkOutBytes;

    @Column(name = "process_count")
    private Integer processCount;
}
