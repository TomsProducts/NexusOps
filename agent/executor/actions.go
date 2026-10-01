package executor

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"nexusops/agent/collector"
)

type ActionRequest struct {
	ActionID   string          `json:"action_id"`
	ActionType string          `json:"action_type"`
	Parameters json.RawMessage `json:"parameters"`
	TimeoutSec int             `json:"timeout_sec"`
}

type ActionResult struct {
	ActionID   string         `json:"action_id"`
	Status     string         `json:"status"` // COMPLETED, FAILED, VERIFIED
	Output     string         `json:"output"`
	Verified   bool           `json:"verified"`
	ExecutedAt time.Time      `json:"executed_at"`
	Details    map[string]any `json:"details"`
}

func parseParameters(raw json.RawMessage, target any) error {
	trimmed := bytes.TrimSpace(raw)
	if len(trimmed) == 0 {
		return nil
	}
	if trimmed[0] == '"' {
		var s string
		if err := json.Unmarshal(trimmed, &s); err == nil {
			return json.Unmarshal([]byte(s), target)
		}
	}
	return json.Unmarshal(trimmed, target)
}

type Executor struct {
	allowedServices map[string]bool
}

func NewExecutor(allowedServices []string) *Executor {
	allowed := make(map[string]bool)
	for _, s := range allowedServices {
		allowed[strings.ToLower(strings.TrimSpace(s))] = true
	}
	return &Executor{allowedServices: allowed}
}

func (e *Executor) Execute(req *ActionRequest) *ActionResult {
	res := &ActionResult{
		ActionID:   req.ActionID,
		ExecutedAt: time.Now().UTC(),
		Details:    make(map[string]any),
	}

	timeout := 30 * time.Second
	if req.TimeoutSec > 0 && req.TimeoutSec < 300 {
		timeout = time.Duration(req.TimeoutSec) * time.Second
	}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	switch req.ActionType {
	case "CHECK_SERVICE_STATUS":
		return e.executeCheckService(ctx, req, res)
	case "RESTART_SERVICE":
		return e.executeRestartService(ctx, req, res)
	case "ROTATE_LOGS":
		return e.executeRotateLogs(ctx, req, res)
	case "CLEAR_TEMP_FILES":
		return e.executeClearTempFiles(ctx, req, res)
	case "COLLECT_DIAGNOSTICS":
		return e.executeCollectDiagnostics(ctx, req, res)
	case "DOCKER_LIST_CONTAINERS":
		return e.executeDockerList(ctx, req, res)
	case "DOCKER_GET_LOGS":
		return e.executeDockerLogs(ctx, req, res)
	case "DOCKER_RESTART_CONTAINER":
		return e.executeDockerRestart(ctx, req, res)
	case "GET_PROCESS_LIST":
		return e.executeGetProcesses(ctx, req, res)
	case "GET_CRITICAL_LOGS":
		return e.executeGetCriticalLogs(ctx, req, res)
	default:
		res.Status = "FAILED"
		res.Output = fmt.Sprintf("Action type '%s' is not supported or permitted by this agent.", req.ActionType)
		return res
	}
}

func (e *Executor) executeRestartService(ctx context.Context, req *ActionRequest, res *ActionResult) *ActionResult {
	var params struct {
		Service string `json:"service"`
	}
	if err := parseParameters(req.Parameters, &params); err != nil || params.Service == "" {
		res.Status = "FAILED"
		res.Output = "Missing required 'service' parameter."
		return res
	}

	svc := strings.ToLower(strings.TrimSpace(params.Service))
	if !e.allowedServices[svc] {
		res.Status = "FAILED"
		res.Output = fmt.Sprintf("Service '%s' is not in the agent's safe allowlist.", svc)
		return res
	}

	cmd := exec.CommandContext(ctx, "systemctl", "restart", svc)
	out, err := cmd.CombinedOutput()
	if err != nil {
		res.Status = "FAILED"
		res.Output = fmt.Sprintf("Failed to restart %s: %s (%v)", svc, string(out), err)
		return res
	}

	// Verification step: check if active
	verifyCmd := exec.CommandContext(ctx, "systemctl", "is-active", svc)
	verifyOut, vErr := verifyCmd.CombinedOutput()
	if vErr == nil && strings.TrimSpace(string(verifyOut)) == "active" {
		res.Status = "VERIFIED"
		res.Verified = true
		res.Output = fmt.Sprintf("Service %s successfully restarted and verified active.", svc)
	} else {
		res.Status = "COMPLETED"
		res.Verified = false
		res.Output = fmt.Sprintf("Service %s restarted, but verification reported: %s", svc, string(verifyOut))
	}
	return res
}

func (e *Executor) executeCheckService(ctx context.Context, req *ActionRequest, res *ActionResult) *ActionResult {
	var params struct {
		Service string `json:"service"`
	}
	_ = parseParameters(req.Parameters, &params)
	if params.Service == "" {
		res.Status = "FAILED"
		res.Output = "Missing 'service' parameter."
		return res
	}

	svc := strings.TrimSpace(params.Service)
	cmd := exec.CommandContext(ctx, "systemctl", "status", svc, "--no-pager")
	out, err := cmd.CombinedOutput()
	res.Status = "COMPLETED"
	res.Verified = (err == nil)
	res.Output = string(out)
	return res
}

func (e *Executor) executeRotateLogs(ctx context.Context, req *ActionRequest, res *ActionResult) *ActionResult {
	var params struct {
		Service string `json:"service"`
	}
	_ = parseParameters(req.Parameters, &params)

	cmd := exec.CommandContext(ctx, "logrotate", "-f", "/etc/logrotate.conf")
	out, err := cmd.CombinedOutput()
	if err != nil {
		res.Status = "FAILED"
		res.Output = fmt.Sprintf("Logrotate failed: %s (%v)", string(out), err)
		return res
	}
	res.Status = "VERIFIED"
	res.Verified = true
	res.Output = "Log rotation completed successfully."
	return res
}

func (e *Executor) executeClearTempFiles(ctx context.Context, req *ActionRequest, res *ActionResult) *ActionResult {
	// Safely clear only nexusops temporary cache files
	cmd := exec.CommandContext(ctx, "find", "/tmp", "-maxdepth", "1", "-name", "nexusops-*", "-mtime", "+1", "-delete")
	out, err := cmd.CombinedOutput()
	if err != nil {
		res.Status = "FAILED"
		res.Output = fmt.Sprintf("Temp file cleanup failed: %s (%v)", string(out), err)
		return res
	}
	res.Status = "VERIFIED"
	res.Verified = true
	res.Output = "Old temporary files purged successfully."
	return res
}

func (e *Executor) executeCollectDiagnostics(ctx context.Context, req *ActionRequest, res *ActionResult) *ActionResult {
	var buffer bytes.Buffer
	buffer.WriteString("=== TOP PROCESSES (CPU/MEM) ===\n")
	psCmd := exec.CommandContext(ctx, "ps", "aux", "--sort=-%cpu")
	if psOut, err := psCmd.CombinedOutput(); err == nil {
		lines := strings.Split(string(psOut), "\n")
		limit := 15
		if len(lines) < limit {
			limit = len(lines)
		}
		buffer.WriteString(strings.Join(lines[:limit], "\n"))
	}

	buffer.WriteString("\n\n=== DISK ALLOCATION (df -h) ===\n")
	dfCmd := exec.CommandContext(ctx, "df", "-h")
	if dfOut, err := dfCmd.CombinedOutput(); err == nil {
		buffer.WriteString(string(dfOut))
	}

	res.Status = "COMPLETED"
	res.Verified = true
	res.Output = buffer.String()
	return res
}

func (e *Executor) executeDockerList(ctx context.Context, req *ActionRequest, res *ActionResult) *ActionResult {
	d := collector.NewDockerClient()
	containers, err := d.ListContainers(ctx)
	if err != nil {
		res.Status = "FAILED"
		res.Output = fmt.Sprintf("Failed to list containers: %v", err)
		return res
	}
	raw, _ := json.Marshal(containers)
	res.Status = "COMPLETED"
	res.Verified = true
	res.Output = string(raw)
	return res
}

func (e *Executor) executeDockerLogs(ctx context.Context, req *ActionRequest, res *ActionResult) *ActionResult {
	var params struct {
		Container string `json:"container"`
		Tail      int    `json:"tail"`
	}
	_ = parseParameters(req.Parameters, &params)
	if params.Container == "" {
		res.Status = "FAILED"
		res.Output = "Missing required 'container' parameter."
		return res
	}
	if params.Tail <= 0 {
		params.Tail = 100
	}

	d := collector.NewDockerClient()
	logs, err := d.GetContainerLogs(ctx, params.Container, params.Tail)
	if err != nil {
		res.Status = "FAILED"
		res.Output = fmt.Sprintf("Failed to get logs for container %s: %v", params.Container, err)
		return res
	}

	res.Status = "COMPLETED"
	res.Verified = true
	res.Output = logs
	return res
}

func (e *Executor) executeDockerRestart(ctx context.Context, req *ActionRequest, res *ActionResult) *ActionResult {
	var params struct {
		Container string `json:"container"`
	}
	_ = parseParameters(req.Parameters, &params)
	if params.Container == "" {
		res.Status = "FAILED"
		res.Output = "Missing required 'container' parameter."
		return res
	}

	d := collector.NewDockerClient()
	if err := d.RestartContainer(ctx, params.Container); err != nil {
		res.Status = "FAILED"
		res.Output = fmt.Sprintf("Failed to restart container %s: %v", params.Container, err)
		return res
	}

	res.Status = "VERIFIED"
	res.Verified = true
	res.Output = fmt.Sprintf("Container %s successfully restarted.", params.Container)
	return res
}

func (e *Executor) executeGetProcesses(ctx context.Context, req *ActionRequest, res *ActionResult) *ActionResult {
	var params struct {
		Limit int `json:"limit"`
	}
	_ = parseParameters(req.Parameters, &params)
	if params.Limit <= 0 {
		params.Limit = 35
	}

	procs, err := collector.GetTopProcesses(params.Limit)
	if err != nil {
		res.Status = "FAILED"
		res.Output = fmt.Sprintf("Failed to get processes: %v", err)
		return res
	}

	raw, _ := json.Marshal(procs)
	res.Status = "COMPLETED"
	res.Verified = true
	res.Output = string(raw)
	return res
}

func (e *Executor) executeGetCriticalLogs(ctx context.Context, req *ActionRequest, res *ActionResult) *ActionResult {
	var params struct {
		Tail int `json:"tail"`
	}
	_ = parseParameters(req.Parameters, &params)
	if params.Tail <= 0 {
		params.Tail = 50
	}

	logs, err := collector.GetCriticalSystemLogs(params.Tail)
	if err != nil {
		res.Status = "FAILED"
		res.Output = fmt.Sprintf("Failed to get critical logs: %v", err)
		return res
	}

	raw, _ := json.Marshal(logs)
	res.Status = "COMPLETED"
	res.Verified = true
	res.Output = string(raw)
	return res
}

