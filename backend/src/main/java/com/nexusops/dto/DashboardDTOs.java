package com.nexusops.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class DashboardDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardSummaryDTO {
        private int systemHealth; // e.g. 92
        private long totalServers;
        private long healthyServers;
        private long warningServers;
        private long criticalServers;
        private long totalServices;
        private double uptimePercent; // e.g. 99.98
        private long openIncidentsCount;
        private long pendingApprovalsCount;

        private List<ServerDTOs.ServerDTO> servers;
        private List<IncidentDTOs.IncidentDTO> activeIncidents;
        private List<ActionDTOs.ActionDTO> pendingActions;
        private List<ActivityItemDTO> recentActivity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActivityItemDTO {
        private String id;
        private String type; // ALERT, INCIDENT, ACTION, AGENT, AI
        private String title;
        private String timeAgo;
        private String status;
    }
}
