package com.nexusops.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ActionDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActionDTO {
        private UUID id;
        private UUID incidentId;
        private String incidentNumber;
        private UUID serverId;
        private String serverName;
        private String actionType;
        private String riskLevel; // SAFE, MODERATE, HIGH
        private String status; // PROPOSED, APPROVED, REJECTED, RUNNING, COMPLETED, VERIFIED, FAILED
        private String requestedBy;
        private String parameters;
        private String result;
        private OffsetDateTime requestedAt;
        private OffsetDateTime approvedAt;
        private OffsetDateTime verifiedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateActionRequest {
        private UUID incidentId;
        private UUID serverId;
        private String actionType;
        private String riskLevel;
        private String parameters;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApproveActionRequest {
        private String decision; // APPROVED, REJECTED
        private String comment;
    }
}
