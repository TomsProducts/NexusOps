package com.nexusops.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WsEventDTO {
    private String type; // SERVER_STATUS_CHANGED, METRIC_UPDATE, INCIDENT_CREATED, AI_ANALYSIS_COMPLETED, ACTION_STATUS_CHANGED
    private String resourceId;
    private Map<String, Object> payload;
    private OffsetDateTime timestamp;
}
