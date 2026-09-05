#!/bin/bash
# Install Arc agent context on an exe.dev VM (Shelley + harness AGENTS.md + skills).
# Called from exe-dev-setup.sh or standalone:
#   ARC_VM_ROLE=server bash scripts/exe-dev-agents.sh
#   ARC_VM_ROLE=studio bash scripts/exe-dev-agents.sh
set -euo pipefail

APP_DIR=/home/exedev/arc
ROLE="${ARC_VM_ROLE:-all}"

if [ ! -d "$APP_DIR/infra/exe-dev" ]; then
  echo "Missing $APP_DIR/infra/exe-dev — run from a cloned arc repo" >&2
  exit 1
fi

install_agents() {
  local src="$1"
  local dest_dir="$2"
  mkdir -p "$dest_dir"
  cp "$src" "$dest_dir/AGENTS.md"
}

case "$ROLE" in
  server)
    install_agents "$APP_DIR/infra/exe-dev/AGENTS.server.md" "$HOME/.config/shelley"
    install_agents "$APP_DIR/infra/exe-dev/AGENTS.server.md" "$HOME/.codex"
    install_agents "$APP_DIR/infra/exe-dev/AGENTS.server.md" "$HOME/.pi"
    ;;
  studio)
    install_agents "$APP_DIR/infra/exe-dev/AGENTS.studio.md" "$HOME/.config/shelley"
    install_agents "$APP_DIR/infra/exe-dev/AGENTS.studio.md" "$HOME/.codex"
    install_agents "$APP_DIR/infra/exe-dev/AGENTS.studio.md" "$HOME/.pi"
    ;;
  all)
    # Combined host — prefer studio copy (covers preview + can reach MCP remotely)
    install_agents "$APP_DIR/infra/exe-dev/AGENTS.studio.md" "$HOME/.config/shelley"
    install_agents "$APP_DIR/infra/exe-dev/AGENTS.server.md" "$HOME/.codex"
    install_agents "$APP_DIR/infra/exe-dev/AGENTS.studio.md" "$HOME/.pi"
    ;;
  *)
    echo "Unknown ARC_VM_ROLE=$ROLE (use server|studio|all)" >&2
    exit 1
    ;;
esac

# Skills ship with the repo under ~/arc/skills — Shelley discovers them from the workspace.
echo "Agent context installed for role=$ROLE"
echo "  Shelley: ~/.config/shelley/AGENTS.md"
echo "  Skills:  $APP_DIR/skills/{arc-diagrams,arc-host}"
