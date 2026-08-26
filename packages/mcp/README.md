# @arach/arc-mcp

Model Context Protocol server for [Arc](https://github.com/arach/arc) diagrams.

Exposes validate, auto-layout, ASCII render, TypeScript export, and editor handoff
tools so agents can work with `ArcDiagramData` without reading the whole repo.

## Prerequisites

Build the core library first (the MCP server imports `@arach/arc`):

```bash
# from repo root — bundles utilities from src/
cd packages/mcp && bun install && bun run build
```

## Install

```bash
# monorepo
bun install

# npm (when published)
npm install -g @arach/arc-mcp
```

## Cursor / Claude Desktop config

```json
{
  "mcpServers": {
    "arc": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/arc/packages/mcp/dist/index.js"],
      "env": {
        "ARC_EDITOR_URL": "http://localhost:5188"
      }
    }
  }
}
```

Or after publishing:

```json
{
  "mcpServers": {
    "arc": {
      "command": "npx",
      "args": ["-y", "@arach/arc-mcp"]
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `validate_diagram` | Check JSON against `ArcDiagramData` shape |
| `auto_layout` | Run Sugiyama layout (full diagram or minimal input) |
| `render_ascii` | Unicode/ASCII box-drawing output |
| `diagram_to_typescript` | Emit a typed TS module |
| `editor_handoff` | Build `#data=` editor URL for the studio |

## Resources

| URI | Content |
|-----|---------|
| `arc://schema/diagram` | `src/types/diagram.ts` |
| `arc://skill/diagrams` | `skills/arc-diagrams/SKILL.md` |
| `arc://docs/llm` | `docs/llm.txt` |

## Development

```bash
cd packages/mcp
bun run build
bun run start   # stdio MCP server
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `ARC_EDITOR_URL` | `http://localhost:5188` | Base URL for `editor_handoff` links |
