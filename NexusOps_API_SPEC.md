# NexusOps API Specification

Base path: `/api`

All authenticated endpoints require an organization context. Organization-owned resources must never be accessible across tenants.

## Authentication

### POST /auth/login
Request:
```json
{"email":"admin@example.com","password":"password"}
```
Response:
```json
{"accessToken":"...","refreshToken":"...","expiresIn":900,"user":{"id":"...","email":"..."}}
```

### POST /auth/refresh
Rotates the refresh token and returns a new access token.

### POST /auth/logout
Revokes the current refresh token/session.

## Organizations

### GET /organizations/current
Returns current organization profile and subscription information.

### GET /organizations/members
Returns paginated members.

### POST /organizations/members
Creates/invites a member.

## Servers

### GET /servers
Query parameters:
- `status`
- `search`
- `tag`
- `page`
- `size`

### POST /servers
Registers a server record.

### GET /servers/{serverId}
Returns server details.

### DELETE /servers/{serverId}
Disables/removes a server after authorization checks.

### GET /servers/{serverId}/metrics
Parameters:
- `from`
- `to`
- `interval`

Returns time-series CPU, memory, disk, network and load data.

### POST /servers/{serverId}/agent-token
Creates an enrollment token with expiration.

## Agent

### POST /agent/enroll
Used by a new agent with an enrollment token.

### POST /agent/heartbeat
Authenticated agent heartbeat.

### POST /agent/metrics
Batch metric submission.

### GET /agent/config
Returns agent configuration and permitted capabilities.

### POST /agent/action-result
Reports execution and verification results.

## Alerts

### GET /alerts
Filters:
- severity
- status
- serverId
- from
- to

### POST /alerts/{alertId}/acknowledge
Acknowledges an alert.

### POST /alerts/{alertId}/resolve
Resolves an alert.

## Incidents

### GET /incidents
Filters:
- status
- severity
- serverId
- from
- to

### GET /incidents/{incidentId}
Returns incident, timeline, evidence, AI analyses and actions.

### POST /incidents/{incidentId}/acknowledge
Acknowledges an incident.

### POST /incidents/{incidentId}/resolve
Resolves an incident.

## AI

### POST /ai/incidents/{incidentId}/analyze
Starts an AI investigation.

Response:
```json
{
  "id":"analysis-123",
  "summary":"Disk growth is primarily caused by binary logs.",
  "probableCause":"Binary log retention/growth",
  "confidence":0.92,
  "impact":"HIGH",
  "evidence":[
    {"type":"DISK_USAGE","value":"94%"},
    {"type":"GROWTH_RATE","value":"1.7GB/hour"}
  ],
  "recommendations":[
    {
      "actionType":"ROTATE_LOGS",
      "risk":"SAFE",
      "requiresApproval":false
    }
  ]
}
```

AI output must be schema validated before persistence.

## Actions

### GET /actions
Lists proposed, approved, running, completed and failed actions.

### GET /actions/{actionId}
Returns action details and execution timeline.

### POST /actions/{actionId}/approve
Approves an action if the current user has permission.

### POST /actions/{actionId}/reject
Rejects an action.

### POST /actions/{actionId}/execute
Executes an already approved action where policy permits.

The server must revalidate authorization and policy at execution time.

## Audit

### GET /audit
Filters:
- actor
- action
- resource
- date range
- severity

Every security-sensitive operation must generate an audit event.

## Reports

### GET /reports/availability
Returns uptime/availability data.

### GET /reports/incidents
Returns incident summaries.

### GET /reports/actions
Returns action success/failure statistics.

## WebSocket

Endpoint:
`/ws`

Example events:
```json
{"type":"SERVER_STATUS_CHANGED","serverId":"srv-1","status":"ONLINE"}
{"type":"METRIC_UPDATE","serverId":"srv-1","cpu":62,"memory":71,"disk":64}
{"type":"INCIDENT_CREATED","incidentId":"inc-1","severity":"CRITICAL"}
{"type":"AI_ANALYSIS_COMPLETED","incidentId":"inc-1","confidence":0.92}
{"type":"ACTION_STATUS_CHANGED","actionId":"act-1","status":"COMPLETED"}
```

## Error format
All API errors should use:
```json
{
  "timestamp":"2026-10-01T12:00:00Z",
  "status":400,
  "code":"VALIDATION_ERROR",
  "message":"Invalid request",
  "details":[]
}
```

## HTTP conventions
- 200/201 for successful requests
- 202 for accepted asynchronous work
- 204 for successful no-content operations
- 400 validation
- 401 unauthenticated
- 403 unauthorized
- 404 resource not found within tenant
- 409 conflict
- 429 rate limit
- 500 unexpected server error

Never leak whether a resource exists in another tenant.
