-- ==============================================================================
-- NexusOps Database Schema (PostgreSQL)
-- Version: 1.0.0
-- Reference: NexusOps_DATABASE.md & NexusOps_Product_Specification.md
-- Multi-Tenant AI IT Operations Platform
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Organizations & Tenancy
-- ==============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'STARTER', -- STARTER, BUSINESS, PRO, ENTERPRISE
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, TRIAL
    autonomous_mode VARCHAR(50) NOT NULL DEFAULT 'ASSIST', -- OBSERVE, ASSIST, AUTONOMOUS
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- ==============================================================================
-- 2. Users & Memberships
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DISABLED, PENDING
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'OPERATOR', -- OWNER, ADMIN, OPERATOR, VIEWER
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_org_member UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);

-- ==============================================================================
-- 3. Servers & Hardware Inventory
-- ==============================================================================

CREATE TABLE IF NOT EXISTS servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hostname VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    ip_address VARCHAR(64) NOT NULL,
    os_name VARCHAR(100) DEFAULT 'Linux',
    os_version VARCHAR(100),
    agent_version VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'OFFLINE', -- ONLINE, WARNING, CRITICAL, OFFLINE, MAINTENANCE
    tags TEXT[] DEFAULT '{}',
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servers_org ON servers(organization_id);
CREATE INDEX IF NOT EXISTS idx_servers_org_status ON servers(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_servers_org_last_seen ON servers(organization_id, last_seen_at);

-- ==============================================================================
-- 4. Server Agents & Enrollment Credentials
-- ==============================================================================

CREATE TABLE IF NOT EXISTS server_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    agent_id VARCHAR(128) UNIQUE NOT NULL,
    credential_hash VARCHAR(255) NOT NULL,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_heartbeat_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_server_agents_agent_id ON server_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_server_agents_org_server ON server_agents(organization_id, server_id);

CREATE TABLE IF NOT EXISTS agent_enrollment_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    server_id UUID REFERENCES servers(id) ON DELETE SET NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_tokens_token ON agent_enrollment_tokens(token);

-- ==============================================================================
-- 5. Time-Series Metrics
-- ==============================================================================

CREATE TABLE IF NOT EXISTS server_metrics (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cpu_percent NUMERIC(5,2) NOT NULL,
    memory_percent NUMERIC(5,2) NOT NULL,
    disk_percent NUMERIC(5,2) NOT NULL,
    load_1m NUMERIC(6,2) NOT NULL,
    load_5m NUMERIC(6,2) NOT NULL DEFAULT 0.0,
    load_15m NUMERIC(6,2) NOT NULL DEFAULT 0.0,
    network_in_bytes BIGINT NOT NULL DEFAULT 0,
    network_out_bytes BIGINT NOT NULL DEFAULT 0,
    process_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_metrics_org_server_time ON server_metrics(organization_id, server_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_server_time ON server_metrics(server_id, recorded_at DESC);

-- ==============================================================================
-- 6. Monitored Services & Endpoints
-- ==============================================================================

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) DEFAULT 'SYSTEMD', -- SYSTEMD, DOCKER, HTTP, TCP
    status VARCHAR(50) NOT NULL DEFAULT 'RUNNING', -- RUNNING, STOPPED, DEGRADED, FAILED
    port INT,
    check_url VARCHAR(512),
    last_check_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_org_server ON services(organization_id, server_id);

-- ==============================================================================
-- 7. Alerts & Incidents
-- ==============================================================================

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    severity VARCHAR(50) NOT NULL, -- INFO, WARNING, CRITICAL
    type VARCHAR(100) NOT NULL, -- CPU_HIGH, MEM_HIGH, DISK_FULL, SERVICE_DOWN, PING_FAIL
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, ACKNOWLEDGED, RESOLVED
    fingerprint VARCHAR(255) NOT NULL,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_org_status ON alerts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_fingerprint ON alerts(organization_id, fingerprint, status);

CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_number VARCHAR(50) NOT NULL, -- e.g. INC-1042
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    primary_server_id UUID REFERENCES servers(id) ON DELETE SET NULL,
    severity VARCHAR(50) NOT NULL, -- WARNING, CRITICAL
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, INVESTIGATING, MITIGATED, RESOLVED
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_incidents_org_status ON incidents(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_org_opened ON incidents(organization_id, opened_at DESC);

CREATE TABLE IF NOT EXISTS incident_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- CREATED, ALERT_CORRELATED, AI_ANALYZED, ACTION_PROPOSED, ACTION_EXECUTED, RESOLVED
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_events_incident ON incident_events(incident_id, created_at ASC);

-- ==============================================================================
-- 8. AI Analyses & Operations Engine
-- ==============================================================================

CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL DEFAULT 'OPENAI', -- OPENAI, CLAUDE, MOCK
    model VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    probable_cause TEXT NOT NULL,
    confidence NUMERIC(4,3) NOT NULL, -- e.g. 0.920
    impact VARCHAR(50) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    questions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_incident ON ai_analyses(incident_id, created_at DESC);

-- ==============================================================================
-- 9. Remediation Actions & Approval Workflow
-- ==============================================================================

CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL, -- RESTART_SERVICE, ROTATE_LOGS, CLEAR_TEMP_FILES, CHECK_SERVICE_STATUS, COLLECT_DIAGNOSTICS
    risk_level VARCHAR(50) NOT NULL, -- SAFE, MODERATE, HIGH
    status VARCHAR(50) NOT NULL DEFAULT 'PROPOSED', -- PROPOSED, APPROVED, REJECTED, QUEUED, RUNNING, COMPLETED, VERIFIED, FAILED
    requested_by VARCHAR(255) NOT NULL DEFAULT 'AI_ASSISTANT',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    result JSONB DEFAULT '{}'::jsonb,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_actions_org_status ON actions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_actions_server ON actions(server_id, requested_at DESC);

CREATE TABLE IF NOT EXISTS action_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    decision VARCHAR(50) NOT NULL, -- APPROVED, REJECTED
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_approvals_action ON action_approvals(action_id);

-- ==============================================================================
-- 10. Audit Logging
-- ==============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_type VARCHAR(50) NOT NULL, -- USER, AGENT, AI_SYSTEM, SYSTEM
    event_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_org_time ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_logs(organization_id, event_type);

-- ==============================================================================
-- 11. Subscriptions & Billing
-- ==============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'STRIPE',
    provider_customer_id VARCHAR(255),
    provider_subscription_id VARCHAR(255),
    plan VARCHAR(50) NOT NULL DEFAULT 'STARTER',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric VARCHAR(100) NOT NULL, -- SERVER_COUNT, AI_INVESTIGATIONS, ACTION_EXECUTIONS
    quantity INT NOT NULL DEFAULT 0,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL
);
