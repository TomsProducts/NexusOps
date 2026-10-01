package collector

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
	"syscall"
	"time"
)

type SystemMetrics struct {
	Timestamp       time.Time `json:"timestamp"`
	CPUPercent      float64   `json:"cpu_percent"`
	MemoryPercent   float64   `json:"memory_percent"`
	DiskPercent     float64   `json:"disk_percent"`
	Load1m          float64   `json:"load_1m"`
	Load5m          float64   `json:"load_5m"`
	Load15m         float64   `json:"load_15m"`
	NetworkInBytes   int64     `json:"network_in_bytes"`
	NetworkOutBytes  int64     `json:"network_out_bytes"`
	ProcessCount     int       `json:"process_count"`
	DockerContainers string    `json:"docker_containers,omitempty"`
	TopProcesses     string    `json:"top_processes,omitempty"`
	CriticalLogs     string    `json:"critical_logs,omitempty"`
	ServicePlugins   string    `json:"service_plugins,omitempty"`
}

type Collector struct {
	lastCPUTotal int64
	lastCPUIdle  int64
}

func NewCollector() *Collector {
	return &Collector{}
}

func (c *Collector) Collect() (*SystemMetrics, error) {
	m := &SystemMetrics{
		Timestamp: time.Now().UTC(),
	}

	m.CPUPercent = c.readCPUUsage()
	m.MemoryPercent = readMemoryUsage()
	m.DiskPercent = readDiskUsage("/")
	m.Load1m, m.Load5m, m.Load15m = readLoadAverage()
	m.NetworkInBytes, m.NetworkOutBytes = readNetworkTraffic()
	m.ProcessCount = countProcesses()

	// Collect Docker containers (if docker daemon available)
	dockerClient := NewDockerClient()
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	containers, err := dockerClient.ListContainers(ctx)
	cancel()
	if err == nil {
		if raw, err := json.Marshal(containers); err == nil {
			m.DockerContainers = string(raw)
		}
	}

	// Collect top processes
	if procs, err := GetTopProcesses(25); err == nil {
		if raw, err := json.Marshal(procs); err == nil {
			m.TopProcesses = string(raw)
		}
	}

	// Collect critical system logs
	if logs, err := GetCriticalSystemLogs(20); err == nil {
		if raw, err := json.Marshal(logs); err == nil {
			m.CriticalLogs = string(raw)
		}
	}

	// Collect Service & Database Plugins (Redis, Postgres, Ports, Mounts/Inodes, Systemd, SSL)
	plugins := CollectServicePlugins()
	if raw, err := json.Marshal(plugins); err == nil {
		m.ServicePlugins = string(raw)
	}

	return m, nil
}

func (c *Collector) readCPUUsage() float64 {
	file, err := os.Open("/proc/stat")
	if err != nil {
		return 0.0
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	if !scanner.Scan() {
		return 0.0
	}

	fields := strings.Fields(scanner.Text())
	if len(fields) < 5 || fields[0] != "cpu" {
		return 0.0
	}

	var total, idle int64
	for i := 1; i < len(fields); i++ {
		val, _ := strconv.ParseInt(fields[i], 10, 64)
		total += val
		if i == 4 { // idle is field index 4
			idle = val
		}
	}

	if c.lastCPUTotal == 0 {
		c.lastCPUTotal = total
		c.lastCPUIdle = idle
		return 5.0 // Initial baseline estimation
	}

	diffTotal := total - c.lastCPUTotal
	diffIdle := idle - c.lastCPUIdle

	c.lastCPUTotal = total
	c.lastCPUIdle = idle

	if diffTotal <= 0 {
		return 0.0
	}

	usage := 100.0 * (1.0 - (float64(diffIdle) / float64(diffTotal)))
	if usage < 0.0 {
		usage = 0.0
	}
	if usage > 100.0 {
		usage = 100.0
	}
	return mathRound(usage, 2)
}

func readMemoryUsage() float64 {
	file, err := os.Open("/proc/meminfo")
	if err != nil {
		return 0.0
	}
	defer file.Close()

	var total, available float64
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Fields(line)
		if len(parts) >= 2 {
			if parts[0] == "MemTotal:" {
				total, _ = strconv.ParseFloat(parts[1], 64)
			} else if parts[0] == "MemAvailable:" {
				available, _ = strconv.ParseFloat(parts[1], 64)
			}
		}
	}

	if total <= 0 {
		return 0.0
	}
	usedPercent := ((total - available) / total) * 100.0
	return mathRound(usedPercent, 2)
}

func readDiskUsage(path string) float64 {
	var stat syscall.Statfs_t
	err := syscall.Statfs(path, &stat)
	if err != nil {
		return 0.0
	}

	total := float64(stat.Blocks) * float64(stat.Bsize)
	free := float64(stat.Bfree) * float64(stat.Bsize)
	if total <= 0 {
		return 0.0
	}
	usedPercent := ((total - free) / total) * 100.0
	return mathRound(usedPercent, 2)
}

func readLoadAverage() (float64, float64, float64) {
	data, err := os.ReadFile("/proc/loadavg")
	if err != nil {
		return 0, 0, 0
	}
	parts := strings.Fields(string(data))
	if len(parts) < 3 {
		return 0, 0, 0
	}
	l1, _ := strconv.ParseFloat(parts[0], 64)
	l5, _ := strconv.ParseFloat(parts[1], 64)
	l15, _ := strconv.ParseFloat(parts[2], 64)
	return l1, l5, l15
}

func readNetworkTraffic() (int64, int64) {
	file, err := os.Open("/proc/net/dev")
	if err != nil {
		return 0, 0
	}
	defer file.Close()

	var rxTotal, txTotal int64
	scanner := bufio.NewScanner(file)
	lineNum := 0
	for scanner.Scan() {
		lineNum++
		if lineNum <= 2 {
			continue // Header lines
		}
		parts := strings.Fields(scanner.Text())
		if len(parts) >= 10 {
			if strings.HasPrefix(parts[0], "lo:") {
				continue // Skip loopback
			}
			rx, _ := strconv.ParseInt(parts[1], 10, 64)
			tx, _ := strconv.ParseInt(parts[9], 10, 64)
			rxTotal += rx
			txTotal += tx
		}
	}
	return rxTotal, txTotal
}

func countProcesses() int {
	entries, err := os.ReadDir("/proc")
	if err != nil {
		return 0
	}
	count := 0
	for _, entry := range entries {
		if entry.IsDir() {
			if _, err := strconv.Atoi(entry.Name()); err == nil {
				count++
			}
		}
	}
	return count
}

func mathRound(val float64, places int) float64 {
	format := fmt.Sprintf("%%.%df", places)
	res, _ := strconv.ParseFloat(fmt.Sprintf(format, val), 64)
	return res
}
