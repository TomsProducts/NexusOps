# NexusOps AI Operations Engine

## Objective
Convert raw monitoring data into useful operational reasoning:

> What is wrong? Why is it probably happening? What evidence supports that? What is the impact? What should happen next?

## Pipeline

```text
Telemetry
  ↓
Threshold / anomaly detection
  ↓
Alert
  ↓
Correlation + deduplication
  ↓
Incident
  ↓
Evidence collector
  ↓
AI investigation
  ↓
Structured analysis
  ↓
Policy engine
  ↓
Recommendation
  ↓
Approval
  ↓
Typed action
  ↓
Execution
  ↓
Verification
  ↓
Incident update + audit
```

## Evidence collection
Initial evidence types:
- CPU
- memory
- disk
- disk growth
- load
- network
- service status
- process information
- recent agent events
- recent alerts
- recent incident history
- Docker container status where enabled

Evidence should be bounded and structured.

## AI output schema
```json
{
  "summary": "string",
  "probableCause": "string",
  "confidence": 0.0,
  "impact": "LOW|MEDIUM|HIGH|CRITICAL",
  "evidence": [],
  "recommendations": [
    {
      "actionType": "string",
      "reason": "string",
      "risk": "SAFE|MODERATE|HIGH",
      "requiresApproval": true
    }
  ],
  "questions": []
}
```

Reject malformed or out-of-range output.

## Confidence
Confidence is the model's structured assessment based on available evidence, not a guarantee. UI should label it as AI confidence.

## Risk levels

### SAFE
Examples:
- collect diagnostics
- check service status
- collect logs
- restart a non-critical monitored worker when explicitly allowed

### MODERATE
Examples:
- restart application service
- clear known temporary files
- rotate logs

### HIGH
Examples:
- database restart
- firewall/network configuration changes
- deleting data
- package upgrades
- storage operations that can destroy data

High-risk actions require explicit approval and strong RBAC.

## Autonomous mode
Three organization-level modes:
- OBSERVE: AI analyzes and recommends only
- ASSIST: safe actions can be proposed; user approves execution
- AUTONOMOUS: only explicitly allowlisted safe actions can auto-execute

Never make autonomous mode the default.

## Prompting
System prompts should:
- state that host access is mediated by typed tools
- prohibit shell generation
- require evidence-backed reasoning
- distinguish facts from hypotheses
- avoid claiming an action succeeded before verification
- return strict JSON schema

## Tool interface
The AI can request typed tools such as:
- get_server_metrics
- get_service_status
- get_disk_usage
- get_recent_alerts
- get_recent_incidents
- collect_diagnostics

The AI cannot request:
- arbitrary shell
- arbitrary SQL
- arbitrary HTTP requests
- credential access
- filesystem deletion

## Verification
After an action:
1. agent reports execution result
2. backend verifies expected state
3. metrics/service status are rechecked
4. action status becomes VERIFIED or FAILED
5. incident timeline is updated
6. audit event is recorded

Never mark an action successful based solely on the agent saying it ran.
