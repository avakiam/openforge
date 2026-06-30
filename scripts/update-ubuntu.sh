#!/usr/bin/env bash
set -euo pipefail

APP_NAME="openforge"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RESTART_SERVICE=1
SKIP_OPENCODE=0

usage() {
  cat <<EOF
OpenForge Ubuntu updater

Usage:
  bash scripts/update-ubuntu.sh [options]

Options:
  --no-restart       Do not restart the systemd service.
  --service <name>   systemd service name. Default: ${APP_NAME}
  --skip-opencode    Do not update OpenCode.
  -h, --help         Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-restart)
      RESTART_SERVICE=0
      shift
      ;;
    --service)
      APP_NAME="$2"
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

service_exists() {
  command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files "${APP_NAME}.service" --no-legend 2>/dev/null | grep -q "${APP_NAME}.service"
}

cd "${APP_DIR}"

if [[ ! -d .git ]]; then
  echo "This directory is not a git clone: ${APP_DIR}" >&2
  exit 1
fi

echo "Updating OpenForge in ${APP_DIR}"
git fetch --prune
git pull --ff-only
npm install

if [[ "${SKIP_OPENCODE}" -eq 0 ]]; then
  if command -v opencode >/dev/null 2>&1; then
    echo "Updating OpenCode..."
    curl -fsSL https://opencode.ai/install | bash
  else
    echo "OpenCode is not installed yet. Installing..."
    curl -fsSL https://opencode.ai/install | bash
  fi
fi

if [[ "${RESTART_SERVICE}" -eq 1 ]]; then
  if service_exists; then
    echo "Restarting ${APP_NAME}.service..."
    need_sudo systemctl restart "${APP_NAME}"
    need_sudo systemctl status "${APP_NAME}" --no-pager
  else
    echo "No ${APP_NAME}.service found. Start manually with: npm start"
  fi
else
  echo "Update complete. Restart OpenForge manually when ready."
fi
