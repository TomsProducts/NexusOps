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

type ProcessDetail struct {
	PID     int     `json:"pid"`
	User    string  `json:"user"`
	CPU     float64 `json:"cpu"`
	Memory  float64 `json:"memory"`
	VSZ     string  `json:"vsz"`
	RSS     string  `json:"rss"`
	Status  string  `json:"status"`
	Time    string  `json:"time"`
	Command string  `json:"command"`
}

func GetTopProcesses(limit int) ([]ProcessDetail, error) {
	if limit <= 0 {
		limit = 30
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "ps", "-eo", "pid,user,%cpu,%mem,vsz,rss,stat,time,comm", "--sort=-%cpu")
	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var results []ProcessDetail
	scanner := bufio.NewScanner(bytes.NewReader(out))
	isHeader := true

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		if isHeader {
			isHeader = false
			continue
		}

		fields := strings.Fields(line)
		if len(fields) < 9 {
			continue
		}

		pid, _ := strconv.Atoi(fields[0])
		cpu, _ := strconv.ParseFloat(fields[2], 64)
		mem, _ := strconv.ParseFloat(fields[3], 64)

		cmdName := strings.Join(fields[8:], " ")

		results = append(results, ProcessDetail{
			PID:     pid,
			User:    fields[1],
			CPU:     cpu,
			Memory:  mem,
			VSZ:     fields[4] + "K",
			RSS:     fields[5] + "K",
			Status:  fields[6],
			Time:    fields[7],
			Command: cmdName,
		})

		if len(results) >= limit {
			break
		}
	}

	return results, nil
}
