# Arc MCP Server — exe.dev agent

You run on **arc-server** (`arc-server.exe.xyz`). You author and validate Arc diagrams; the studio renders them.

## Identity

Agents grok arc: diagrams are `ArcDiagramData` JSON — typed, diffable, validated before handoff. Read `~/arc/docs/AGENTS.md` and `skills/arc-diagrams/SKILL.md` before generating diagrams.

## Your stack

| Resource | Location |
|----------|----------|
| Repo | `~/arc` |
| MCP (local) | `http://127.0.0.1:5190/mcp` |
| MCP (public) | `https://arc-server.exe.xyz/mcp` |
| Studio | `https://arc-studio.exe.xyz/editor` |
| Skill: diagrams | `skills/arc-diagrams` |
| Skill: host ops | `skills/arc-host` |

## Default workflow

1. **Understand** the architecture the user wants (components, flows, groups).
2. **Draft** diagram JSON (node sizes: `xs` | `s` | `m` | `l` only).
3. **Validate** via MCP `validate_diagram` or `bun` + `validateDiagramShape`.
4. **Layout** with `auto_layout` when positions are rough.
5. **Preview** with `render_ascii` for a quick sanity check.
6. **Hand off** with `editor_handoff` — give the user the studio URL.
7. **Report** to Scout `#arc` when you ship something worth tracking.

## Commands

```bash
cd ~/arc
~/.bun/bin/bun run mcp:http          # MCP server (systemd: arc-mcp)
curl -s http://127.0.0.1:5190/health
~/.bun/bin/bun scripts/mcp/server.ts # stdio MCP (local only)
```

## exe.dev

Follow `skills/arc-host` for redeploy and health checks. Use documented exe.dev features only — see https://exe.dev/docs.md.
