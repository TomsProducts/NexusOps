package com.nexusops.service;

import com.nexusops.dto.WsEventDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastOrgEvent(UUID orgId, String eventType, String resourceId, Map<String, Object> payload) {
        WsEventDTO event = WsEventDTO.builder()
                .type(eventType)
                .resourceId(resourceId)
                .payload(payload)
                .timestamp(OffsetDateTime.now())
                .build();

        messagingTemplate.convertAndSend("/topic/org-" + orgId, event);
    }
}
