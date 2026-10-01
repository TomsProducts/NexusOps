-- ==============================================================================
-- NexusOps Initial Seed Data
-- Valid hexadecimal UUIDs
-- ==============================================================================

-- 1. Demo Organization
INSERT INTO organizations (id, name, slug, plan, status, autonomous_mode)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'ACME Systems Inc',
    'acme-systems',
    'BUSINESS',
    'ACTIVE',
    'ASSIST'
) ON CONFLICT (slug) DO NOTHING;

-- 2. Demo User (Default password: "password")
INSERT INTO users (id, email, password_hash, display_name, status)
VALUES (
    '11111111-1111-1111-1111-111111110001',
    'admin@example.com',
    '$2a$10$S89EyLp.pH6hTBTSYUhhoOFd8XKKJGJnsWqZU3rHo8gjXPpJi.Pm2',
    'Thomas Dimakopoulos',
    'ACTIVE'
) ON CONFLICT (email) DO NOTHING;

-- 3. Membership
INSERT INTO organization_members (organization_id, user_id, role)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111110001',
    'OWNER'
) ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 4. Servers Fleet
INSERT INTO servers (id, organization_id, hostname, display_name, ip_address, os_name, os_version, agent_version, status, tags, last_seen_at)
VALUES 
(
    '22222222-2222-2222-2222-222222220001',
    'a0000000-0000-0000-0000-000000000001',
    'database01.prod.acme.lan',
    'database01',
    '10.0.1.12',
    'Ubuntu Linux',
    '24.04 LTS',
    '1.8.2',
    'CRITICAL',
    ARRAY['production', 'database', 'mariadb'],
    NOW()
),
(
    '22222222-2222-2222-2222-222222220002',
    'a0000000-0000-0000-0000-000000000001',
    'database02.prod.acme.lan',
    'database02',
    '10.0.1.13',
    'Ubuntu Linux',
    '24.04 LTS',
    '1.8.2',
    'ONLINE',
    ARRAY['production', 'replica'],
    NOW()
),
(
    '22222222-2222-2222-2222-222222220003',
    'a0000000-0000-0000-0000-000000000001',
    'api-server-02.prod.acme.lan',
    'api-server-02',
    '10.0.1.20',
    'Ubuntu Linux',
    '22.04 LTS',
    '1.8.2',
    'WARNING',
    ARRAY['production', 'api', 'backend'],
    NOW()
),
(
    '22222222-2222-2222-2222-222222220004',
    'a0000000-0000-0000-0000-000000000001',
    'web-01.prod.acme.lan',
    'web-01',
    '10.0.1.30',
    'Debian Linux',
    '12 Bookworm',
    '1.8.1',
    'ONLINE',
    ARRAY['production', 'frontend', 'nginx'],
    NOW()
) ON CONFLICT DO NOTHING;

-- 5. Monitored Services
INSERT INTO services (id, organization_id, server_id, name, service_type, status, port, last_check_at)
VALUES 
(
    '33333333-3333-3333-3333-333333330001',
    'a0000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222220001',
    'mariadb',
    'SYSTEMD',
    'RUNNING',
    3306,
    NOW()
),
(
    '33333333-3333-3333-3333-333333330002',
    'a0000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222220001',
    'nexusops-agent',
    'SYSTEMD',
    'RUNNING',
    NULL,
    NOW()
),
(
    '33333333-3333-3333-3333-333333330003',
    'a0000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222220001',
    'backup-daemon',
    'SYSTEMD',
    'DEGRADED',
    NULL,
    NOW()
) ON CONFLICT DO NOTHING;

-- 6. Recent Metrics for database01
INSERT INTO server_metrics (organization_id, server_id, recorded_at, cpu_percent, memory_percent, disk_percent, load_1m, load_5m, load_15m, network_in_bytes, network_out_bytes, process_count)
VALUES 
('a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222220001', NOW() - INTERVAL '15 minutes', 54.2, 70.1, 91.5, 3.4, 3.1, 2.8, 14200000, 28300000, 142),
('a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222220001', NOW() - INTERVAL '10 minutes', 58.7, 71.4, 92.8, 3.8, 3.4, 3.0, 16400000, 31200000, 145),
('a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222220001', NOW() - INTERVAL '5 minutes', 61.0, 72.0, 93.6, 4.1, 3.7, 3.2, 18900000, 35000000, 148),
('a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222220001', NOW(), 61.5, 72.3, 94.2, 4.2, 3.9, 3.4, 19200000, 36100000, 150);

-- 7. Active Alerts
INSERT INTO alerts (id, organization_id, server_id, service_id, severity, type, title, description, status, fingerprint)
VALUES 
(
    '44444444-4444-4444-4444-444444440001',
    'a0000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222220001',
    NULL,
    'CRITICAL',
    'DISK_FULL',
    'Database disk > 90% (currently 94%)',
    'Root partition storage usage exceeded critical threshold of 90%',
    'OPEN',
    '22222222-2222-2222-2222-222222220001:DISK_FULL:/'
),
(
    '44444444-4444-4444-4444-444444440002',
    'a0000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222220003',
    NULL,
    'WARNING',
    'MEM_HIGH',
    'API server memory > 80% (currently 86%)',
    'RAM consumption sustained above warning threshold for 14 minutes',
    'OPEN',
    '22222222-2222-2222-2222-222222220003:MEM_HIGH'
) ON CONFLICT DO NOTHING;

-- 8. Incidents
INSERT INTO incidents (id, incident_number, organization_id, primary_server_id, severity, status, title, summary, opened_at)
VALUES (
    '55555555-5555-5555-5555-555555550001',
    'INC-1042',
    'a0000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222220001',
    'CRITICAL',
    'OPEN',
    'Database01 disk usage at 94%',
    'Rapid binary log growth detected on database01 root filesystem. Storage exhaustion estimated in 7h 42m.',
    NOW() - INTERVAL '42 minutes'
) ON CONFLICT DO NOTHING;

-- 9. AI Analysis for INC-1042
INSERT INTO ai_analyses (id, organization_id, incident_id, provider, model, summary, probable_cause, confidence, impact, evidence, recommendations)
VALUES (
    '66666666-6666-6666-6666-666666660001',
    'a0000000-0000-0000-0000-000000000001',
    '55555555-5555-5555-5555-555555550001',
    '9ROUTER',
    'ag/gemini-3.8-flash',
    'Database01 disk reached 94%. Binary logs in /var/log/mysql are growing at 1.7 GB/hour due to an unpurged replication backlog.',
    'Binary log accumulation combined with delayed purge job',
    0.920,
    'HIGH',
    '[
        {"type": "DISK_USAGE", "value": "94%", "threshold": "90%"},
        {"type": "GROWTH_RATE", "value": "1.7GB/hour"},
        {"type": "PRIMARY_PATH", "value": "/var/log/mysql/binlog.*"},
        {"type": "TIME_TO_EXHAUSTION", "value": "7h 42m"}
    ]'::jsonb,
    '[
        {
            "actionType": "ROTATE_LOGS",
            "reason": "Flush and archive unpurged binary logs older than 48 hours to reclaim up to 34 GB immediately.",
            "risk": "SAFE",
            "requiresApproval": false
        },
        {
            "actionType": "COLLECT_DIAGNOSTICS",
            "reason": "Inspect slow queries and active transactions preventing binary log truncation.",
            "risk": "SAFE",
            "requiresApproval": false
        },
        {
            "actionType": "RESTART_SERVICE",
            "reason": "Restart MariaDB service to free dangling deleted file descriptors if disk does not clear.",
            "risk": "HIGH",
            "requiresApproval": true
        }
    ]'::jsonb
) ON CONFLICT DO NOTHING;

-- 10. Remediation Actions
INSERT INTO actions (id, organization_id, incident_id, server_id, action_type, risk_level, status, requested_by, parameters)
VALUES 
(
    '77777777-7777-7777-7777-777777770001',
    'a0000000-0000-0000-0000-000000000001',
    '55555555-5555-5555-5555-555555550001',
    '22222222-2222-2222-2222-222222220001',
    'ROTATE_LOGS',
    'SAFE',
    'APPROVED',
    'AI_ASSISTANT',
    '{"service": "mariadb", "retention_hours": 48}'::jsonb
),
(
    '77777777-7777-7777-7777-777777770002',
    'a0000000-0000-0000-0000-000000000001',
    NULL,
    '22222222-2222-2222-2222-222222220003',
    'COLLECT_DIAGNOSTICS',
    'SAFE',
    'PROPOSED',
    'AI_ASSISTANT',
    '{"component": "jvm-memory-dump"}'::jsonb
),
(
    '77777777-7777-7777-7777-777777770003',
    'a0000000-0000-0000-0000-000000000001',
    '55555555-5555-5555-5555-555555550001',
    '22222222-2222-2222-2222-222222220001',
    'RESTART_SERVICE',
    'HIGH',
    'PROPOSED',
    'AI_ASSISTANT',
    '{"service": "mariadb"}'::jsonb
) ON CONFLICT DO NOTHING;

-- 11. Audit Logs
INSERT INTO audit_logs (organization_id, actor_user_id, actor_type, event_type, resource_type, resource_id, metadata)
VALUES 
('a0000000-0000-0000-0000-000000000001', NULL, 'SYSTEM', 'SERVER_ENROLLED', 'SERVER', '22222222-2222-2222-2222-222222220001', '{"hostname": "database01"}'::jsonb),
('a0000000-0000-0000-0000-000000000001', NULL, 'AI_SYSTEM', 'INCIDENT_ANALYZED', 'INCIDENT', 'INC-1042', '{"confidence": 0.92, "cause": "Binary log growth"}'::jsonb),
('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111110001', 'USER', 'ACTION_APPROVED', 'ACTION', '77777777-7777-7777-7777-777777770001', '{"actionType": "ROTATE_LOGS"}'::jsonb);
