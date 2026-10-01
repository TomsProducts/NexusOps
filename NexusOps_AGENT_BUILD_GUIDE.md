# NexusOps — AI Coding Agent Build Guide

## Mission
Build NexusOps as a production-oriented multi-tenant SaaS for small-company IT operations. NexusOps monitors servers, correlates alerts into incidents, uses AI to investigate probable causes, recommends remediation, and can execute approved safe actions.

The existing `NexusOps_Futuristic_Dashboard.html` is the visual source of truth for the main dashboard. Preserve its information hierarchy, dark glass/cyberpunk aesthetic, spacing, typography scale, status colors, and interaction model when implementing the real frontend.

## Non-negotiable rules
1. Do not redesign the architecture without documenting the reason.
2. Do not invent API contracts when an API specification exists.
3. Keep tenant isolation mandatory: every organization-owned query must be scoped by `organization_id`.
4. Never allow the AI to execute arbitrary shell commands.
5. All remediation must use typed actions, policy validation, agent allowlists, approval rules, execution, verification, and audit logging.
6. Build with mock data first where backend functionality is incomplete, but keep mock adapters replaceable by real API clients.
7. Keep secrets out of source code.
8. Every important user/system action must be auditable.
9. Prefer small, testable modules over large classes/components.
10. The UI must remain responsive on desktop, tablet, and mobile.

## Target stack
- Frontend: Next.js + React + TypeScript + Tailwind CSS
- Backend: Java 21 + Spring Boot 3.x + Spring Security + JPA
- Database: PostgreSQL
- Cache/event support: Redis
- Server agent: Go
- Android: Kotlin + Jetpack Compose
- Push notifications: Firebase Cloud Messaging
- Billing: Stripe
- Local development: Docker Compose
- CI/CD: GitHub Actions or equivalent

## Repository target
```text
nexusops/
  docs/
  frontend/
  backend/
  agent/
  android/
  database/
  docker/
  ui-reference/
  scripts/
```

## Build order

### Phase 0 — foundation
- Create repository structure.
- Add Docker Compose for PostgreSQL and Redis.
- Add backend health endpoint.
- Add frontend shell.
- Add database migrations.
- Add linting, formatting, unit-test configuration.
- Add environment example files.

### Phase 1 — authentication and tenancy
Implement:
- login/logout
- password hashing
- access/refresh token strategy
- organization creation
- organization membership
- roles: OWNER, ADMIN, OPERATOR, VIEWER
- tenant-scoped repositories/services
- protected frontend routes

No organization-owned record may be accessed without an authenticated organization context.

### Phase 2 — servers and agent
Implement:
- server registration
- agent token enrollment
- heartbeat
- CPU/memory/disk/network metrics
- OS and agent version
- online/offline state
- server tags
- server detail page
- metrics history

Agent must authenticate every connection and must never trust commands from an unvalidated organization.

### Phase 3 — monitoring
Implement:
- metric thresholds
- alert rules
- alert lifecycle
- deduplication
- alert severity
- incident correlation
- incident timeline
- notifications

### Phase 4 — AI operations
Implement provider abstraction:
```text
AIProvider
  ├── OpenAIProvider
  ├── MockAIProvider
  └── future providers
```

AI receives structured evidence, not unrestricted access to the database or host.

AI output must conform to a typed schema:
- summary
- probable cause
- evidence
- impact
- confidence
- recommended actions
- urgency
- missing information

### Phase 5 — action engine
Supported initial actions should be narrowly typed, for example:
- RESTART_SERVICE
- ROTATE_LOGS
- CLEAR_TEMP_FILES
- CHECK_SERVICE_STATUS
- COLLECT_DIAGNOSTICS
- RESTART_AGENT

Each action has:
- risk level
- required permission
- server capability requirement
- approval requirement
- timeout
- verification method
- rollback/mitigation where applicable

Never implement an `EXECUTE_SHELL_COMMAND` action.

### Phase 6 — dashboard
Replace dashboard mock data with real API/WebSocket data while preserving the supplied visual design.

Dashboard must show:
- System Health
- Servers
- Healthy/Warning/Critical
- Services
- Uptime
- AI Operations
- Infrastructure Map
- Active Incidents
- Resource Usage
- Server Fleet
- Live Activity

### Phase 7 — Android
Implement:
- authentication
- dashboard
- incidents
- incident detail
- AI analysis
- action approval
- push notifications
- server detail
- user profile

Mobile should prioritize incidents and approvals rather than reproducing every desktop feature.

### Phase 8 — billing
Plans:
- Starter
- Business
- Pro

Track:
- organizations
- monitored servers
- users
- AI investigations
- action executions
- notification usage

Do not hard-code Stripe prices; use environment/configuration.

## Definition of Done
A feature is complete only when:
- backend implementation exists
- database migration exists where required
- authorization is enforced
- API contract is documented
- frontend state/error/loading states exist
- unit tests exist
- integration tests exist for critical paths
- audit logging exists where applicable
- Docker/local setup works
- no secrets are committed
- UI matches the reference design

## Development behavior for the coding agent
Work in vertical slices. After each slice:
1. run tests
2. run lint/type checks
3. verify migrations
4. verify API behavior
5. verify UI
6. update documentation
7. report completed work and remaining work

Do not implement fake success responses in production code. Mocks belong behind explicit development/test adapters.

## Security baseline
- Argon2id or strong BCrypt for passwords
- short-lived access tokens
- refresh-token rotation/revocation
- server-side authorization
- tenant-scoped database access
- rate limiting
- input validation
- output encoding
- secure HTTP headers
- encrypted secrets
- audit trail
- signed/versioned agent releases
- least-privilege agent service account

## AI safety
The AI is an investigator and recommender, not an unrestricted administrator.

Flow:
```text
metrics
  -> anomaly detection
  -> alert
  -> incident
  -> evidence collection
  -> AI analysis
  -> typed recommendation
  -> policy check
  -> approval if required
  -> typed action
  -> agent execution
  -> verification
  -> incident update
  -> audit log
```

Safe actions can be automatic only when the organization explicitly enables autonomous remediation and the action is classified safe. Moderate/high-risk actions require approval.

## UI rule
Treat `ui-reference/dashboard.html` as the visual baseline. Do not replace the futuristic design with a generic admin template. Real functionality should be progressively wired into the existing visual language.

## First milestone
The first usable milestone should allow a user to:
1. create/login to an organization
2. register a Linux agent
3. see the server online
4. see CPU/memory/disk metrics
5. trigger a test threshold
6. see an alert become an incident
7. obtain an AI investigation using mock AI
8. see a typed recommended action
9. approve it
10. execute a safe mock action
11. see verification and audit history

This milestone is the foundation for everything else.
