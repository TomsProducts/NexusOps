package com.nexusops.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class ServerDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ServerDTO {
        private UUID id;
        private String hostname;
        private String displayName;
        private String ipAddress;
        private String osName;
        private String osVersion;
        private String agentVersion;
        private String status; // ONLINE, WARNING, CRITICAL, OFFLINE
        private OffsetDateTime lastSeenAt;
        private BigDecimal currentCpu;
        private BigDecimal currentMemory;
        private BigDecimal currentDisk;
        private String dockerContainers;
        private String topProcesses;
        private String criticalLogs;
        private String servicePlugins;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterServerRequest {
        private String hostname;
        private String displayName;
        private String ipAddress;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EnrollmentTokenResponse {
        private String token;
        private OffsetDateTime expiresAt;
        private String installCommand;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ServerDetailDTO {
        private ServerDTO server;
        private List<MetricPointDTO> metricsHistory;
        private List<ServiceDTO> services;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MetricPointDTO {
        private OffsetDateTime timestamp;
        private BigDecimal cpu;
        private BigDecimal memory;
        private BigDecimal disk;
        private BigDecimal load1m;
        private long networkIn;
        private long networkOut;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ServiceDTO {
        private UUID id;
        private String name;
        private String serviceType;
        private String status;
        private Integer port;
        private OffsetDateTime lastCheckAt;
    }
}
