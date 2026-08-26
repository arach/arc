#!/bin/bash
# Start Scout broker on arc-server (persistent, survives logout).
set -euo pipefail

BUN=/home/exedev/.bun/bin/bun
RUNTIME=/home/exedev/.bun/install/global/node_modules/@openscout/scout/bin/openscout-runtime.mjs

if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi

if [ ! -x "$BUN" ] || [ ! -f "$RUNTIME" ]; then
  echo "Install Scout first: bun add -g @openscout/scout" >&2
  exit 1
fi

# CLI on PATH for mesh enroll / non-interactive ssh
$SUDO ln -sf "$BUN" /usr/local/bin/bun
$SUDO ln -sf /home/exedev/.bun/install/global/node_modules/@openscout/scout/bin/scout /usr/local/bin/scout

$SUDO tee /etc/systemd/system/arc-scout.service >/dev/null <<EOF
[Unit]
Description=Scout broker (arc-server remote agents)
After=network.target

[Service]
Type=simple
User=exedev
Environment=PATH=/home/exedev/.bun/bin:/usr/local/bin:/usr/bin:/bin
EnvironmentFile=-/home/exedev/.config/scout/cursor.env
WorkingDirectory=/home/exedev/arc
ExecStart=$BUN $RUNTIME broker
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

$SUDO systemctl daemon-reload
$SUDO systemctl enable arc-scout

# Stop stale manual broker so systemd can own :43110
pkill -f 'openscout-runtime.mjs broker' 2>/dev/null || true
sleep 1

$SUDO systemctl restart arc-scout
sleep 2

# Scout-compatible Pi (pi_rpc transport) — omp 18.x
if ! "$BUN" pm -g ls 2>/dev/null | grep -q "@oh-my-pi/pi-coding-agent@18"; then
  "$BUN" add -g @oh-my-pi/pi-coding-agent@18.0.4
fi
cat > /home/exedev/.bun/bin/pi <<'PIEOF'
#!/usr/bin/env bash
export PATH="/home/exedev/.bun/bin:$PATH"
exec /home/exedev/.bun/bin/omp "$@"
PIEOF
chmod +x /home/exedev/.bun/bin/pi
$SUDO ln -sf /home/exedev/.bun/bin/pi /usr/local/bin/pi

# Free-tier OpenRouter models (exe.dev edge). Paid ids bill the edge.
ARC_AUTHOR_MODEL="${ARC_AUTHOR_MODEL:-nvidia/nemotron-3-ultra-550b-a55b:free}"
ARC_HOST_MODEL="${ARC_HOST_MODEL:-minimax/minimax-m3:free}"
CURSOR_AGENT_MODEL="${CURSOR_AGENT_MODEL:-composer-2.5}"
# Optional: /home/exedev/.config/scout/cursor.env with CURSOR_API_KEY=cursor_...
CURSOR_ENV_FILE="${CURSOR_ENV_FILE:-/home/exedev/.config/scout/cursor.env}"

mkdir -p /home/exedev/.omp/agent
python3 <<PY
import json, os, urllib.request

def is_free(m):
    p = m.get("pricing") or {}
    try:
        return float(p.get("prompt", 1) or 1) == 0 and float(p.get("completion", 1) or 1) == 0
    except (TypeError, ValueError):
        return False

data = json.load(urllib.request.urlopen("https://openrouter.int.exe.xyz/api/v1/models"))["data"]
free = [m for m in data if is_free(m)]
# Prefer coding/agent-capable free models in the Pi catalog.
prefer = (
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "minimax/minimax-m3:free",
    "cohere/north-mini-code:free",
    "z-ai/glm-5.2:free",
    "poolside/laguna-s-2.1:free",
    "openrouter/free",
)
by_id = {m["id"]: m for m in free}
ordered = [by_id[i] for i in prefer if i in by_id]
ordered += [m for m in free if m["id"] not in prefer][:40 - len(ordered)]

entries = [{
    "id": m["id"], "name": m.get("name", m["id"]), "reasoning": ":reasoning" in m["id"] or "nemotron" in m["id"],
    "input": ["text"], "contextWindow": m.get("context_length", 128000), "maxTokens": 8192,
    "cost": {"input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0},
} for m in ordered]
cfg = {"providers": {"openrouter": {
    "baseUrl": "https://openrouter.int.exe.xyz/api/v1",
    "api": "openai-completions", "apiKey": "implicit", "authHeader": True,
    "models": entries}}}
json.dump(cfg, open("/home/exedev/.omp/agent/models.json", "w"), indent=2)
print(f"openrouter free models: {len(entries)} (author={os.environ.get('ARC_AUTHOR_MODEL')} host={os.environ.get('ARC_HOST_MODEL')})")
PY
export ARC_AUTHOR_MODEL ARC_HOST_MODEL
curl -sf http://127.0.0.1:43110/health | head -3

# Remote Pi agents — inference via exe.dev OpenRouter edge (free-tier models)
cd /home/exedev/arc
scout card retire arc-author 2>/dev/null || true
scout card retire arc-host 2>/dev/null || true
scout card retire arc-composer 2>/dev/null || true
scout --json card create /home/exedev/arc \
  --name arc-author --display-name "Arc Author (Nemotron)" \
  --harness pi --provider openrouter \
  --model "$ARC_AUTHOR_MODEL" \
  --permission-profile workspace_write --no-input >/dev/null
scout --json card create /home/exedev/arc \
  --name arc-host --display-name "Arc Host" \
  --harness pi --provider openrouter \
  --model "$ARC_HOST_MODEL" \
  --permission-profile workspace_write --no-input >/dev/null

# Cursor API / Composer — optional, metered; enable with cursor.env on the VM.
mkdir -p "$(dirname "$CURSOR_ENV_FILE")"
if [ -f "$CURSOR_ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a && . "$CURSOR_ENV_FILE" && set +a
fi
if [ -n "${CURSOR_API_KEY:-}" ]; then
  if ! command -v cursor-agent >/dev/null 2>&1; then
    curl -fsSL https://cursor.com/install | bash
    export PATH="/home/exedev/.local/bin:/home/exedev/.cursor/bin:$PATH"
  fi
  scout --json card create /home/exedev/arc \
    --name arc-composer --display-name "Arc Composer" \
    --harness cursor --model "$CURSOR_AGENT_MODEL" \
    --permission-profile workspace_write --no-input >/dev/null
  echo "Remote agents: arc-author ($ARC_AUTHOR_MODEL), arc-host ($ARC_HOST_MODEL), arc-composer (cursor/$CURSOR_AGENT_MODEL)"
else
  echo "Remote agents: arc-author ($ARC_AUTHOR_MODEL), arc-host ($ARC_HOST_MODEL)"
  echo "Composer: add CURSOR_API_KEY to $CURSOR_ENV_FILE and re-run this script"
fi

echo "Scout broker: http://127.0.0.1:43110"
echo "Mesh enroll from your Mac: scout mesh enroll ssh://arc-server.exe.xyz --tier control --yes"
echo "Then join Tailscale + announce: scripts/exe-dev-mesh.sh"
