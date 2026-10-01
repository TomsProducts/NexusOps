package com.nexusops.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

public class AlertDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AlertDTO {
        private UUID id;
        private UUID serverId;
        private String serverName;
        private String severity; // INFO, WARNING, CRITICAL
        private String type;
        private String title;
        private String description;
        private String status; // OPEN, ACKNOWLEDGED, RESOLVED
        private OffsetDateTime firstSeenAt;
        private OffsetDateTime lastSeenAt;
    }
}
