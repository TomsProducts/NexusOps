# NexusOps — Intelligent Autonomous Infrastructure Monitoring & Remediation Platform

![NexusOps Banner](https://img.shields.io/badge/NexusOps-Production-00f0ff?style=for-the-badge&logo=shield)
![Go](https://img.shields.io/badge/Agent-Go%201.22-00ADD8?style=flat-square&logo=go)
![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203.2.5%20%7C%20Java%2021-6DB33F?style=flat-square&logo=springboot)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014%20%7C%20Tailwind-000000?style=flat-square&logo=next.js)
![Docker](https://img.shields.io/badge/Containers-Docker%20UNIX%20Socket-2496ED?style=flat-square&logo=docker)
![AI](https://img.shields.io/badge/AI%20Engine-9Router%20%7C%20Gemini%20Flash-FF6F00?style=flat-square)

NexusOps is a high-performance, real-time infrastructure observability and autonomous remediation platform built for bare-metal, virtualized, and edge environments. It combines lightweight, cross-platform telemetry agents with a reactive control plane, automated diagnostic runbooks, live container management, service health plugins, and LLM-assisted incident analysis via 9Router.

---

## Live Fleet Topology

| Server Name | Hostname | IP Address | OS / Architecture | Monitored Services & Workloads |
| :--- | :--- | :--- | :--- | :--- |
| **`DeployCasaServer`** | `casa` | `192.168.68.117` | Ubuntu 24.04 (x86_64) | Control Plane (Next.js, Spring Boot, Postgres 16, Redis 7, 9Router, Heimdall, Gitea). 43 containers with live CPU/RAM stats. |
| **`Desktop`** | `ServerNUC` | `192.168.68.108` | Linux Mint 22 (x86_64) | Workstation Node. Daemonized via systemd (`nexusops-agent.service`). Monitored mounts, open ports, systemd health. |
| **`rasberry1`** | `raspberrypi` | `192.168.68.122` | Debian 12 (ARMv7 32-bit) | Edge Gateway. Pi-hole DNS (:53), Tailscale router, Portainer Agent, 1.5 GB expanded swap. |

---

## Architecture Overview

```
                                      ┌────────────────────────────────────────────────────────┐
                                      │                    Web Dashboard                       │
                                      │        Next.js 14 App Router + Tailwind CSS            │
                                      │         Port: 3000  (Live WebSocket + REST)            │
                                      └───────────────────────────┬────────────────────────────┘
                                                                  │
                                                                  ▼
┌─────────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────┐
│                                                     NexusOps Backend (Spring Boot 3)                                              │
│                                                     Port: 8080 (REST, Stomp/WebSocket)                                             │
├───────────────────────────────┬───────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┤
│    Telemetry & Alert Engine   │    Action Approval Broker     │      Multi-Tenant Auth (JWT)    │       9Router AI Gateway        │
│    Sub-second ingestion       │   Policy validation & audit   │      Role-based access (RBAC)   │       ag/gemini-3.8-flash       │
└───────────────┬───────────────┴───────────────┬───────────────┴─────────────────┬───────────────┴─────────────────┬───────────────┘
                │                               │                                 │                                 │
                ▼                               ▼                                 ▼                                 ▼
      ┌──────────────────┐            ┌──────────────────┐              ┌──────────────────┐              ┌──────────────────┐
      │  PostgreSQL 16   │            │     Redis 7      │              │   9Router Core   │              │   Edge Agents    │
      │ Telemetry/Audit  │            │ Pub/Sub & Cache  │              │    Port: 20128   │              │  Go v1.8.2 (poll)│
      └──────────────────┘            └──────────────────┘              └──────────────────┘              └────────┬─────────┘
                                                                                                                    │
                             ┌─────────────────────────────────────┬────────────────────────────────────────────────┘
                             ▼                                     ▼
                  ┌──────────────────────┐              ┌──────────────────────┐
                  │ x86_64 Linux Agent   │              │  ARMv7 Edge Agent    │
                  │ Ubuntu / Mint Linux  │              │  Raspberry Pi OS     │
                  │ Docker Socket + Logs │              │  Tailscale + Pi-hole │
                  └──────────────────────┘              └──────────────────────┘
```

---

## Monorepo Structure

```
├── agent/                       # Lightweight Go daemon (<15MB RAM footprint)
│   ├── client/                  # HTTP API client with auth & token rotation
│   ├── collector/               # System metrics, /var/run/docker.sock, ps, journalctl
│   │   ├── docker.go            # Docker UNIX socket client with per-container CPU & RAM stats
│   │   ├── services.go          # Database & service plugins (Redis, Postgres, Ports, Mounts, Inodes, Systemd, SSL)
│   │   ├── processes.go         # ps -eo table parser and sorter
│   │   ├── syslogs.go           # journalctl -p err..emerg error stream
│   │   └── metrics.go           # CPU, memory, disk, network, load avg
│   ├── executor/                # Strictly allowlisted diagnostic & remediation engine
│   │   └── actions.go           # Container logs, container restart, diagnostics, service controls
│   └── main.go                  # CLI entrypoint, auto-enrollment, heartbeat daemon
│
├── backend/                     # Enterprise Spring Boot 3 reactive control plane
│   ├── src/main/java/com/nexusops/
│   │   ├── controller/          # REST endpoints (/api/servers, /api/actions, /api/ai, /api/agent)
│   │   ├── dto/                 # Strongly typed transfer models with JSON annotations
│   │   ├── model/               # JPA entities (Server, Metric, Incident, Action, AuditLog)
│   │   ├── repository/          # PostgreSQL Spring Data interfaces
│   │   ├── service/             # Telemetry ingestion, 9Router AI client, policy broker
│   │   └── config/              # Security, JWT, WebSocket stomp message broker
│   └── pom.xml                  # Maven build configuration
│
├── frontend/                    # Futuristic glassmorphism web console
│   ├── src/app/
│   │   ├── dashboard/           # Live topology grid, system health score, activity feeds
│   │   ├── servers/             # Fleet grid, Docker containers (CPU/RAM), Services & Plugins, Process tree, Logs
│   │   ├── actions/             # Policy-controlled remediation queue & runbook dispatcher
│   │   ├── ai/                  # Real-time incident troubleshooting via 9Router
│   │   ├── incidents/           # Incident tracking, severity triage, root-cause analysis
│   │   ├── alerts/              # Threshold violations and active firing alert rules
│   │   └── audit/               # Immutable operational audit trail
│   └── package.json             # Next.js 14, Tailwind CSS, Lucide icons
│
├── database/                    # DDL schema definitions, indexes, audit triggers
├── docker/                      # Multi-stage production Dockerfiles & compose files
│   ├── Dockerfile.backend       # Eclipse Temurin 21 JRE Alpine image
│   ├── Dockerfile.frontend      # Node.js 20 Alpine standalone image
│   ├── Dockerfile.agent         # Multi-arch Go builder
│   └── docker-compose.yml       # Complete stack orchestration (DB, Redis, Backend, Frontend)
└── scripts/                     # Automation, agent enrollment, and diagnostics
```

---

## Core Capabilities

### 1. Docker Runtime Inspection & Real-time Resource Usage
- **Direct UNIX Domain Socket**: Communicates directly with `/var/run/docker.sock` without shell overhead or dependency on the Docker CLI.
- **Per-Container CPU %**: Computed across container CPU counter deltas and system counter deltas multiplied by online CPU cores.
- **Per-Container Memory & Inactive File Deduction**: Accurately computes non-reclaimable RAM usage in MB/GB and percentage capacity, correctly accounting for cgroups v1 (`cache`) and cgroups v2 (`inactive_file`).
- **Demultiplexed Log Streaming**: Demultiplexes Docker's 8-byte multiplexed stdout/stderr frame headers to deliver clean terminal logs with line search and copy.
- **Controlled Container Restarts**: Safe, authenticated restart actions dispatched directly through the agent action queue.

### 2. Database & Infrastructure Plugins
- **Redis Health Engine**: Probes port 6379, executes raw `INFO`, parses response latency (<0.3 ms), memory consumed, connected clients, operations per second, cache hit rate, and uptime.
- **PostgreSQL Diagnostics**: Probes port 5432 handshake latency (<1 ms) and samples active connection count from `pg_stat_activity`.
- **TCP Port Prober & Latency Matrix**: High-speed parallel TCP probes across critical service ports (22, 53, 80, 443, 3000, 5432, 6379, 8080, 20128) displaying real-time open/closed status and latency in milliseconds.
- **Filesystems & Inodes Health**: Monitors all physical mountpoints (`/proc/mounts`), calculates used vs. total GB, and checks inode utilization to preempt disk exhaustion.
- **Systemd Service Reliability**: Evaluates `systemctl --failed` to instantly surface failing or degraded daemon units.
- **SSL / TLS Certificate Expiry**: Probes port 443 TLS handshake, extracts subject domain, issuer, and days remaining with graduated visual warnings.

### 3. Live Process Tree & Resource Analysis
- Collects and parses top active processes (`ps -eo pid,user,%cpu,%mem,vsz,rss,stat,time,comm --sort=-%cpu`).
- Filter by command name, user, or PID.
- Dynamic color-coding for high CPU and memory consumers.

### 4. Critical Linux System Journal Monitoring
- Scans `journalctl -p err..emerg -n 20 --no-pager -o short-iso` for critical system-level errors.
- Automatic fallback to `dmesg --level=err,warn -T` on stripped kernel environments.

### 5. Zero Arbitrary Shell Guarantee
- NexusOps strictly forbids arbitrary remote shell execution (`ssh`, `sh -c`, `eval`).
- All remediations are schema-validated, allowlisted by agent policy, run under local timeouts, and verified post-execution.

---

## Compilation & Deployment Runbook

### Build Agent Binaries (Containerized Go)

```bash
# Build x86_64 Agent (Standard Linux / Ubuntu / Debian / Rocky)
docker run --rm -v $(pwd)/agent:/src -w /src \
  golang:1.22-alpine go build -ldflags="-s -w" -o nexusops-agent main.go

# Build ARMv7 Agent (Raspberry Pi 32-bit / ARMv7l)
docker run --rm -v $(pwd)/agent:/src -w /src \
  -e GOOS=linux -e GOARCH=arm -e GOARM=7 -e CGO_ENABLED=0 \
  golang:1.22-alpine go build -ldflags="-s -w" -o nexusops-agent-armv7 main.go

# Fix local file permissions
docker run --rm -v $(pwd)/agent:/src alpine chown -R 1000:1000 /src
```

### Install as Systemd Service

```ini
[Unit]
Description=NexusOps Infrastructure Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/nexusops-agent -config /etc/nexusops/agent.json
Restart=always
RestartSec=5
KillMode=process
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nexusops-agent
sudo systemctl status nexusops-agent
```

### Edge Device Tuning (Raspberry Pi)

To expand virtual swap memory on Raspberry Pi for stability during heavy workloads:
```bash
sudo sed -i 's/^CONF_SWAPSIZE=.*/CONF_SWAPSIZE=1536/' /etc/dphys-swapfile
sudo systemctl restart dphys-swapfile
free -h  # Verify swap is 1.5 GiB
```

Ensure user access to the Docker socket:
```bash
sudo usermod -aG docker thomas
sudo chmod 666 /var/run/docker.sock
```

---

## Access & Endpoints

- **Web Dashboard**: [http://192.168.68.117:3000](http://192.168.68.117:3000)
- **Servers Fleet View**: [http://192.168.68.117:3000/servers](http://192.168.68.117:3000/servers)
- **Backend API**: [http://192.168.68.117:8080/api](http://192.168.68.117:8080/api)
- **9Router AI Gateway**: [http://192.168.68.117:20128](http://192.168.68.117:20128)
- **Default Credentials**: `admin@example.com` / `password`

---

## License

NexusOps is proprietary software developed for the NextLayer product suite. All rights reserved.
