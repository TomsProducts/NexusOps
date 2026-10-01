package collector

import (
	"bufio"
	"bytes"
	"context"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

type SystemLogEntry struct {
	Timestamp string `json:"timestamp"`
	Priority  string `json:"priority"` // ERROR, CRITICAL, EMERGENCY
	Unit      string `json:"unit"`
	Message   string `json:"message"`
}

func GetCriticalSystemLogs(tail int) ([]SystemLogEntry, error) {
	if tail <= 0 {
		tail = 50
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "journalctl", "-p", "err..emerg", "-n", strconv.Itoa(tail), "--no-pager", "-o", "short-iso")
	out, err := cmd.Output()
	if err != nil || len(out) == 0 {
		// Fallback to dmesg --level=err,warn
		cmd = exec.CommandContext(ctx, "dmesg", "--level=err,warn", "-T")
		out, err = cmd.Output()
		if err != nil {
			return nil, err
		}
	}

	var entries []SystemLogEntry
	scanner := bufio.NewScanner(bytes.NewReader(out))

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		parts := strings.SplitN(line, " ", 4)
		if len(parts) >= 4 {
			entries = append(entries, SystemLogEntry{
				Timestamp: parts[0],
				Priority:  "ERROR",
				Unit:      parts[2],
				Message:   parts[3],
			})
		} else {
			entries = append(entries, SystemLogEntry{
				Timestamp: time.Now().UTC().Format(time.RFC3339),
				Priority:  "ERROR",
				Unit:      "kernel",
				Message:   line,
			})
		}

		if len(entries) >= tail {
			break
		}
	}

	return entries, nil
}
