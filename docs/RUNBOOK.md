# NexusOps — Operational Runbook & Maintenance Guide

This document contains complete operational procedures, node inventories, deployment workflows, and troubleshooting playbooks for the NexusOps platform.

---

## 1. Node Inventory & Access Matrix

| Server | Hostname | IP Address | OS / Arch | Role | Access / Credentials |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`DeployCasaServer`** | `casa` | `192.168.68.117` | Ubuntu 24.04 (x86_64) | Control Plane (Frontend, Backend, DB, Redis, AI) | SSH: `tom@192.168.68.117` (SSH key) |
| **`Desktop`** | `ServerNUC` | `192.168.68.108` | Linux Mint 22 (x86_64) | Workstation Node | Local machine / SSH: `thomas@192.168.68.108` (`cb1312ef`) |
| **`rasberry1`** | `raspberrypi` | `192.168.68.122` | Debian 12 (ARMv7 32-bit) | Edge Gateway (Pi-hole, Tailscale, Portainer Agent) | SSH: `thomas@192.168.68.122` (`cb1312ef`) |

---

## 2. Agent Binaries & Compilation

All binaries are compiled cleanly using the official containerized Go environment to guarantee reproducible, zero-dependency static binaries:

```bash
# Compile x86_64 agent (Ubuntu / Mint / Debian / RHEL)
docker run --rm -v $(pwd)/agent:/src -w /src \
  golang:1.22-alpine go build -ldflags="-s -w" -o nexusops-agent main.go

# Compile ARMv7 32-bit agent (Raspberry Pi 2/3/4)
docker run --rm -v $(pwd)/agent:/src -w /src \
  -e GOOS=linux -e GOARCH=arm -e GOARM=7 -e CGO_ENABLED=0 \
  golang:1.22-alpine go build -ldflags="-s -w" -o nexusops-agent-armv7 main.go

# Restore file permissions after docker build
docker run --rm -v $(pwd)/agent:/src alpine chown -R 1000:1000 /src
```

---

## 3. Node-by-Node Agent Deployment Runbook

### Deploy to `DeployCasaServer` (192.168.68.117)
```bash
# Upload new binary
scp agent/nexusops-agent tom@192.168.68.117:/tmp/nexusops-agent

# Atomically replace and restart daemon
ssh tom@192.168.68.117 "pkill -x nexusops-agent || true; mv /tmp/nexusops-agent /home/tom/nexusops/agent/nexusops-agent && chmod +x /home/tom/nexusops/agent/nexusops-agent && nohup /home/tom/nexusops/agent/nexusops-agent -config /home/tom/nexusops-agent-daemon/agent.json > /home/tom/nexusops-agent-daemon/agent.log 2>&1 & disown; sleep 1; pgrep -a nexusops-agent"
```

### Deploy to `rasberry1` (192.168.68.122)
```bash
# Upload ARMv7 binary
scp agent/nexusops-agent-armv7 thomas@192.168.68.122:/tmp/nexusops-agent

# Replace and restart systemd service
ssh thomas@192.168.68.122 "mv /tmp/nexusops-agent /home/thomas/.nexusops/nexusops-agent && chmod +x /home/thomas/.nexusops/nexusops-agent && echo 'cb1312ef' | sudo -S systemctl restart nexusops-agent && sleep 1 && systemctl status nexusops-agent --no-pager"
```

### Deploy to `Desktop` (192.168.68.108)
```bash
# Update local systemd binary and restart
echo 'cb1312ef' | sudo -S cp agent/nexusops-agent /usr/local/bin/nexusops-agent
echo 'cb1312ef' | sudo -S systemctl restart nexusops-agent
systemctl status nexusops-agent --no-pager
```

---

## 4. Control Plane Deployment (Backend & Frontend)

### Backend Updates
```bash
# 1. Sync backend source
rsync -avz --exclude 'target' backend/ tom@192.168.68.117:/home/tom/nexusops/backend/

# 2. Rebuild & restart backend container on 117
ssh tom@192.168.68.117 "docker rm -f nexusops-backend && cd /home/tom/nexusops/docker && docker-compose build backend && docker-compose up -d backend"
```

### Frontend Updates
```bash
# 1. Sync frontend source
rsync -avz --exclude '.next' --exclude 'node_modules' frontend/ tom@192.168.68.117:/home/tom/nexusops/frontend/

# 2. Rebuild & restart frontend container on 117
ssh tom@192.168.68.117 "docker rm -f nexusops-frontend && cd /home/tom/nexusops/docker && docker-compose build frontend && docker-compose up -d frontend"
```

---

## 5. Telemetry Schema & Payload Formats

### Ingestion Request (`POST /api/agent/metrics`)
Headers: `X-Agent-ID: <id>`, `X-Agent-Token: <token>`, `Content-Type: application/json`

```json
{
  "timestamp": "2026-10-01T19:00:00Z",
  "cpu_percent": 8.75,
  "memory_percent": 46.29,
  "disk_percent": 65.8,
  "load_1m": 0.42,
  "load_5m": 0.38,
  "load_15m": 0.35,
  "network_in_bytes": 1048576,
  "network_out_bytes": 524288,
  "process_count": 210,
  "docker_containers": "[{\"id\":\"...\",\"names\":[\"nexusops-backend\"],\"state\":\"running\",\"cpu_percent\":0.8,\"memory_usage_mb\":308.7,\"memory_percent\":8.1}]",
  "top_processes": "[{\"pid\":1234,\"user\":\"root\",\"cpu\":2.1,\"memory\":1.5,\"command\":\"dockerd\"}]",
  "critical_logs": "[{\"timestamp\":\"2026-10-01T18:50:00\",\"priority\":\"err\",\"unit\":\"kernel\",\"message\":\"...\"}]",
  "service_plugins": "{\"redis\":{\"available\":true,\"latency_ms\":0.3,\"version\":\"7.4.9\",\"memory_human\":\"1014.28K\",\"connected_clients\":1},\"postgres\":{\"available\":true,\"latency_ms\":0.8,\"active_connections\":11},\"ports\":[{\"port\":22,\"name\":\"SSH\",\"open\":true,\"latency_ms\":0.15}],\"mounts\":[{\"mount\":\"/\",\"fs_type\":\"ext4\",\"total_gb\":113.8,\"used_gb\":74.8,\"percent\":65.8,\"inodes_percent\":12.4}],\"failed_systemd\":[],\"ssl_certs\":[{\"domain\":\"*\",\"valid\":true,\"days_remaining\":3420,\"issuer\":\"*\"}]}"
}
```

---

## 6. Critical Operational Gotchas

1. **Docker cgroups v2 Memory**: Modern kernels report container memory in `inactive_file` rather than `cache`. Always subtract `inactive_file` from `usage` to prevent container memory from appearing falsely full.
2. **Docker Socket Permissions**: Edge agents running as non-root users must belong to the `docker` group (`usermod -aG docker <user>`) to access `/var/run/docker.sock`.
3. **Raspberry Pi Swap**: Expand `CONF_SWAPSIZE=1536` in `/etc/dphys-swapfile` to ensure stability for agents and Portainer containers.
4. **SSH Process Killing**: Never run `pkill -f nexusops-agent` over an SSH session, as the SSH connection string matches `-f` and terminates your own session. Always use exact process matching `pkill -x nexusops-agent`.
5. **Docker Compose Rebuilds**: Always invoke `docker rm -f <container>` before `docker-compose up -d <service>` to avoid Docker daemon KeyError states on running containers.
