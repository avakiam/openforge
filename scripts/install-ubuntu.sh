#!/usr/bin/env bash
set -euo pipefail

APP_NAME="openforge"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
OPENCODE_BIN_DIR="${HOME}/.opencode/bin"
HOST_VALUE="${HOST:-0.0.0.0}"
PORT_VALUE="${PORT:-3000}"
DATA_DIR="${OPENFORGE_DATA_DIR:-/var/lib/openforge}"
WORKSPACE_DIR="${OPENFORGE_DEFAULT_CWD:-/srv/openforge-workspaces}"
WITH_SERVICE=0
SKIP_OPENCODE=0

usage() {
  cat <<EOF
OpenForge Ubuntu installer

Usage:
  ./scripts/install-ubuntu.sh [options]

Options:
  --with-service          Install and start a systemd service.
  --host <host>           Service bind host. Default: ${HOST_VALUE}
  --port <port>           Service port. Default: ${PORT_VALUE}
  --data-dir <path>       Persistent data directory. Default: ${DATA_DIR}
  --workspace-dir <path>  Default terminal working directory. Default: ${WORKSPACE_DIR}
  --skip-opencode         Do not install OpenCode now.
  -h, --help              Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-service)
      WITH_SERVICE=1
      shift
      ;;
    --host)
      HOST_VALUE="$2"
      shift 2
      ;;
    --port)
      PORT_VALUE="$2"
      shift 2
      ;;
    --data-dir)
      DATA_DIR="$2"
      shift 2
      ;;
    --workspace-dir)
      WORKSPACE_DIR="$2"
      shift 2
      ;;
    --skip-opencode)
      SKIP_OPENCODE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

need_sudo() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

run_nodesource_setup() {
  if [[ "$(id -u)" -eq 0 ]]; then
    bash -
  else
    sudo -E bash -
  fi
}

have_node_20() {
  command -v node >/dev/null 2>&1 || return 1
  local major
  major="$(node -p "Number(process.versions.node.split('.')[0])" 2>/dev/null || echo 0)"
  [[ "${major}" -ge 20 ]]
}

echo "Installing OpenForge from ${APP_DIR}"
export PATH="${OPENCODE_BIN_DIR}:${PATH}"

if ! have_node_20; then
  echo "Installing Node.js 22..."
  if ! command -v curl >/dev/null 2>&1; then
    need_sudo apt-get update
    need_sudo apt-get install -y curl
  fi
  curl -fsSL https://deb.nodesource.com/setup_22.x | run_nodesource_setup
  need_sudo apt-get install -y nodejs
fi

echo "Node: $(node --version)"
echo "npm: $(npm --version)"

cd "${APP_DIR}"
npm install

if [[ "${SKIP_OPENCODE}" -eq 0 ]]; then
  if command -v opencode >/dev/null 2>&1; then
    echo "OpenCode already installed: $(command -v opencode)"
  else
    echo "Installing OpenCode..."
    curl -fsSL https://opencode.ai/install | bash
  fi
fi

if [[ "${WITH_SERVICE}" -eq 1 ]]; then
  echo "Installing systemd service..."
  need_sudo mkdir -p "${DATA_DIR}" "${WORKSPACE_DIR}"
  need_sudo chown -R "$(id -un):$(id -gn)" "${DATA_DIR}" "${WORKSPACE_DIR}"

  NPM_BIN="$(command -v npm)"
  SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"
  TMP_FILE="$(mktemp)"
  cat > "${TMP_FILE}" <<EOF
[Unit]
Description=OpenForge OpenCode web terminals
After=network.target

[Service]
Type=simple
User=$(id -un)
Group=$(id -gn)
WorkingDirectory=${APP_DIR}
ExecStart=${NPM_BIN} start
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=HOST=${HOST_VALUE}
Environment=PORT=${PORT_VALUE}
Environment=OPENFORGE_DATA_DIR=${DATA_DIR}
Environment=OPENFORGE_DEFAULT_CWD=${WORKSPACE_DIR}
Environment=PATH=${OPENCODE_BIN_DIR}:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

[Install]
WantedBy=multi-user.target
EOF
  need_sudo install -m 0644 "${TMP_FILE}" "${SERVICE_FILE}"
  rm -f "${TMP_FILE}"
  need_sudo systemctl daemon-reload
  need_sudo systemctl enable --now "${APP_NAME}"
  need_sudo systemctl status "${APP_NAME}" --no-pager
else
  cat <<EOF

OpenForge is installed.

Start it with:
  HOST=${HOST_VALUE} PORT=${PORT_VALUE} npm start

Or install the service with:
  bash scripts/install-ubuntu.sh --with-service
EOF
fi
