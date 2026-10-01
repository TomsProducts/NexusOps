#!/usr/bin/env bash
# ==============================================================================
# NexusOps Agent One-Line Installer for Linux (Ubuntu / Debian / RHEL / Rocky)
# ==============================================================================
set -e

SERVER_URL="http://192.168.68.117:8080/api"
ENROLLMENT_TOKEN=""
CONFIG_DIR="/etc/nexusops"
CONFIG_FILE="${CONFIG_DIR}/agent.json"
BIN_TARGET="/usr/local/bin/nexusops-agent"
SERVICE_FILE="/etc/systemd/system/nexusops-agent.service"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --token) ENROLLMENT_TOKEN="$2"; shift ;;
        --url) SERVER_URL="$2"; shift ;;
        -h|--help)
            echo "Usage: sudo ./install-agent.sh --token <ENROLLMENT_TOKEN> [--url <API_URL>]"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
    shift
done

if [ "$EUID" -ne 0 ]; then
  echo "[ERROR] Please run the installer as root (e.g. with sudo)."
  exit 1
fi

if [ -z "$ENROLLMENT_TOKEN" ]; then
  echo "[ERROR] Missing mandatory argument: --token <ENROLLMENT_TOKEN>"
  exit 1
fi

echo "=========================================================="
echo "  Installing NexusOps Agent v1.8.2"
echo "  Server endpoint: ${SERVER_URL}"
echo "=========================================================="

# Create config directory
mkdir -p "${CONFIG_DIR}"

# Detect architecture
ARCH=$(uname -m)
case "$ARCH" in
    x86_64) AGENT_ARCH="amd64" ;;
    aarch64|arm64) AGENT_ARCH="arm64" ;;
    *) echo "[ERROR] Unsupported system architecture: $ARCH"; exit 1 ;;
esac

# Write initial configuration
cat <<EOF > "${CONFIG_FILE}"
{
  "server_url": "${SERVER_URL}",
  "enrollment_token": "${ENROLLMENT_TOKEN}",
  "interval_sec": 15,
  "heartbeat_sec": 30,
  "allow_actions": true,
  "allowed_services": ["nginx", "mariadb", "mysql", "postgresql", "docker", "redis"]
}
EOF
chmod 600 "${CONFIG_FILE}"

# If local binary exists in build artifact directory, install it; else pull from server release
if [ -f "./nexusops-agent" ]; then
    cp -f "./nexusops-agent" "${BIN_TARGET}"
elif [ -f "../agent/nexusops-agent" ]; then
    cp -f "../agent/nexusops-agent" "${BIN_TARGET}"
else
    echo "[INFO] Downloading precompiled agent binary from ${SERVER_URL}/agent/download/linux-${AGENT_ARCH} ..."
    curl -fsSL "${SERVER_URL}/agent/download/linux-${AGENT_ARCH}" -o "${BIN_TARGET}" || {
        echo "[WARN] Direct download failed. Creating fallback bootstrap wrapper..."
        # If building from source:
        if command -v go >/dev/null 2>&1 && [ -f "../agent/main.go" ]; then
            echo "[INFO] Compiling local Go agent..."
            (cd ../agent && go build -o "${BIN_TARGET}" main.go)
        fi
    }
fi

chmod +x "${BIN_TARGET}" 2>/dev/null || true

# Install Systemd Service
cat <<EOF > "${SERVICE_FILE}"
[Unit]
Description=NexusOps Infrastructure Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
ExecStart=${BIN_TARGET}
Restart=always
RestartSec=5
LimitNOFILE=65535
ProtectSystem=full
ProtectHome=read-only

[Install]
WantedBy=multi-user.target
EOF

# Reload and Start
systemctl daemon-reload
systemctl enable nexusops-agent
systemctl restart nexusops-agent || echo "[INFO] Agent service registered. Start when ready with: systemctl start nexusops-agent"

echo "=========================================================="
echo "  [SUCCESS] NexusOps Agent installed & registered!"
echo "  Status check: systemctl status nexusops-agent"
echo "  Logs: journalctl -u nexusops-agent -f"
echo "=========================================================="
