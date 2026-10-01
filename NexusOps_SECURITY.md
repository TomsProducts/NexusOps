# NexusOps Security Baseline

## Authentication
- Strong password hashing
- Access-token expiry
- Refresh-token rotation
- Session revocation
- Rate-limited login
- Account lockout/abuse protection where appropriate

## Authorization
Use server-side RBAC:
- OWNER: organization ownership/billing/admin
- ADMIN: configuration/users/servers
- OPERATOR: monitoring/incidents/actions
- VIEWER: read-only

Authorization must be checked at the resource and action level.

## Multi-tenancy
The organization ID must be derived from trusted authentication context. Never accept an arbitrary organization ID from the browser as the authorization source.

## Agent security
- Enrollment tokens expire
- Agent credentials are hashed at rest
- Credentials can be revoked
- Agents only receive actions permitted by organization policy
- Actions are signed/identified
- Agent runs with least privilege
- Do not run the whole agent as root unless a specific privileged helper is required

## Remediation safety
No arbitrary shell execution from AI.

All actions must be typed:
```text
ActionType
Parameters
Risk
RequiredCapability
Policy
ApprovalRequirement
Timeout
Verification
```

## Audit
Record:
- login/security events
- user changes
- server enrollment
- alert changes
- incident changes
- AI analyses
- action approvals
- action execution
- policy changes
- billing changes

## Secrets
Use environment variables or a secret manager. Never commit:
- database passwords
- API keys
- JWT signing secrets
- Stripe secrets
- agent credentials

## Web security
- HTTPS
- secure cookies where applicable
- CSRF protection where applicable
- CSP
- X-Frame-Options/frame-ancestors
- HSTS
- input validation
- output encoding
- dependency scanning

## Logging
Application logs must not contain passwords, access tokens, refresh tokens, or raw secrets.

## Incident response
Maintain enough audit information to answer:
- who did it?
- what happened?
- which organization?
- which server?
- what AI recommendation existed?
- who approved it?
- what actually executed?
- was it verified?
