package com.nexusops.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_analyses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "incident_id", nullable = false)
    private UUID incidentId;

    @Column(nullable = false, length = 100)
    private String provider; // OPENAI, CLAUDE, MOCK

    @Column(nullable = false, length = 100)
    private String model;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(name = "probable_cause", nullable = false, columnDefinition = "TEXT")
    private String probableCause;

    @Column(nullable = false, precision = 4, scale = 3)
    private BigDecimal confidence;

    @Column(nullable = false, length = 50)
    private String impact; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(nullable = false, columnDefinition = "TEXT")
    private String evidence; // JSON string

    @Column(nullable = false, columnDefinition = "TEXT")
    private String recommendations; // JSON string

    @Column(columnDefinition = "TEXT")
    private String questions; // JSON string

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
