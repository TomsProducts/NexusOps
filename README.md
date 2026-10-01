# NexusOps — Intelligent Autonomous Infrastructure Monitoring & Remediation Platform

![NexusOps Banner](https://img.shields.io/badge/NexusOps-Production-00f0ff?style=for-the-badge&logo=shield)
![Go](https://img.shields.io/badge/Agent-Go%201.22-00ADD8?style=flat-square&logo=go)
![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203.2.5%20%7C%20Java%2021-6DB33F?style=flat-square&logo=springboot)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014%20%7C%20Tailwind-000000?style=flat-square&logo=next.js)
![Docker](https://img.shields.io/badge/Containers-Docker%20UNIX%20Socket-2496ED?style=flat-square&logo=docker)
![AI](https://img.shields.io/badge/AI%20Engine-9Router%20%7C%20Gemini%20Flash-FF6F00?style=flat-square)

NexusOps is a high-performance, real-time infrastructure observability and autonomous remediation platform built for bare-metal, virtualized, and edge environments. It combines lightweight, cross-platform telemetry agents with a reactive control plane, automated diagnostic runbooks, live container management, and LLM-assisted incident analysis via 9Router.

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
                             ┌─────────────────────────────────────┬───────────────────────────────────────────────┘
                             ▼                                     ▼
                  ┌──────────────────────┐              ┌──────────────────────┐
                  │ x86_64 Linux Agent   │              │  ARMv7 Edge Agent    │
                  │ Ubuntu / Rocky Linux │              │  Raspberry Pi OS     │
                  │ Docker Socket + Logs │              │  Tailscale + Pi-hole │
                  └──────────────────────┘              └──────────────────────┘
```

---

## Monorepo Structure

```
├── agent/                       # Lightweight Go daemon (<15MB RAM footprint)
│   ├── client/                  # HTTP API client with auth & token rotation
│   ├── collector/               # System metrics, /var/run/docker.sock, ps, journalctl
│   │   ├── docker.go            # Direct Docker UNIX socket API client
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
│   │   ├── servers/             # Fleet grid, Docker container inspector, process tree, system logs
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

## Key Features

### 1. Docker Runtime Inspection & Remote Terminal Logs
- Directly interfaces with `/var/run/docker.sock` over a raw UNIX domain socket without invoking the `docker` CLI binary.
- Decodes Docker's 8-byte multiplexed stdout/stderr frame headers to deliver clean terminal output.
- Real-time container inventory (ID, names, images, uptime, port maps).
- One-click live log streaming modal with search, line numbers, and clipboard copy.
- On-demand container restart with agent verification.

### 2. Live Process Tree & Resource Analysis
- Collects and parses top active processes (`ps -eo pid,user,%cpu,%mem,vsz,rss,stat,time,comm --sort=-%cpu`).
- Instant search filter by command name, user, or PID.
- Dynamic color-coding for high CPU and memory consumers.

### 3. Critical Linux System Journal Monitoring
- Scans `journalctl -p err..emerg -n 20 --no-pager -o short-iso` for critical system-level errors.
- Automatic fallback to `dmesg --level=err,warn -T` on stripped kernel environments.
- Structured output tagged by unit, timestamp, and severity.

### 4. Zero Arbitrary Shell Guarantee
- NexusOps forbids arbitrary remote shell commands (`ssh`, `sh -c`, `eval`).
- All remediations are schema-validated, allowlisted by agent policy, run under strict local timeouts, and verified post-execution:
  - `DOCKER_LIST_CONTAINERS`
  - `DOCKER_GET_LOGS`
  - `DOCKER_RESTART_CONTAINER`
  - `GET_PROCESS_LIST`
  - `GET_CRITICAL_LOGS`
  - `COLLECT_DIAGNOSTICS`
  - `RESTART_SERVICE` (allowlisted systemd services only)
  - `ROTATE_LOGS`

### 5. Multi-Architecture Support
- **x86_64**: Standard AMD64 Linux servers (Ubuntu, Rocky Linux, Debian).
- **ARMv7**: 32-bit ARM devices (Raspberry Pi 2/3/4 running Raspbian 12).
- **ARM64**: 64-bit ARM servers (AWS Graviton, Apple Silicon, Raspberry Pi 64-bit).

### 6. Native 9Router AI Integration
- Powered by `9Router` LLM gateway (`ag/gemini-3.8-flash`).
- Directly correlates live server telemetry, resource spikes, and journal errors to generate root-cause hypotheses and recommended allowlisted remediation steps.

---

## Quick Start (Docker Compose)

### 1. Launch the NexusOps Stack
```bash
cd docker
docker-compose up -d
```

### 2. Access the Applications
- **Web Console**: `http://<SERVER_IP>:3000`
- **Backend API**: `http://<SERVER_IP>:8080/api`
- **9Router AI Gateway**: `http://<SERVER_IP>:20128`
- **Default Credentials**: `admin@example.com` / `password`

### 3. Deploy Agents on Remote Machines

#### Build Agent Binaries (via Containerized Go)
```bash
# x86_64 (Standard Linux)
docker run --rm -v $(pwd)/agent:/src -w /src \
  golang:1.22-alpine go build -ldflags="-s -w" -o nexusops-agent main.go

# ARMv7 (Raspberry Pi 32-bit)
docker run --rm -v $(pwd)/agent:/src -w /src \
  -e GOOS=linux -e GOARCH=arm -e GOARM=7 \
  golang:1.22-alpine go build -ldflags="-s -w" -o nexusops-agent-armv7 main.go
```

#### Enroll & Run Agent
```bash
./nexusops-agent \
  -server http://<SERVER_IP>:8080/api \
  -token <ENROLLMENT_TOKEN> \
  -name "MyServer" \
  -config ~/.nexusops/agent.json
```

#### Run as Systemd Service
```ini
[Unit]
Description=NexusOps Linux Agent
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/nexusops-agent -config /etc/nexusops/agent.json
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

---

## License

NexusOps is proprietary software developed for the NextLayer product suite. All rights reserved.
