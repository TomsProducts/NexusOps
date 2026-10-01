package com.nexusops.service;

import com.nexusops.model.AuditLog;
import com.nexusops.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void recordAudit(
            UUID organizationId,
            UUID actorUserId,
            String actorType,
            String eventType,
            String resourceType,
            String resourceId,
            String metadataJson) {

        AuditLog log = AuditLog.builder()
                .organizationId(organizationId)
                .actorUserId(actorUserId)
                .actorType(actorType != null ? actorType : "SYSTEM")
                .eventType(eventType)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .metadata(metadataJson != null ? metadataJson : "{}")
                .build();

        auditLogRepository.save(log);
    }
}
