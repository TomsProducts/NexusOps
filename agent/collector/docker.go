package collector

import (
	"bytes"
	"context"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"
)

type DockerContainer struct {
	ID            string   `json:"id"`
	Names         []string `json:"names"`
	Image         string   `json:"image"`
	Command       string   `json:"command"`
	State         string   `json:"state"`   // "running", "exited", etc.
	Status        string   `json:"status"`  // "Up 2 hours", etc.
	Created       int64    `json:"created"`
	CPUPercent    float64  `json:"cpu_percent,omitempty"`
	MemoryUsageMB float64  `json:"memory_usage_mb,omitempty"`
	MemoryLimitMB float64  `json:"memory_limit_mb,omitempty"`
	MemoryPercent float64  `json:"memory_percent,omitempty"`
	Ports         []struct {
		IP          string `json:"IP,omitempty"`
		PrivatePort int    `json:"PrivatePort"`
		PublicPort  int    `json:"PublicPort,omitempty"`
		Type        string `json:"Type"`
	} `json:"ports"`
}

type DockerClient struct {
	client *http.Client
}

func NewDockerClient() *DockerClient {
	transport := &http.Transport{
		DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
			return net.Dial("unix", "/var/run/docker.sock")
		},
	}
	return &DockerClient{
		client: &http.Client{
			Transport: transport,
			Timeout:   15 * time.Second,
		},
	}
}

type dockerRawStats struct {
	CPUStats struct {
		CPUUsage struct {
			TotalUsage uint64 `json:"total_usage"`
		} `json:"cpu_usage"`
		SystemCPUUsage uint64 `json:"system_cpu_usage"`
		OnlineCPUs     uint32 `json:"online_cpus"`
	} `json:"cpu_stats"`
	PreCPUStats struct {
		CPUUsage struct {
			TotalUsage uint64 `json:"total_usage"`
		} `json:"cpu_usage"`
		SystemCPUUsage uint64 `json:"system_cpu_usage"`
	} `json:"precpu_stats"`
	MemoryStats struct {
		Usage uint64 `json:"usage"`
		Limit uint64 `json:"limit"`
		Stats struct {
			Cache        uint64 `json:"cache"`
			InactiveFile uint64 `json:"inactive_file"`
			ActiveFile   uint64 `json:"active_file"`
		} `json:"stats"`
	} `json:"memory_stats"`
}

func (d *DockerClient) GetContainerStats(ctx context.Context, containerID string) (float64, float64, float64, float64, error) {
	url := fmt.Sprintf("http://localhost/containers/%s/stats?stream=false", containerID)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return 0, 0, 0, 0, err
	}

	resp, err := d.client.Do(req)
	if err != nil {
		return 0, 0, 0, 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, 0, 0, 0, fmt.Errorf("stats error: %d", resp.StatusCode)
	}

	var raw dockerRawStats
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return 0, 0, 0, 0, err
	}

	// CPU calculation
	cpuDelta := float64(raw.CPUStats.CPUUsage.TotalUsage - raw.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(raw.CPUStats.SystemCPUUsage - raw.PreCPUStats.SystemCPUUsage)
	onlineCPUs := float64(raw.CPUStats.OnlineCPUs)
	if onlineCPUs <= 0 {
		onlineCPUs = 1
	}
	var cpuPercent float64
	if systemDelta > 0 && cpuDelta > 0 {
		cpuPercent = (cpuDelta / systemDelta) * onlineCPUs * 100.0
	}

	// Memory calculation (supporting cgroups v1 cache and cgroups v2 inactive_file)
	usedBytes := float64(raw.MemoryStats.Usage)
	cache := raw.MemoryStats.Stats.Cache
	if cache == 0 {
		cache = raw.MemoryStats.Stats.InactiveFile
	}
	if cache > 0 && cache < raw.MemoryStats.Usage {
		usedBytes -= float64(cache)
	}
	limitBytes := float64(raw.MemoryStats.Limit)
	memUsageMB := usedBytes / (1024.0 * 1024.0)
	memLimitMB := limitBytes / (1024.0 * 1024.0)
	var memPercent float64
	if limitBytes > 0 {
		memPercent = (usedBytes / limitBytes) * 100.0
	}

	return mathRound(cpuPercent, 1), mathRound(memUsageMB, 1), mathRound(memLimitMB, 1), mathRound(memPercent, 1), nil
}

func (d *DockerClient) ListContainers(ctx context.Context) ([]DockerContainer, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "http://localhost/containers/json?all=1", nil)
	if err != nil {
		return nil, err
	}

	resp, err := d.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("docker API returned %d: %s", resp.StatusCode, string(body))
	}

	var containers []DockerContainer
	if err := json.NewDecoder(resp.Body).Decode(&containers); err != nil {
		return nil, err
	}

	// Clean up container names (strip leading '/')
	for i := range containers {
		for j, name := range containers[i].Names {
			containers[i].Names[j] = strings.TrimPrefix(name, "/")
		}
	}

	// Collect resource stats concurrently for running containers
	type statResult struct {
		index   int
		cpu     float64
		memMB   float64
		limitMB float64
		memPct  float64
	}

	runningIndices := make([]int, 0)
	for i, c := range containers {
		if c.State == "running" {
			runningIndices = append(runningIndices, i)
		}
	}

	if len(runningIndices) > 0 {
		resChan := make(chan statResult, len(runningIndices))
		sem := make(chan struct{}, 35) // Run up to 35 parallel stats queries

		for _, idx := range runningIndices {
			go func(i int, cID string) {
				sem <- struct{}{}
				defer func() { <-sem }()

				statsCtx, cancel := context.WithTimeout(ctx, 3500*time.Millisecond)
				defer cancel()

				cpu, memMB, limitMB, memPct, err := d.GetContainerStats(statsCtx, cID)
				if err == nil {
					resChan <- statResult{index: i, cpu: cpu, memMB: memMB, limitMB: limitMB, memPct: memPct}
				} else {
					resChan <- statResult{index: i}
				}
			}(idx, containers[idx].ID)
		}

		for range runningIndices {
			r := <-resChan
			if r.limitMB > 0 || r.memMB > 0 || r.cpu > 0 {
				containers[r.index].CPUPercent = r.cpu
				containers[r.index].MemoryUsageMB = r.memMB
				containers[r.index].MemoryLimitMB = r.limitMB
				containers[r.index].MemoryPercent = r.memPct
			}
		}
	}

	return containers, nil
}

func (d *DockerClient) GetContainerLogs(ctx context.Context, containerID string, tail int) (string, error) {
	if tail <= 0 {
		tail = 100
	}
	url := fmt.Sprintf("http://localhost/containers/%s/logs?stdout=1&stderr=1&tail=%d&timestamps=1", containerID, tail)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return "", err
	}

	resp, err := d.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("docker logs error %d: %s", resp.StatusCode, string(body))
	}

	// Docker demultiplexes stdout/stderr with 8-byte frame header
	// header: [1 byte stream type, 3 bytes padding, 4 bytes big-endian length]
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var output bytes.Buffer
	reader := bytes.NewReader(raw)
	hdr := make([]byte, 8)

	for {
		_, err := io.ReadFull(reader, hdr)
		if err != nil {
			break
		}
		frameSize := binary.BigEndian.Uint32(hdr[4:8])
		if frameSize == 0 {
			continue
		}
		frame := make([]byte, frameSize)
		_, err = io.ReadFull(reader, frame)
		if err != nil {
			output.Write(frame)
			break
		}
		output.Write(frame)
	}

	// If header parsing yielded nothing (e.g. raw TTY mode), fallback to raw string
	if output.Len() == 0 && len(raw) > 0 {
		return string(raw), nil
	}

	return output.String(), nil
}

func (d *DockerClient) RestartContainer(ctx context.Context, containerID string) error {
	url := fmt.Sprintf("http://localhost/containers/%s/restart?t=10", containerID)
	req, err := http.NewRequestWithContext(ctx, "POST", url, nil)
	if err != nil {
		return err
	}

	resp, err := d.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to restart container %s (status %d): %s", containerID, resp.StatusCode, string(body))
	}
	return nil
}
