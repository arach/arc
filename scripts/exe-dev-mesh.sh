#!/bin/bash
# Bring arc-server onto the Scout mesh — one command per machine.
set -euo pipefail

VM=arc-server.exe.xyz

echo "Starting tailscaled if needed..."
ssh "$VM" 'sudo systemctl enable tailscaled 2>/dev/null; sudo systemctl start tailscaled 2>/dev/null' || true

AUTH_URL=$(ssh "$VM" 'sudo tailscale status 2>&1' | sed -n 's/^Log in at: //p' || true)

if [ -n "$AUTH_URL" ]; then
  echo ""
  echo "=== Tailscale auth required (one-time machine setup) ==="
  echo "Approve arc-server in your tailnet, then re-run:"
  echo "  $AUTH_URL"
  echo ""
  exit 1
fi

echo "Joining mesh on arc-server..."
ssh "$VM" 'export PATH=/home/exedev/.bun/bin:/usr/local/bin:$PATH
  sudo systemctl restart arc-scout
  sleep 2
  scout mesh join'

echo "Joining mesh locally..."
scout mesh join

echo ""
echo "Dispatch (no local LLM):"
echo "  scout ask --to @arc-author.node:arc-server --notify \"<task>\""
