package com.nexusops.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class AiDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AiAnalysisDTO {
        private UUID id;
        private UUID incidentId;
        private String provider;
        private String model;
        private String summary;
        private String probableCause;
        private BigDecimal confidence;
        private String impact;
        private List<AiEvidenceDTO> evidence;
        private List<AiRecommendationDTO> recommendations;
        private OffsetDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AiEvidenceDTO {
        private String type;
        private String value;
        private String threshold;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AiRecommendationDTO {
        private String actionType;
        private String reason;
        private String risk; // SAFE, MODERATE, HIGH
        private boolean requiresApproval;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiChatRequest {
        private String message;
        private UUID serverId;
        private UUID incidentId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AiChatResponse {
        private String reply;
        private List<AiRecommendationDTO> suggestedActions;
    }
}
