# NexusOps — AI IT Assistant for Small Companies
## Product, Architecture & Build Specification
**Document version:** 1.0  
**Status:** Build-ready MVP specification  
**Working product name:** NexusOps

---

## 1. Executive Summary

NexusOps is a multi-tenant SaaS platform that monitors small-company IT infrastructure, detects incidents, explains root causes using AI, recommends remediation, and—when explicitly permitted—executes safe operational actions through a lightweight server agent.

The product consists of:

1. **NexusOps Web Console**
   - Infrastructure dashboard
   - Servers and services
   - Alerts and incidents
   - AI assistant
   - Remediation approvals
   - Audit logs
   - Users/RBAC
   - Billing

2. **NexusOps Android App**
   - Mobile infrastructure overview
   - Push notifications
   - Incident investigation
   - AI assistant
   - Remediation approval/rejection

3. **NexusOps Agent**
   - Lightweight Linux daemon for MVP
   - Server metrics
   - Service health
   - HTTP checks
   - Docker monitoring
   - Secure command execution
   - Heartbeats
   - Agent registration

4. **NexusOps Cloud**
   - API
   - Authentication
   - Multi-tenancy
   - Metrics ingestion
   - Alert engine
   - Incident engine
   - AI orchestration
   - Agent command broker
   - Billing
   - Notifications
   - Audit system

### Product promise

> **NexusOps tells a small company's IT team what is wrong, why it is happening, what should be done, and—when authorized—can safely fix it.**

It is intentionally simpler than enterprise platforms such as Datadog, Splunk, or large ITSM suites.

---

# 2. Target Market

## Primary customer

Small companies with approximately:

- 5–100 employees
- 1–150 servers/services
- No dedicated 24/7 infrastructure team
- One IT administrator or small IT team
- Linux/Windows servers
- Docker workloads
- Cloud or on-premise infrastructure

## Secondary customer

Small MSPs / IT support companies managing infrastructure for multiple customers.

Example:

```text
MSP
├── Customer A
│   ├── 12 servers
│   └── 70 services
├── Customer B
│   ├── 8 servers
│   └── 41 services
└── Customer C
    ├── 25 servers
    └── 130 services
```

The MSP model should be supported architecturally even if it is not exposed in the first public MVP.

---

# 3. Core Product Concept

Traditional monitoring:

```text
CPU = 94%
```

NexusOps:

```text
CRITICAL — Production Server

CPU has remained above 90% for 17 minutes.

The Java process is consuming 82% CPU.

Traffic increased 43% during the last hour.

Application health checks remain successful.

AI assessment:
Likely traffic-related rather than a server failure.

Recommendation:
Continue monitoring for 10 minutes.
If CPU remains above 90%, investigate application scaling.
```

The product should convert raw telemetry into useful operational information.

---

# 4. Product Principles

1. **Useful before clever**
2. **AI explains telemetry; it does not blindly control infrastructure**
3. **Every automated action is policy-controlled**
4. **High-risk operations require explicit approval**
5. **Every action is auditable**
6. **Least privilege by default**
7. **Multi-tenant isolation is mandatory**
8. **The agent should be lightweight**
9. **The system must remain useful if AI is temporarily unavailable**
10. **The MVP must be commercially deployable, not merely a demo**

---

# 5. MVP Scope

## Included

### Infrastructure

- Linux servers
- CPU
- RAM
- Disk
- Load
- Network
- Processes
- System services
- HTTP/HTTPS checks
- SSL certificate expiration
- Docker containers
- Docker resource usage

### Platform

- Organizations
- Users
- Authentication
- Roles
- Agent registration
- Server inventory
- Metrics
- Alerts
- Incidents
- AI analysis
- Recommendations
- Remediation approvals
- Audit logs
- Notifications
- Billing

### Android

- Login
- Dashboard
- Servers
- Alerts
- Incidents
- Push notifications
- AI chat
- Approve/reject remediation

### Web

- Dashboard
- Server inventory
- Server details
- Metrics
- Alerts
- Incidents
- AI assistant
- Action approvals
- Audit log
- Settings
- Billing

---

# 6. Explicit MVP Non-Goals

Do NOT build these in the first release:

- Full SIEM
- Full EDR
- Full vulnerability scanner
- Full enterprise ITSM
- Kubernetes management
- Network device configuration
- Windows agent
- Automatic firewall changes
- Automatic database schema changes
- Arbitrary shell execution by AI
- Arbitrary package installation by AI
- Fully autonomous infrastructure administration

These can be added later.

---

# 7. High-Level Architecture

```text
                         INTERNET
                             |
                        Cloudflare
                             |
                        Load Balancer
                             |
                         API Gateway
                             |
             +---------------+---------------+
             |                               |
        Web Application                 Mobile API
             |                               |
             +---------------+---------------+
                             |
                    NexusOps Backend
                             |
       +---------------------+----------------------+
       |                     |                      |
 Authentication        Monitoring Engine       AI Engine
       |                     |                      |
       |              +------+-------+              |
       |              |              |              |
       |           Metrics        Alerts         AI Tools
       |              |              |              |
       +--------------+------+-------+--------------+
                             |
                  +----------+----------+
                  |                     |
              PostgreSQL              Redis
                  |
             Object Storage
                  |
        +---------+----------+
        |                    |
   Agent Gateway       Notification Service
        |
   WebSocket / HTTPS
        |
  +-----+-----+-----+
  |           |     |
Linux Agent  ...  future agents
```

---

# 8. Recommended Technology Stack

## Web

Recommended:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui or equivalent component system
- Recharts or equivalent charting library

## Backend

Recommended:

- Java 21
- Spring Boot 3.x
- Spring Security
- Spring Data JPA
- PostgreSQL
- Redis
- WebSocket support

Alternative backend languages are acceptable if the coding agent has a strong reason, but the implementation should remain strongly typed and production-oriented.

## Agent

Recommended:

- Go

Reasons:

- Single binary
- Low memory consumption
- Excellent concurrency
- Easy cross-platform future support
- Good system/network libraries
- Simple deployment

## Android

Recommended:

- Kotlin
- Jetpack Compose
- Android modern architecture
- Firebase Cloud Messaging for push notifications

## AI

Use a provider abstraction.

```text
AIProvider
├── OpenAIProvider
├── FutureProvider
└── MockAIProvider
```

The application must not hard-code the AI vendor throughout the business logic.

## Billing

Use Stripe for:

- subscriptions
- checkout
- customer portal
- invoices
- webhooks

Implement a billing abstraction so the provider can later be changed.

## Infrastructure

Initial deployment:

- Docker
- Docker Compose for development/small deployment
- PostgreSQL
- Redis
- Object storage
- Reverse proxy
- CI/CD

Production can later move to Kubernetes if required.

---

# 9. System Components

## 9.1 API Service

Responsibilities:

- Authentication
- Organizations
- Users
- Servers
- Agents
- Metrics queries
- Alerts
- Incidents
- AI requests
- Action approvals
- Audit logs
- Billing
- Notifications

## 9.2 Agent Gateway

Responsibilities:

- Agent authentication
- Heartbeats
- Metrics ingestion
- Command delivery
- Command result ingestion
- Agent connection state

## 9.3 Monitoring Engine

Responsibilities:

- Threshold evaluation
- Health checks
- SSL checks
- Alert generation
- Alert deduplication
- Incident correlation
- Incident lifecycle

## 9.4 AI Engine

Responsibilities:

- Incident analysis
- Root-cause hypotheses
- Summaries
- Recommendations
- Natural-language infrastructure queries
- Tool calls
- Remediation plans

## 9.5 Action Engine

Responsibilities:

- Validate action
- Apply policy
- Determine approval requirement
- Dispatch command
- Track execution
- Record result
- Create audit record

---

# 10. Multi-Tenancy

Every customer is an organization.

```text
Organization
├── Users
├── Agents
├── Servers
├── Services
├── Alerts
├── Incidents
├── Actions
├── Audit Logs
└── Subscription
```

Every tenant-owned database entity must contain:

```text
organization_id
```

All queries must be tenant-scoped.

Never trust an organization ID supplied by the frontend.

Derive organization membership from the authenticated user/session.

Recommended isolation strategy for MVP:

- Shared PostgreSQL database
- Shared schema
- Mandatory `organization_id`
- Repository/service-level tenant filtering
- Automated integration tests for cross-tenant access

---

# 11. Authentication

Use:

- Email/password
- Secure password hashing
- Access token
- Refresh token
- Optional future OAuth

Passwords:

- Argon2id or bcrypt
- Never store plaintext

Tokens:

- Short-lived access token
- Rotating refresh token
- Refresh token revocation

Security features:

- Login rate limiting
- Account lockout/rate protection
- Email verification
- Password reset
- Optional MFA in later release

---

# 12. Roles

Initial roles:

## OWNER

Full organization control.

## ADMIN

Infrastructure and user administration.

## OPERATOR

Can:

- View infrastructure
- Investigate incidents
- Approve allowed operational actions

Cannot:

- Manage billing
- Delete organization

## VIEWER

Read-only.

---

# 13. Core Data Model

## organizations

```text
id UUID PK
name VARCHAR
slug VARCHAR UNIQUE
status VARCHAR
created_at TIMESTAMP
updated_at TIMESTAMP
```

## users

```text
id UUID PK
email VARCHAR UNIQUE
password_hash VARCHAR
name VARCHAR
status VARCHAR
created_at TIMESTAMP
updated_at TIMESTAMP
```

## organization_users

```text
organization_id UUID FK
user_id UUID FK
role VARCHAR
created_at TIMESTAMP

PRIMARY KEY (organization_id, user_id)
```

## agents

```text
id UUID PK
organization_id UUID FK
name VARCHAR
hostname VARCHAR
platform VARCHAR
agent_version VARCHAR
status VARCHAR
last_seen_at TIMESTAMP
registered_at TIMESTAMP
token_hash VARCHAR
metadata JSONB
created_at TIMESTAMP
updated_at TIMESTAMP
```

## servers

```text
id UUID PK
organization_id UUID FK
agent_id UUID FK
name VARCHAR
hostname VARCHAR
ip_address VARCHAR
operating_system VARCHAR
environment VARCHAR
status VARCHAR
tags JSONB
created_at TIMESTAMP
updated_at TIMESTAMP
```

## services

```text
id UUID PK
organization_id UUID FK
server_id UUID FK
name VARCHAR
type VARCHAR
status VARCHAR
configuration JSONB
created_at TIMESTAMP
updated_at TIMESTAMP
```

## metrics

For MVP, metrics can be stored using a time-series-friendly relational structure.

```text
id BIGSERIAL PK
organization_id UUID
server_id UUID
metric_name VARCHAR
metric_value DOUBLE PRECISION
timestamp TIMESTAMP
labels JSONB
```

Indexes:

```text
(server_id, metric_name, timestamp)
(organization_id, timestamp)
```

For large deployments, migrate metrics to TimescaleDB or another time-series system without changing the public API.

## alerts

```text
id UUID PK
organization_id UUID
server_id UUID
service_id UUID NULL
type VARCHAR
severity VARCHAR
status VARCHAR
title VARCHAR
description TEXT
metric_name VARCHAR NULL
threshold JSONB
first_seen_at TIMESTAMP
last_seen_at TIMESTAMP
resolved_at TIMESTAMP NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

## incidents

```text
id UUID PK
organization_id UUID
title VARCHAR
severity VARCHAR
status VARCHAR
summary TEXT
ai_analysis TEXT
ai_confidence DOUBLE PRECISION
started_at TIMESTAMP
resolved_at TIMESTAMP NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

## incident_alerts

```text
incident_id UUID
alert_id UUID
PRIMARY KEY (incident_id, alert_id)
```

## recommendations

```text
id UUID PK
organization_id UUID
incident_id UUID
title VARCHAR
description TEXT
risk_level VARCHAR
requires_approval BOOLEAN
action_type VARCHAR NULL
parameters JSONB
status VARCHAR
created_at TIMESTAMP
```

## actions

```text
id UUID PK
organization_id UUID
server_id UUID
incident_id UUID NULL
recommendation_id UUID NULL
requested_by UUID NULL
approved_by UUID NULL
action_type VARCHAR
parameters JSONB
risk_level VARCHAR
status VARCHAR
command_reference VARCHAR
requested_at TIMESTAMP
approved_at TIMESTAMP NULL
started_at TIMESTAMP NULL
completed_at TIMESTAMP NULL
result JSONB NULL
```

## audit_logs

```text
id BIGSERIAL PK
organization_id UUID
user_id UUID NULL
actor_type VARCHAR
actor_id VARCHAR
event_type VARCHAR
resource_type VARCHAR
resource_id VARCHAR
details JSONB
ip_address VARCHAR NULL
created_at TIMESTAMP
```

Audit logs must be append-only.

---

# 14. Agent Architecture

The Linux agent is a small daemon.

```text
nexus-agent
│
├── config
├── authentication
├── heartbeat
├── metrics
│   ├── cpu
│   ├── memory
│   ├── disk
│   ├── network
│   ├── process
│   └── load
├── services
├── docker
├── http
├── command
├── policy
├── transport
└── logging
```

The agent should run as a dedicated OS user.

It should not run arbitrary commands received from the internet.

---

# 15. Agent Registration

Installation flow:

```text
Admin
  |
  | Create Agent
  v
NexusOps
  |
  | Generates one-time registration token
  v
User installs agent
  |
  | nexus-agent register --token XXXX
  v
NexusOps
  |
  | validates token
  v
Agent identity created
```

Registration token:

- One-time use
- Short expiration
- Stored hashed
- Never displayed again after registration

The agent receives a long-lived credential or certificate after successful registration.

---

# 16. Agent Heartbeat

Default:

```text
30 seconds
```

Heartbeat contains:

```json
{
  "agentId": "uuid",
  "timestamp": "ISO-8601",
  "agentVersion": "1.0.0",
  "hostname": "web01",
  "status": "healthy"
}
```

Server considers an agent offline after a configurable period, initially:

```text
3 × heartbeat interval
```

---

# 17. Metrics

Default collection:

```text
CPU:
5 seconds

Memory:
5 seconds

Disk:
30 seconds

Network:
30 seconds

Processes:
30 seconds

Services:
30 seconds

Docker:
30 seconds

HTTP checks:
30 seconds
```

The agent should batch metrics before sending them.

Example:

```json
{
  "agentId": "uuid",
  "metrics": [
    {
      "name": "cpu.usage",
      "value": 82.4,
      "timestamp": "..."
    },
    {
      "name": "memory.usage",
      "value": 64.1,
      "timestamp": "..."
    }
  ]
}
```

---

# 18. Default Alert Thresholds

These are defaults, not hard-coded limits.

## CPU

Warning:

```text
> 80% for 10 minutes
```

Critical:

```text
> 90% for 10 minutes
```

## Memory

Warning:

```text
> 80% for 10 minutes
```

Critical:

```text
> 90% for 10 minutes
```

## Disk

Warning:

```text
> 80%
```

Critical:

```text
> 90%
```

Emergency:

```text
> 95%
```

## Agent

Warning/offline:

```text
No heartbeat for 90 seconds
```

## SSL

Warning:

```text
<= 30 days
```

Critical:

```text
<= 7 days
```

## Service

Critical:

```text
Configured service stopped unexpectedly
```

## Docker

Warning:

```text
Container restarted > 3 times within 1 hour
```

Critical:

```text
Container unhealthy
```

---

# 19. Alert Deduplication

Do not generate hundreds of alerts for the same problem.

Example:

```text
CPU 95%
CPU 96%
CPU 94%
CPU 97%
```

should become:

```text
ONE ALERT

High CPU usage
First detected: 14:32
Last observed: 14:47
Peak: 97%
```

Alert state:

```text
OPEN
ACKNOWLEDGED
RESOLVED
```

---

# 20. Incident Correlation

Multiple alerts should be grouped.

Example:

```text
Disk 94%
     +
MySQL errors
     +
API database errors
     +
Application latency
```

Instead of four unrelated incidents:

```text
INCIDENT

Production database storage exhaustion
```

The AI receives all correlated evidence.

---

# 21. AI Architecture

Do not allow the LLM to directly execute shell commands.

Use:

```text
User / Alert
     |
     v
AI Orchestrator
     |
     +--> Context Builder
     |
     +--> Tool Registry
     |
     +--> LLM
     |
     v
Structured AI Response
     |
     v
Policy Engine
     |
     +--> Recommendation
     |
     +--> Approval
     |
     +--> Execution
```

---

# 22. AI Tools

The AI should have typed tools.

Examples:

```text
get_server_status(server_id)

get_recent_metrics(server_id, metric, duration)

get_service_status(server_id, service)

get_processes(server_id)

get_docker_containers(server_id)

get_docker_logs(server_id, container)

get_http_check(check_id)

get_recent_alerts(server_id)

get_incident_history(server_id)

get_disk_usage(server_id)

get_ssl_certificate(check_id)
```

Action tools:

```text
restart_service(server_id, service)

restart_container(server_id, container)

clear_temp_files(server_id)

renew_certificate(check_id)
```

Dangerous tools should initially be absent.

---

# 23. AI Output Contract

The AI should return structured data.

Example:

```json
{
  "summary": "Database server is approaching disk capacity.",
  "severity": "CRITICAL",
  "confidence": 0.92,
  "evidence": [
    "Disk usage is 94%",
    "Usage increased 6% in 2 hours",
    "MySQL binary logs increased rapidly"
  ],
  "possible_causes": [
    {
      "cause": "Binary log accumulation",
      "confidence": 0.82
    }
  ],
  "recommendations": [
    {
      "title": "Inspect binary log retention",
      "risk": "LOW",
      "requiresApproval": true
    }
  ]
}
```

Never parse free-form AI text to decide whether to execute a command.

---

# 24. AI Confidence

Confidence is informational only.

Suggested interpretation:

```text
0.00–0.49 = weak
0.50–0.74 = moderate
0.75–0.89 = strong
0.90–1.00 = very strong
```

The AI must never treat confidence alone as authorization.

---

# 25. Remediation Safety Levels

## SAFE

Examples:

- Restart failed web service
- Restart unhealthy Docker container
- Clear known temporary files
- Renew supported certificate

May be auto-executed if the organization explicitly enables the action.

## MODERATE

Examples:

- Restart application stack
- Rotate logs
- Restart non-critical service

Require approval by default.

## HIGH

Examples:

- Restart database
- Reboot server
- Modify configuration
- Change firewall
- Delete persistent data

Always require explicit approval in MVP.

## FORBIDDEN IN MVP

- Arbitrary shell commands generated by AI
- Destructive database commands
- Firewall rule modifications
- User creation/deletion
- Credential extraction
- Security control disabling

---

# 26. Action Lifecycle

```text
PROPOSED
   |
   +----> REJECTED
   |
   v
PENDING_APPROVAL
   |
   +----> EXPIRED
   |
   v
APPROVED
   |
   v
QUEUED
   |
   v
RUNNING
   |
   +----> FAILED
   |
   v
SUCCEEDED
```

Every transition is logged.

---

# 27. Action Approval UX

Web:

```text
AI RECOMMENDATION

Restart nginx on web01

Reason:
Nginx is unresponsive to health checks.

Risk:
LOW

Expected impact:
Existing HTTP connections may briefly reset.

[Approve] [Reject]
```

Android should provide the same essential approval.

---

# 28. Secure Command Execution

The agent maintains an allowlist.

Example:

```yaml
allowed_actions:
  restart_service:
    services:
      - nginx
      - apache2
      - ssh
  restart_container:
    enabled: true
  clear_temp:
    enabled: true
```

The cloud sends an action type and structured parameters, not arbitrary shell text.

Example:

```json
{
  "action": "restart_service",
  "service": "nginx"
}
```

Agent maps that to a local implementation.

The agent must reject unknown action types.

---

# 29. Agent-to-Cloud Security

Prefer:

- TLS 1.2+
- Agent credential authentication
- Credential rotation
- Request signing where appropriate
- Replay protection
- Server-side authorization
- Short-lived command tokens
- Command IDs
- Nonces/timestamps

Never transmit secrets in logs.

---

# 30. Web Application Screens

## 30.1 Login

- Email
- Password
- Forgot password
- Register

## 30.2 Dashboard

Display:

- Overall health
- Servers
- Online/offline
- Critical alerts
- Active incidents
- Recent AI findings
- Resource trends

## 30.3 Servers

Table:

```text
Name
Status
OS
CPU
RAM
Disk
Agent
Last Seen
```

Filters:

- Status
- Environment
- Tags

## 30.4 Server Detail

Sections:

- Overview
- CPU
- Memory
- Disk
- Network
- Processes
- Services
- Docker
- HTTP checks
- Alerts
- Incidents
- Actions
- Agent

## 30.5 Incidents

Show:

- Timeline
- Alerts
- Metrics
- AI analysis
- Evidence
- Recommendations
- Actions

## 30.6 AI Assistant

Chat interface with infrastructure context.

Examples:

```text
"What is wrong?"

"Why is the database slow?"

"Show me servers with high disk usage."

"Which certificates expire this month?"

"Investigate web01."
```

## 30.7 Audit Log

Filters:

- Actor
- Action
- Resource
- Date
- Result

---

# 31. Android Screens

Minimum:

1. Login
2. Dashboard
3. Servers
4. Server detail
5. Alerts
6. Incident detail
7. AI assistant
8. Approval screen
9. Profile/settings

Push notification:

```text
NexusOps

🔴 Critical incident

Database01 disk usage reached 94%.

Tap to investigate.
```

Approval notification:

```text
NexusOps

AI recommends restarting nginx on web01.

Risk: LOW

[Review]
```

---

# 32. Notifications

Channels:

- Critical incidents
- Warnings
- Agent offline
- Approval requests
- Resolution notifications

Delivery:

- Web notifications
- Android push
- Email in later MVP phase

Notification preferences must be configurable per user.

---

# 33. API Design

Base:

```text
/api/v1
```

Authentication:

```text
Authorization: Bearer <token>
```

## Authentication

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
```

## Organizations

```text
GET /organizations/current
PATCH /organizations/current
```

## Users

```text
GET /organizations/current/users
POST /organizations/current/users
PATCH /organizations/current/users/{id}
DELETE /organizations/current/users/{id}
```

## Agents

```text
POST /agents/registration-token
GET /agents
GET /agents/{id}
DELETE /agents/{id}
```

## Servers

```text
GET /servers
POST /servers
GET /servers/{id}
PATCH /servers/{id}
DELETE /servers/{id}
```

## Metrics

```text
GET /servers/{id}/metrics
```

Parameters:

```text
metric
from
to
interval
```

## Alerts

```text
GET /alerts
GET /alerts/{id}
POST /alerts/{id}/acknowledge
POST /alerts/{id}/resolve
```

## Incidents

```text
GET /incidents
GET /incidents/{id}
POST /incidents/{id}/analyze
POST /incidents/{id}/resolve
```

## AI

```text
POST /ai/chat
POST /ai/incidents/{id}/analyze
```

## Actions

```text
GET /actions
GET /actions/{id}
POST /actions/{id}/approve
POST /actions/{id}/reject
```

## Audit

```text
GET /audit-logs
```

## Billing

```text
GET /billing/subscription
POST /billing/checkout
POST /billing/portal
```

---

# 34. WebSocket

WebSocket endpoint:

```text
/ws
```

Events:

```text
SERVER_STATUS_CHANGED
METRIC_ALERT
ALERT_CREATED
ALERT_RESOLVED
INCIDENT_CREATED
INCIDENT_UPDATED
AI_ANALYSIS_COMPLETED
ACTION_REQUESTED
ACTION_APPROVED
ACTION_STARTED
ACTION_COMPLETED
AGENT_CONNECTED
AGENT_DISCONNECTED
```

---

# 35. API Error Format

All API errors should use:

```json
{
  "error": {
    "code": "SERVER_NOT_FOUND",
    "message": "Server was not found.",
    "requestId": "uuid"
  }
}
```

Never expose stack traces to clients.

---

# 36. Pagination

Use cursor or page-based pagination.

MVP:

```text
?page=0&size=50
```

Maximum:

```text
size <= 100
```

---

# 37. Billing

Suggested initial plans:

| Plan | Price | Servers | AI |
|---|---:|---:|---:|
| Free | €0 | 2 | Limited |
| Starter | €19/mo | 5 | 500 analyses |
| Business | €49/mo | 20 | 2,000 analyses |
| Pro | €99/mo | 50 | 10,000 analyses |
| MSP | €199/mo | 150 | 25,000 analyses |

Prices are product proposals and can change.

Entitlements must be enforced server-side.

Example:

```text
PLAN
├── max_servers
├── max_users
├── max_ai_operations
├── max_retention_days
├── autonomous_actions
└── notification_features
```

---

# 38. Usage Metering

Track:

- Active servers
- Metrics volume
- AI requests
- AI tokens if provider exposes usage
- Actions
- Storage
- Notification volume

Do not rely solely on frontend checks.

---

# 39. Security Requirements

## Application

- OWASP Top 10 considerations
- CSRF protection where applicable
- Input validation
- Output encoding
- Rate limiting
- Secure headers
- CORS allowlist
- Secure cookies where used

## Database

- Parameterized queries
- Least-privilege DB account
- Encrypted backups

## Agent

- Least privilege
- No arbitrary shell
- Signed/restricted actions
- Secure credential storage
- TLS
- Version reporting

## Secrets

Never store:

- API keys
- database passwords
- tokens

in source control.

Use environment variables or secret management.

---

# 40. Audit Requirements

Audit:

- Login
- Logout
- User changes
- Agent registration
- Server changes
- Alert changes
- Incident actions
- AI recommendations
- Action approvals
- Action executions
- Billing changes
- Permission changes

Example:

```json
{
  "actorType": "AI",
  "actorId": "ai-engine",
  "eventType": "ACTION_REQUESTED",
  "resourceType": "SERVER",
  "resourceId": "uuid",
  "details": {
    "action": "restart_service",
    "service": "nginx",
    "reason": "health check failure"
  }
}
```

---

# 41. Observability

NexusOps itself must be monitored.

Use:

- Structured JSON logs
- Request IDs
- Metrics
- Health endpoints
- Readiness endpoint
- Liveness endpoint

Endpoints:

```text
/actuator/health
/actuator/health/liveness
/actuator/health/readiness
```

Track:

- API latency
- error rate
- DB latency
- Redis errors
- agent connections
- metric ingestion rate
- AI latency
- AI failures
- action failures

---

# 42. Backup and Disaster Recovery

PostgreSQL:

- Daily full backup
- Point-in-time recovery where supported
- Backup retention configurable

Object storage:

- Versioning where supported

Important:

The product should eventually support a documented RPO/RTO target.

Initial target:

```text
RPO: 24 hours
RTO: 8 hours
```

Improve for production tiers later.

---

# 43. Performance Targets

MVP target:

- Dashboard API p95 < 500 ms excluding AI
- Normal API p95 < 300 ms
- Agent heartbeat processing < 200 ms
- Metric ingestion should be asynchronous
- WebSocket event delivery < 2 seconds under normal load
- AI response target < 15 seconds

The AI must never block metric ingestion.

---

# 44. Metric Storage Strategy

MVP:

PostgreSQL.

When volume becomes large:

```text
PostgreSQL
+
TimescaleDB
```

or another dedicated metrics store.

Do not prematurely introduce Kafka, Kubernetes, ClickHouse, or a large distributed architecture.

The first commercial version should remain operationally simple.

---

# 45. Background Jobs

Use Redis-backed jobs or equivalent.

Jobs:

```text
Metric processing
Alert evaluation
Incident correlation
AI analysis
Notification delivery
Certificate checks
Action timeout processing
Billing synchronization
Cleanup
```

Long-running operations must not run synchronously inside HTTP requests.

---

# 46. Agent Configuration

Example:

```yaml
server:
  name: web01

cloud:
  endpoint: https://api.example.com
  heartbeat_interval: 30s
  metrics_interval: 30s

monitoring:
  cpu: true
  memory: true
  disk: true
  network: true
  processes: true
  services: true
  docker: true

actions:
  enabled: true
  auto_fix:
    restart_service: false
    restart_container: false
    clear_temp: false
```

---

# 47. Linux Agent Installation

Provide:

```text
install.sh
```

Expected:

```bash
curl -fsSL https://get.nexusops.io/install.sh | sudo bash
```

Then:

```bash
sudo nexus-agent register --token XXXX
sudo systemctl enable --now nexus-agent
```

Installation must:

- Detect Linux distribution
- Install binary
- Create service user
- Create configuration
- Install systemd unit
- Start service
- Validate connection

Do not silently install unrelated packages.

---

# 48. Systemd

Example service:

```ini
[Unit]
Description=NexusOps Monitoring Agent
After=network-online.target

[Service]
Type=simple
User=nexusops
ExecStart=/usr/bin/nexus-agent run
Restart=always
RestartSec=5

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

The final sandboxing options must be validated against required monitoring capabilities.

---

# 49. AI Chat Context

When user asks:

> "Why is production slow?"

The system should retrieve relevant context automatically:

```text
Organization
↓
Servers
↓
Recent metrics
↓
Recent alerts
↓
Active incidents
↓
Recent deployments if available
↓
Relevant logs
↓
AI
```

Do not dump the entire infrastructure into the prompt.

Use targeted context retrieval.

---

# 50. AI Prompting Rules

The AI must:

1. Never invent telemetry.
2. Distinguish observed facts from hypotheses.
3. Include evidence.
4. State uncertainty.
5. Prefer reversible actions.
6. Never bypass policy.
7. Never execute arbitrary shell commands.
8. Never claim an action succeeded without agent confirmation.
9. Never expose secrets.
10. Never treat an AI-generated command as trusted input.

---

# 51. Incident Example

Input:

```text
web01
CPU = 94%
Java process = 82%
HTTP = healthy
Traffic = +43%
Duration = 17 minutes
```

Expected AI result:

```text
Severity: WARNING

Summary:
web01 is experiencing sustained high CPU.

Evidence:
- CPU above 90% for 17 minutes
- Java process consumes 82%
- HTTP health checks remain successful
- Traffic increased 43%

Assessment:
The evidence suggests traffic/application workload is the most likely cause.

Recommendation:
Investigate application workload and traffic before restarting services.

No automatic remediation recommended.
```

The AI should not restart the server simply because CPU is high.

---

# 52. Example Remediation

Scenario:

```text
nginx
health check failed
service status = failed
```

AI:

```text
Recommendation:
Restart nginx.

Risk:
LOW

Expected impact:
Short interruption to active HTTP connections.

Requires approval:
No, if organization has enabled automatic low-risk remediation.
```

Action engine validates:

```text
Action type = restart_service
Service = nginx
Server belongs to organization
Action allowed by policy
```

Agent executes the predefined action.

Result:

```text
SUCCESS
exitCode: 0
duration: 2.1 seconds
```

Audit record is created.

---

# 53. Frontend Design

Visual direction:

- Modern dark/light enterprise UI
- Clean dashboard
- Strong status indicators
- Dense but readable information
- Responsive
- Desktop-first web
- Mobile-friendly web
- Android native experience

Avoid excessive cyberpunk styling in the actual business product. The UI should communicate operational confidence and clarity.

---

# 54. Dashboard Health Score

A simple health score may be calculated from:

```text
critical incidents
warnings
offline agents
disk risk
service failures
certificate risk
```

Example:

```text
92 / 100
Healthy
```

Important:

The health score is a product metric, not an AI-generated arbitrary number.

Document the calculation.

---

# 55. Server Health

Example:

```text
WEB01

HEALTH
██████████████████░░ 91%

CPU       42%
RAM       61%
DISK      73%
NETWORK   Normal
AGENT     Connected

SERVICES
✓ nginx
✓ docker
✓ ssh
✓ node
```

---

# 56. Incident Timeline

Example:

```text
14:20
CPU crossed 80%

14:27
CPU crossed 90%

14:31
Application latency increased

14:32
AI analysis started

14:33
AI identified likely application workload

14:35
Operator reviewed recommendation

14:36
Incident resolved
```

---

# 57. Testing Strategy

## Unit Tests

Backend:

- authentication
- authorization
- tenant isolation
- alert rules
- incident correlation
- action policy
- billing entitlements

Agent:

- collectors
- action handlers
- configuration
- registration
- heartbeat

## Integration Tests

- PostgreSQL
- Redis
- Agent ↔ API
- WebSocket
- AI mock provider
- Stripe webhook mock

## E2E Tests

Critical flows:

1. Register organization
2. Create agent token
3. Register agent
4. Server appears
5. Metrics arrive
6. Alert generated
7. Incident created
8. AI analyzes incident
9. Recommendation created
10. User approves action
11. Agent executes action
12. Result appears
13. Audit record exists

## Security Tests

- Cross-tenant access
- Invalid tokens
- Expired tokens
- Privilege escalation
- Action bypass
- Injection attempts
- Rate limits

---

# 58. Mock Mode

The project must support development without real servers or AI.

Create:

```text
MockAgent
MockAIProvider
MockMetricsProvider
MockBillingProvider
```

MockAgent should simulate:

- CPU spikes
- memory pressure
- disk growth
- service failure
- Docker restart loops
- agent disconnect
- HTTP failures

This allows UI and backend development before production agents exist.

---

# 59. Demo Scenario

Seed organization:

```text
Acme Demo Ltd
```

Servers:

```text
web01
web02
db01
docker01
```

Simulated incidents:

```text
db01 disk 94%
web01 CPU 92%
web02 SSL expires in 6 days
docker01 api container restarted 8 times
```

AI should produce realistic incident analyses.

---

# 60. Development Phases

## Phase 0 — Foundation

Deliver:

- Repository
- CI/CD
- Backend skeleton
- Frontend skeleton
- PostgreSQL
- Redis
- Authentication
- Docker development environment
- Basic deployment

## Phase 1 — Organizations

Deliver:

- Organizations
- Users
- Roles
- Tenant isolation
- Server CRUD
- Agent CRUD

## Phase 2 — Linux Agent

Deliver:

- Registration
- Heartbeat
- CPU
- RAM
- Disk
- Network
- Processes
- Services
- Docker
- HTTP checks

## Phase 3 — Monitoring

Deliver:

- Metrics ingestion
- Alert rules
- Alert lifecycle
- Alert deduplication
- Incident creation
- Incident correlation

## Phase 4 — Web Dashboard

Deliver:

- Dashboard
- Server list
- Server details
- Charts
- Alerts
- Incidents
- Audit

## Phase 5 — AI

Deliver:

- AI provider abstraction
- Tool registry
- Context builder
- Incident analysis
- AI chat
- Recommendations

## Phase 6 — Actions

Deliver:

- Action engine
- Policy engine
- Approval workflow
- Agent action execution
- Audit trail

## Phase 7 — Android

Deliver:

- Authentication
- Dashboard
- Push
- Incidents
- AI chat
- Approvals

## Phase 8 — Billing

Deliver:

- Stripe
- Plans
- Entitlements
- Subscription lifecycle
- Customer portal

## Phase 9 — Production Hardening

Deliver:

- Security testing
- Rate limiting
- Backups
- Monitoring
- Error tracking
- Load tests
- Documentation
- Installation scripts

---

# 61. First Development Milestone

The first milestone should result in:

```text
Browser
   |
   v
NexusOps Login
   |
   v
Dashboard
   |
   v
Create Agent
   |
   v
Copy Registration Command
   |
   v
Linux Server
   |
   v
Agent Connected
   |
   v
CPU/RAM/Disk visible
```

Do not start AI development before this foundation works.

---

# 62. Second Milestone

```text
Server
   |
   v
Metrics
   |
   v
Threshold
   |
   v
Alert
   |
   v
Incident
   |
   v
AI Analysis
   |
   v
Recommendation
```

---

# 63. Third Milestone

```text
Recommendation
      |
      v
Policy Engine
      |
      +---- Auto Fix
      |
      +---- Approval
      |
      v
Agent
      |
      v
Execution
      |
      v
Result
      |
      v
Audit
```

---

# 64. Repository Structure

Recommended monorepo:

```text
nexusops/
│
├── apps/
│   ├── web/
│   └── android/
│
├── services/
│   ├── api/
│   ├── worker/
│   └── ai/
│
├── agent/
│
├── packages/
│   ├── api-contracts/
│   └── shared/
│
├── infrastructure/
│   ├── docker/
│   ├── compose/
│   └── terraform/
│
├── docs/
│
├── scripts/
│
└── README.md
```

A simpler deployment may initially combine `api`, `worker`, and `ai` into one backend application with separate modules/processes. Split services only when operationally justified.

---

# 65. Environment Variables

Example:

```text
APP_ENV
APP_BASE_URL

DATABASE_URL
REDIS_URL

JWT_SECRET
JWT_ACCESS_TTL
JWT_REFRESH_TTL

AI_PROVIDER
AI_API_KEY
AI_MODEL

STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

FCM_PROJECT_ID

OBJECT_STORAGE_ENDPOINT
OBJECT_STORAGE_BUCKET
OBJECT_STORAGE_ACCESS_KEY
OBJECT_STORAGE_SECRET_KEY
```

Never commit `.env` files containing real secrets.

Provide:

```text
.env.example
```

---

# 66. CI/CD

Pipeline:

```text
Push
 |
 v
Lint
 |
 v
Unit tests
 |
 v
Integration tests
 |
 v
Security scan
 |
 v
Build
 |
 v
Container image
 |
 v
Deploy staging
 |
 v
Smoke tests
 |
 v
Production
```

Agent:

```text
Go test
Go vet
Static analysis
Build Linux binary
Package release
Generate checksums
```

---

# 67. Documentation Required

The repository must contain:

```text
README.md
ARCHITECTURE.md
DEVELOPMENT.md
DEPLOYMENT.md
SECURITY.md
AGENT.md
API.md
AI.md
BILLING.md
TROUBLESHOOTING.md
```

The coding agent should update documentation when implementation changes architecture.

---

# 68. Definition of Done

A feature is not complete until:

- Code implemented
- Unit tests added
- Integration tests where applicable
- Authorization verified
- Tenant isolation verified
- Error handling implemented
- Logging implemented
- API documented
- UI implemented
- Loading/error/empty states handled
- Audit requirements considered
- Security implications reviewed
- README/documentation updated

---

# 69. MVP Acceptance Criteria

The MVP is considered complete when a new customer can:

1. Register.
2. Create an organization.
3. Log into the web dashboard.
4. Create an agent registration token.
5. Install the Linux agent.
6. Register the agent.
7. See the server online.
8. See CPU/RAM/disk metrics.
9. Configure or use default thresholds.
10. Trigger a test alert.
11. See an incident.
12. Ask the AI to investigate.
13. Receive evidence-backed analysis.
14. Receive a recommendation.
15. Approve a safe action.
16. Have the agent execute the predefined action.
17. See the result.
18. See the complete audit trail.
19. Receive an Android notification.
20. Open the incident from Android.
21. Approve/reject an action from Android.
22. Subscribe to a paid plan.

---

# 70. Important Engineering Rules for the Coding Agent

The coding agent must follow these rules:

### Rule 1

Do not implement arbitrary AI-generated shell execution.

### Rule 2

Do not trust organization IDs from clients.

### Rule 3

Do not expose secrets in logs.

### Rule 4

Do not block metric ingestion on AI requests.

### Rule 5

Do not make the AI a privileged infrastructure user.

### Rule 6

Every operational action must have:

```text
actor
organization
server
action type
parameters
reason
risk
status
timestamp
result
```

### Rule 7

All destructive/high-risk operations require explicit authorization.

### Rule 8

Build mock implementations before requiring external infrastructure.

### Rule 9

Prefer simple architecture until scale requires complexity.

### Rule 10

Every feature must include tests.

---

# 71. Future Roadmap

After MVP:

## Infrastructure

- Windows Agent
- Kubernetes
- AWS
- Azure
- GCP
- VMware
- Network devices
- SNMP

## Security

- Wazuh integration
- Vulnerability management
- Security incident analysis
- Compliance reports

## AI

- Predictive incidents
- Capacity forecasting
- Automated root-cause analysis
- Deployment correlation
- Natural-language infrastructure management
- Autonomous low-risk operations

## Integrations

- Slack
- Microsoft Teams
- Email
- PagerDuty
- Jira
- ServiceNow
- GitHub
- GitLab

## MSP

```text
MSP
├── Customers
├── Customer dashboards
├── Technician accounts
├── Customer billing
└── White-labeling
```

---

# 72. Long-Term Product Vision

NexusOps should evolve from:

```text
Monitoring
```

to:

```text
Monitoring
    ↓
Detection
    ↓
Diagnosis
    ↓
Recommendation
    ↓
Approval
    ↓
Remediation
    ↓
Automation
    ↓
Autonomous IT Operations
```

The long-term product is an **AI IT operations layer for small businesses**.

The customer should eventually be able to say:

> "Make sure my infrastructure stays healthy."

NexusOps should then continuously:

```text
Observe
  ↓
Understand
  ↓
Detect
  ↓
Investigate
  ↓
Recommend
  ↓
Ask permission when required
  ↓
Fix safely
  ↓
Verify
  ↓
Report
```

---

# 73. Final Build Instruction

Treat this document as the authoritative product specification for the initial implementation.

Prioritize:

1. Security
2. Tenant isolation
3. Agent reliability
4. Monitoring correctness
5. Action safety
6. Clear UX
7. Testability
8. Simple deployment
9. AI usefulness
10. Scalability

Do not attempt to implement every future feature during MVP.

Build the smallest production-quality version that demonstrates this complete loop:

```text
SERVER
  ↓
AGENT
  ↓
METRICS
  ↓
ALERT
  ↓
INCIDENT
  ↓
AI ANALYSIS
  ↓
RECOMMENDATION
  ↓
APPROVAL
  ↓
SAFE ACTION
  ↓
AGENT EXECUTION
  ↓
VERIFICATION
  ↓
AUDIT
  ↓
WEB + ANDROID NOTIFICATION
```

That loop is the core of NexusOps.
