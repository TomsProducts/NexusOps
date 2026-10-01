package com.nexusops.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class AgentDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgentEnrollRequest {
        @JsonProperty("enrollment_token")
        private String enrollmentToken;

        private String hostname;

        @JsonProperty("display_name")
        private String displayName;

        @JsonProperty("ip_address")
        private String ipAddress;

        @JsonProperty("os_name")
        private String osName;

        @JsonProperty("os_version")
        private String osVersion;

        @JsonProperty("agent_version")
        private String agentVersion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AgentEnrollResponse {
        @JsonProperty("agent_id")
        private String agentId;

        @JsonProperty("agent_token")
        private String agentToken;

        @JsonProperty("server_id")
        private UUID serverId;

        @JsonProperty("organization_id")
        private UUID organizationId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HeartbeatRequest {
        @JsonProperty("agent_id")
        private String agentId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricSubmissionRequest {
        private OffsetDateTime timestamp;

        @JsonProperty("cpu_percent")
        private BigDecimal cpuPercent;

        @JsonProperty("memory_percent")
        private BigDecimal memoryPercent;

        @JsonProperty("disk_percent")
        private BigDecimal diskPercent;

        @JsonProperty("load_1m")
        private BigDecimal load1m;

        @JsonProperty("load_5m")
        private BigDecimal load5m;

        @JsonProperty("load_15m")
        private BigDecimal load15m;

        @JsonProperty("network_in_bytes")
        private Long networkInBytes;

        @JsonProperty("network_out_bytes")
        private Long networkOutBytes;

        @JsonProperty("process_count")
        private Integer processCount;

        @JsonProperty("docker_containers")
        private String dockerContainers;

        @JsonProperty("top_processes")
        private String topProcesses;

        @JsonProperty("critical_logs")
        private String criticalLogs;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgentActionResultRequest {
        @JsonProperty("action_id")
        private UUID actionId;

        private String status; // COMPLETED, FAILED, VERIFIED
        private String output;
        private boolean verified;
    }
}
