# exe.dev Deployment — Agent Context

Arc runs on exe.dev so **agent work stays off your Mac** — Shelley + Pi on the VM use exe.dev's LLM gateway (`llm.int.exe.xyz`), not local Codex/Claude.

| VM | Service | Port | Public URL |
|----|---------|------|------------|
| `arc-studio` | `arc-studio` | 5188 | https://arc-studio.exe.xyz/ |
| `arc-server` | `arc-mcp` | 5190 | https://arc-server.exe.xyz/mcp |
| `arc-server` | Shelley | — | https://arc-server.shelley.exe.xyz |

## Remote dispatch (no local resources)

```bash
# Primary — Shelley on exe.dev (LLM runs in the cloud)
scripts/arc-remote.sh author "Draft a platform diagram and open it in the studio"
scripts/arc-remote.sh host "git pull, rebuild, restart services, curl health"
scripts/arc-remote.sh studio "confirm /editor returns 200"

# Or directly
ssh exe.dev shelley prompt arc-server "…"
```

Scout broker on the VM (for Pi cards when mesh routing is up):

```bash
ssh arc-server.exe.xyz 'cd ~/arc && scout ask --to arc-author --notify "…"'
```

Mesh enroll once from your Mac:

```bash
scout mesh enroll ssh://arc-server.exe.xyz --tier control --yes
```

Then join the mesh (one command per machine):

```bash
scripts/exe-dev-mesh.sh   # Tailscale auth if needed, then `scout mesh join` on both sides
```

After mesh is live, dispatch without local LLM:

```bash
scout ask --to arc-author.arc-server --notify "Draft a diagram and hand off to studio"
```

`scripts/arc-remote.sh` tries mesh first, falls back to Shelley if the node isn't reachable yet.

## Bootstrap

Studio only:

```bash
ssh arc-studio.exe.xyz 'ARC_SETUP_MODE=studio bash -s' < scripts/exe-dev-setup.sh
```

MCP server only:

```bash
ssh arc-server.exe.xyz 'ARC_SETUP_MODE=server ARC_EDITOR_URL=https://arc-studio.exe.xyz bash -s' < scripts/exe-dev-setup.sh
ssh arc-server.exe.xyz 'bash -s' < scripts/exe-dev-scout.sh   # Scout broker + Pi agents
```

Both on one VM (`ARC_SETUP_MODE=all`, default).

Tag VMs: `ssh exe.dev tag arc-studio arc` and `ssh exe.dev tag arc-server arc`

Share ports: `ssh exe.dev share port arc-server 5190 && ssh exe.dev share set-public arc-server`

## Redeploy

```bash
scout ask --project /Users/art/dev/arc "Redeploy arc exe.dev: pull on arc-studio and arc-server, rebuild, restart arc-studio and arc-mcp services, curl health endpoints, report status to #arc."
```

Manual:

```bash
for host in arc-studio arc-server; do
  ssh ${host}.exe.xyz 'cd ~/arc && git pull && ~/.bun/bin/bun install && ~/.bun/bin/bun run build:lib && ~/.bun/bin/bun run build:mcp && sudo systemctl restart arc-mcp arc-studio 2>/dev/null; sudo systemctl restart arc-mcp 2>/dev/null; true'
done
```

## MCP over HTTP

```json
{
  "mcpServers": {
    "arc": {
      "url": "https://arc-server.exe.xyz/mcp"
    }
  }
}
```

Local stdio: `bun run mcp` or `arc-mcp`.

## Scout

| Handle | Where it runs | Dispatch |
|--------|---------------|----------|
| `#arc` | channel | `scout send --channel arc "…"` |
| `@arc-author` | arc-server VM (Pi / Nemotron) | `scripts/arc-remote.sh author "…"` |
| `@arc-fast` | arc-server VM (Pi / GLM 5.3) | `scripts/arc-remote.sh fast "…"` |
| `@arc-host` | arc-server VM | `scripts/arc-remote.sh host "…"` |
| Shelley | arc-server | https://arc-server.shelley.exe.xyz |

```bash
scripts/arc-remote.sh author "sketch a 3-tier app and hand off to studio"
scout send --channel arc "deploy complete"
```
