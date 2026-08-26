#!/bin/bash
# Dispatch Arc agent work to exe.dev — no local harness, no local LLM.
#
# Usage:
#   scripts/arc-remote.sh author "Draft a 3-tier web app diagram and hand off to studio"
#   scripts/arc-remote.sh host "curl health endpoints and restart arc-mcp if needed"
#   scripts/arc-remote.sh studio "verify /editor returns 200"
#   scripts/arc-remote.sh shelley "free-form prompt on arc-server"
#
# Scout (runs on VM broker; use when Pi mesh is healthy):
#   scripts/arc-remote.sh composer "refactor LandingPage with isometric section"
#   scripts/arc-remote.sh fast "validate this diagram JSON and hand off to studio"
set -euo pipefail

ROLE="${1:-author}"
shift || true
PROMPT="${*:-}"

if [ -z "$PROMPT" ]; then
  echo "Usage: arc-remote.sh <author|fast|host|composer|studio|shelley|scout-ask> <prompt>" >&2
  exit 1
fi

wrap_author() {
  cat <<EOF
You are @arc-author on arc-server (exe.dev). Work in ~/arc.
Read infra/exe-dev/AGENTS.server.md and skills/arc-diagrams/SKILL.md.
Use MCP at http://127.0.0.1:5190/mcp when you need validate_diagram, auto_layout, render_ascii, or editor_handoff.
Studio: https://arc-studio.exe.xyz/editor

Task: $PROMPT
EOF
}

wrap_host() {
  cat <<EOF
You are @arc-host on arc-server (exe.dev). Work in ~/arc.
Read skills/arc-host/SKILL.md. You own exe.dev deploy health and restarts.

Task: $PROMPT
EOF
}

wrap_fast() {
  cat <<EOF
You are @arc-fast on arc-server (exe.dev). Work in ~/arc.
Lightweight tasks: validate diagrams, quick JSON edits, docs tweaks, health summaries.
Read skills/arc-diagrams/SKILL.md. MCP: http://127.0.0.1:5190/mcp

Task: $PROMPT
EOF
}

wrap_composer() {
  cat <<EOF
You are @arc-composer on arc-server (exe.dev). Work in ~/arc.
Use Cursor Composer for high-quality UI/code tasks. Read skills/arc-diagrams/SKILL.md when editing diagrams.
Studio: https://arc-studio.exe.xyz/editor

Task: $PROMPT
EOF
}

wrap_studio() {
  cat <<EOF
You are the Arc studio operator on arc-studio (exe.dev). Work in ~/arc.
Read infra/exe-dev/AGENTS.studio.md.

Task: $PROMPT
EOF
}

case "$ROLE" in
  author|a)
    if scout ask --to @arc-author.master.node:arc-server --notify "$PROMPT" 2>/dev/null; then
      exit 0
    fi
    ssh exe.dev shelley prompt arc-server "$(wrap_author)"
    ;;
  fast|f)
    if scout ask --to @arc-fast.master.node:arc-server --notify "$PROMPT" 2>/dev/null; then
      exit 0
    fi
    ssh exe.dev shelley prompt arc-server "$(wrap_fast)"
    ;;
  host|h|ops)
    if scout ask --to @arc-host.master.node:arc-server --notify "$PROMPT" 2>/dev/null; then
      exit 0
    fi
    ssh exe.dev shelley prompt arc-server "$(wrap_host)"
    ;;
  composer|c)
    if scout ask --to @arc-composer.master.node:arc-server --notify "$PROMPT" 2>/dev/null; then
      exit 0
    fi
    ssh exe.dev shelley prompt arc-server "$(wrap_composer)"
    ;;
  studio|s)
    ssh exe.dev shelley prompt arc-studio "$(wrap_studio)"
    ;;
  shelley)
    ssh exe.dev shelley prompt arc-server "$PROMPT"
    ;;
  scout-ask|scout)
    TARGET="${1:-arc-author}"
    shift || true
    REMOTE_PROMPT="${*}"
    if [ -z "$REMOTE_PROMPT" ]; then
      echo "Usage: arc-remote.sh scout-ask <arc-author|arc-fast|arc-host|arc-composer> <prompt>" >&2
      exit 1
    fi
    ssh arc-server.exe.xyz "cd ~/arc && scout ask --to ${TARGET} --notify $(printf '%q' "$REMOTE_PROMPT")"
    ;;
  *)
    echo "Unknown role: $ROLE (use author|fast|host|composer|studio|shelley|scout-ask)" >&2
    exit 1
    ;;
esac
