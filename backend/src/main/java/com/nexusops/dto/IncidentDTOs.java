package com.nexusops.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class IncidentDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IncidentDTO {
        private UUID id;
        private String incidentNumber;
        private UUID primaryServerId;
        private String primaryServerName;
        private String severity;
        private String status;
        private String title;
        private String summary;
        private OffsetDateTime openedAt;
        private OffsetDateTime acknowledgedAt;
        private OffsetDateTime resolvedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IncidentDetailDTO {
        private IncidentDTO incident;
        private List<IncidentEventDTO> timeline;
        private AiDTOs.AiAnalysisDTO latestAiAnalysis;
        private List<ActionDTOs.ActionDTO> relatedActions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IncidentEventDTO {
        private UUID id;
        private String eventType;
        private String message;
        private OffsetDateTime createdAt;
    }
}
