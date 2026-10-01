# NexusOps PostgreSQL Data Model

## Core entities

### organizations
- id UUID PK
- name
- slug UNIQUE
- plan
- status
- created_at
- updated_at

### users
- id UUID PK
- email UNIQUE
- password_hash
- display_name
- status
- created_at
- updated_at

### organization_members
- id UUID PK
- organization_id FK
- user_id FK
- role
- created_at
- UNIQUE(organization_id,user_id)

Roles:
- OWNER
- ADMIN
- OPERATOR
- VIEWER

### servers
- id UUID PK
- organization_id FK
- hostname
- display_name
- ip_address
- os_name
- os_version
- agent_version
- status
- last_seen_at
- created_at
- updated_at

Indexes:
- organization_id
- organization_id,status
- organization_id,last_seen_at

### server_agents
- id UUID PK
- organization_id FK
- server_id FK
- agent_id UNIQUE
- credential_hash
- enrolled_at
- last_heartbeat_at
- revoked_at

### server_metrics
Time-series oriented table:
- id BIGSERIAL
- organization_id
- server_id
- recorded_at
- cpu_percent
- memory_percent
- disk_percent
- load_1m
- network_in_bytes
- network_out_bytes

Indexes:
- (organization_id,server_id,recorded_at DESC)
- (server_id,recorded_at DESC)

Consider partitioning/retention as scale increases.

### services
- id UUID PK
- organization_id
- server_id
- name
- status
- port
- last_check_at

### alerts
- id UUID PK
- organization_id
- server_id
- service_id nullable
- severity
- type
- title
- description
- status
- fingerprint
- first_seen_at
- last_seen_at
- acknowledged_at
- resolved_at

Unique/deduplication strategy should use tenant + fingerprint + active state.

### incidents
- id UUID PK
- organization_id
- primary_server_id nullable
- severity
- status
- title
- summary
- opened_at
- acknowledged_at
- resolved_at

### incident_events
- id UUID PK
- organization_id
- incident_id
- event_type
- message
- metadata JSONB
- created_at

### ai_analyses
- id UUID PK
- organization_id
- incident_id
- provider
- model
- summary
- probable_cause
- confidence
- impact
- evidence JSONB
- recommendations JSONB
- created_at

### actions
- id UUID PK
- organization_id
- incident_id nullable
- server_id
- action_type
- risk_level
- status
- requested_by
- approved_by nullable
- parameters JSONB
- result JSONB
- requested_at
- approved_at
- started_at
- completed_at

### action_approvals
- id UUID PK
- organization_id
- action_id
- user_id
- decision
- comment
- created_at

### audit_logs
- id UUID PK
- organization_id nullable
- actor_user_id nullable
- actor_type
- event_type
- resource_type
- resource_id
- metadata JSONB
- ip_address
- created_at

Indexes:
- organization_id,created_at DESC
- organization_id,event_type
- organization_id,resource_type,resource_id

### subscriptions
- id UUID PK
- organization_id
- provider
- provider_customer_id
- provider_subscription_id
- plan
- status
- current_period_start
- current_period_end

### usage_records
- id UUID PK
- organization_id
- metric
- quantity
- period_start
- period_end

## Tenant isolation
Every repository/service method for organization-owned data must accept an organization context or derive it from the authenticated principal.

Do not rely solely on frontend filtering.

## Migrations
Use Flyway or Liquibase. Never modify an already-applied production migration; add a new migration.

## Retention
Recommended starting policy:
- raw metrics: 30–90 days
- audit logs: 1 year minimum
- incidents: retain long-term
- AI analyses: retain with incident
- action execution records: retain long-term
