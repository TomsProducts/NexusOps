package collector

import (
	"bufio"
	"context"
	"crypto/tls"
	"fmt"
	"net"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"syscall"
	"time"
)

type RedisHealth struct {
	Available        bool    `json:"available"`
	LatencyMs        float64 `json:"latency_ms,omitempty"`
	Version          string  `json:"version,omitempty"`
	MemoryHuman      string  `json:"memory_human,omitempty"`
	ConnectedClients int     `json:"connected_clients,omitempty"`
	OpsPerSec        int     `json:"ops_per_sec,omitempty"`
	UptimeDays       int     `json:"uptime_days,omitempty"`
	HitRate          float64 `json:"hit_rate,omitempty"`
}

type PostgresHealth struct {
	Available         bool    `json:"available"`
	LatencyMs         float64 `json:"latency_ms,omitempty"`
	ActiveConnections int     `json:"active_connections,omitempty"`
	Version           string  `json:"version,omitempty"`
}

type PortProbe struct {
	Port      int     `json:"port"`
	Name      string  `json:"name"`
	Open      bool    `json:"open"`
	LatencyMs float64 `json:"latency_ms"`
}

type DiskMountInfo struct {
	Mount         string  `json:"mount"`
	FSType        string  `json:"fs_type"`
	TotalGB       float64 `json:"total_gb"`
	UsedGB        float64 `json:"used_gb"`
	Percent       float64 `json:"percent"`
	InodesPercent float64 `json:"inodes_percent"`
}

type SSLCertInfo struct {
	Domain        string `json:"domain"`
	Valid         bool   `json:"valid"`
	DaysRemaining int    `json:"days_remaining"`
	Issuer        string `json:"issuer"`
}

type ServicePluginsPayload struct {
	Redis         *RedisHealth     `json:"redis,omitempty"`
	Postgres      *PostgresHealth  `json:"postgres,omitempty"`
	Ports         []PortProbe      `json:"ports,omitempty"`
	Mounts        []DiskMountInfo  `json:"mounts,omitempty"`
	FailedSystemd []string         `json:"failed_systemd,omitempty"`
	SSLCerts      []SSLCertInfo    `json:"ssl_certs,omitempty"`
}

func CollectServicePlugins() *ServicePluginsPayload {
	payload := &ServicePluginsPayload{}

	payload.Redis = checkRedis()
	payload.Postgres = checkPostgres()
	payload.Ports = checkPortProbes()
	payload.Mounts = checkMountsAndInodes()
	payload.FailedSystemd = checkFailedSystemd()
	payload.SSLCerts = checkSSLCerts()

	return payload
}

func checkRedis() *RedisHealth {
	start := time.Now()
	conn, err := net.DialTimeout("tcp", "127.0.0.1:6379", 800*time.Millisecond)
	if err != nil {
		return &RedisHealth{Available: false}
	}
	defer conn.Close()

	latency := float64(time.Since(start).Microseconds()) / 1000.0

	_ = conn.SetDeadline(time.Now().Add(800 * time.Millisecond))
	_, err = fmt.Fprintf(conn, "INFO\r\n")
	if err != nil {
		return &RedisHealth{Available: true, LatencyMs: latency}
	}

	rh := &RedisHealth{Available: true, LatencyMs: latency}
	scanner := bufio.NewScanner(conn)
	var hits, misses int64

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, ":", 2)
		if len(parts) != 2 {
			continue
		}
		k, v := parts[0], parts[1]

		switch k {
		case "redis_version":
			rh.Version = v
		case "used_memory_human":
			rh.MemoryHuman = v
		case "connected_clients":
			rh.ConnectedClients, _ = strconv.Atoi(v)
		case "instantaneous_ops_per_sec":
			rh.OpsPerSec, _ = strconv.Atoi(v)
		case "uptime_in_days":
			rh.UptimeDays, _ = strconv.Atoi(v)
		case "keyspace_hits":
			hits, _ = strconv.ParseInt(v, 10, 64)
		case "keyspace_misses":
			misses, _ = strconv.ParseInt(v, 10, 64)
		}
	}

	if (hits + misses) > 0 {
		rh.HitRate = mathRound(float64(hits)/float64(hits+misses)*100.0, 1)
	}

	return rh
}

func checkPostgres() *PostgresHealth {
	start := time.Now()
	conn, err := net.DialTimeout("tcp", "127.0.0.1:5432", 800*time.Millisecond)
	if err != nil {
		return &PostgresHealth{Available: false}
	}
	defer conn.Close()

	latency := float64(time.Since(start).Microseconds()) / 1000.0
	pg := &PostgresHealth{Available: true, LatencyMs: latency}

	// Try checking active connections via local docker container if running
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, "docker", "exec", "nexusops-postgres", "psql", "-U", "nexusops", "-d", "nexusops", "-t", "-A", "-c", "SELECT count(*) FROM pg_stat_activity;")
	if out, err := cmd.Output(); err == nil {
		if c, err := strconv.Atoi(strings.TrimSpace(string(out))); err == nil {
			pg.ActiveConnections = c
		}
	}

	return pg
}

func checkPortProbes() []PortProbe {
	portsToCheck := []struct {
		port int
		name string
	}{
		{22, "SSH"},
		{53, "DNS / Pi-hole"},
		{80, "HTTP Web"},
		{443, "HTTPS TLS"},
		{3000, "Frontend UI"},
		{5432, "PostgreSQL"},
		{6379, "Redis"},
		{8080, "Backend API"},
		{20128, "9Router AI"},
	}

	var probes []PortProbe
	for _, p := range portsToCheck {
		start := time.Now()
		conn, err := net.DialTimeout("tcp", fmt.Sprintf("127.0.0.1:%d", p.port), 200*time.Millisecond)
		lat := float64(time.Since(start).Microseconds()) / 1000.0
		if err == nil {
			conn.Close()
			probes = append(probes, PortProbe{
				Port:      p.port,
				Name:      p.name,
				Open:      true,
				LatencyMs: mathRound(lat, 2),
			})
		} else {
			probes = append(probes, PortProbe{
				Port:      p.port,
				Name:      p.name,
				Open:      false,
				LatencyMs: 0,
			})
		}
	}
	return probes
}

func checkMountsAndInodes() []DiskMountInfo {
	file, err := os.Open("/proc/mounts")
	if err != nil {
		return nil
	}
	defer file.Close()

	validFS := map[string]bool{
		"ext4": true, "ext3": true, "xfs": true, "btrfs": true, "vfat": true,
	}

	var mounts []DiskMountInfo
	seen := make(map[string]bool)

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) < 3 {
			continue
		}
		mountPoint := fields[1]
		fsType := fields[2]

		if !validFS[fsType] || seen[mountPoint] {
			continue
		}
		if strings.HasPrefix(mountPoint, "/var/lib/docker") || strings.HasPrefix(mountPoint, "/snap") {
			continue // Skip container overlays and snap loop mounts
		}

		var stat syscall.Statfs_t
		if err := syscall.Statfs(mountPoint, &stat); err != nil {
			continue
		}

		total := float64(stat.Blocks) * float64(stat.Bsize)
		free := float64(stat.Bfree) * float64(stat.Bsize)
		if total <= 0 {
			continue
		}

		used := total - free
		pct := (used / total) * 100.0

		// Inodes
		var inodesPct float64
		if stat.Files > 0 {
			inodesPct = (float64(stat.Files-stat.Ffree) / float64(stat.Files)) * 100.0
		}

		seen[mountPoint] = true
		mounts = append(mounts, DiskMountInfo{
			Mount:         mountPoint,
			FSType:        fsType,
			TotalGB:       mathRound(total/(1024*1024*1024), 1),
			UsedGB:        mathRound(used/(1024*1024*1024), 1),
			Percent:       mathRound(pct, 1),
			InodesPercent: mathRound(inodesPct, 1),
		})
	}
	return mounts
}

func checkFailedSystemd() []string {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "systemctl", "--failed", "--no-legend", "--plain")
	out, err := cmd.Output()
	if err != nil {
		return nil
	}

	var failed []string
	scanner := bufio.NewScanner(strings.NewReader(string(out)))
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) > 0 {
			failed = append(failed, fields[0])
		}
	}
	return failed
}

func checkSSLCerts() []SSLCertInfo {
	var certs []SSLCertInfo

	// Probe local port 443
	tlsConfig := &tls.Config{InsecureSkipVerify: true}
	conn, err := tls.DialWithDialer(&net.Dialer{Timeout: 500 * time.Millisecond}, "tcp", "127.0.0.1:443", tlsConfig)
	if err == nil {
		defer conn.Close()
		state := conn.ConnectionState()
		if len(state.PeerCertificates) > 0 {
			cert := state.PeerCertificates[0]
			days := int(time.Until(cert.NotAfter).Hours() / 24)
			certs = append(certs, SSLCertInfo{
				Domain:        cert.Subject.CommonName,
				Valid:         days > 0,
				DaysRemaining: days,
				Issuer:        cert.Issuer.CommonName,
			})
		}
	}

	return certs
}
