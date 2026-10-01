#!/usr/bin/env bash
# ==============================================================================
# Deploy / Test NexusOps on Remote Testing Server (192.168.68.117)
# Note: Zero dependencies or services are installed on the local developer PC.
# ==============================================================================
set -e

REMOTE_HOST="192.168.68.117"
REMOTE_USER="tom"
REMOTE_DIR="/home/tom/nexusops"
LOCAL_DIR="/home/thomas/Documents/NewProducts/MonitorIT"

echo "=========================================================="
echo "  Deploying NexusOps to Remote Test Server: ${REMOTE_HOST}"
echo "=========================================================="

# Check connectivity
ping -c 1 "${REMOTE_HOST}" >/dev/null 2>&1 || {
  echo "[ERROR] Cannot reach remote host ${REMOTE_HOST}"
  exit 1
}

echo "[1/3] Syncing project files to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR} ..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${REMOTE_DIR}"
rsync -avz --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'target' \
  "${LOCAL_DIR}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

echo "[2/3] Building and starting containerized stack on ${REMOTE_HOST} ..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR}/docker && docker-compose up -d --build"

echo "[3/3] Verifying remote endpoints..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR}/docker && docker-compose ps"

echo "=========================================================="
echo "  NexusOps running on test server:"
echo "  - Web Console: http://${REMOTE_HOST}:3000"
echo "  - REST API:    http://${REMOTE_HOST}:8080/api"
echo "=========================================================="
