---
name: arc-host
description: Operate the Arc exe.dev deployment — studio, MCP server, health checks, and redeploy. Use on arc-studio or arc-server VMs, or when asked to check, restart, or update the hosted Arc stack.
when: exe.dev
---

# Arc Host (exe.dev)

You are on an exe.dev VM running Arc. Agents grok arc — diagrams are typed JSON, validated, and opened in the studio.

## Endpoints

| Surface | URL |
|---------|-----|
| Studio | https://arc-studio.exe.xyz/ |
| Editor | https://arc-studio.exe.xyz/editor |
| MCP HTTP | https://arc-server.exe.xyz/mcp |
| MCP health | https://arc-server.exe.xyz/health |
| Shelley (arc-server) | https://arc-server.shelley.exe.xyz |

Local on this VM:

| Service | Port | systemd unit |
|---------|------|--------------|
| Studio preview | 5188 | `arc-studio` |
| MCP HTTP | 5190 | `arc-mcp` |

Repo: `~/arc` (bun, React 19, Vite 7).

## MCP tools (authoring loop)

Connect to `http://127.0.0.1:5190/mcp` or the public URL. Tools:

- `validate_diagram` — schema check
- `auto_layout` — Sugiyama layout
- `render_ascii` — terminal preview
- `diagram_to_typescript` — TS module export
- `editor_handoff` — `#data=` studio URL

`ARC_EDITOR_URL` on arc-server points at the studio for handoff links.

## Redeploy

```bash
cd ~/arc
git pull --ff-only
~/.bun/bin/bun install
~/.bun/bin/bun run build:lib
~/.bun/bin/bun run build        # studio VM only
~/.bun/bin/bun run build:mcp
sudo systemctl restart arc-mcp arc-studio 2>/dev/null || sudo systemctl restart arc-mcp
curl -sf http://127.0.0.1:5190/health
curl -sf -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5188/editor  # studio VM
```

## Scout

Deployment channel: `#arc`. Aliases: `@arc-studio`, `@arc-server`, `@arc-author`, `@arc-host`.

```bash
scout send --channel arc "status: <one-line summary>"
```

Docs: `~/arc/docs/agent/exe-dev.agent.md`, `~/arc/docs/agent/mcp.agent.md`.
