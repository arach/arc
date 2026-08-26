# MCP Server — Agent Context

## Status: Shipped (`@arach/arc-mcp`)

Arc includes a stdio MCP server at `packages/mcp/`. It exposes diagram tools
agents can call without reading the whole repo.

## Install & Run

```bash
# from repo root
cd packages/mcp && bun install && bun run build
bun run start          # stdio MCP server

# or from root
bun run build:mcp
```

## Cursor / Claude Desktop Config

```json
{
  "mcpServers": {
    "arc": {
      "command": "node",
      "args": ["/absolute/path/to/arc/packages/mcp/dist/index.js"],
      "env": {
        "ARC_EDITOR_URL": "http://localhost:5188"
      }
    }
  }
}
```

When published to npm:

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
| `validate_diagram` | Check JSON against `ArcDiagramData`; returns `{ ok }` or `{ error }` |
| `auto_layout` | Run Sugiyama layout on a full diagram or minimal `AutoDiagramInput` |
| `render_ascii` | Unicode/ASCII box-drawing output (`charset`, `maxWidth` optional) |
| `diagram_to_typescript` | Emit a typed TS module (`exportName` optional) |
| `editor_handoff` | Build `#data=` editor URL + session id for the studio |

## Resources

| URI | Content |
|-----|---------|
| `arc://schema/diagram` | `src/types/diagram.ts` |
| `arc://skill/diagrams` | `skills/arc-diagrams/SKILL.md` |
| `arc://docs/llm` | `docs/llm.txt` |

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `ARC_EDITOR_URL` | `http://localhost:5188` | Base URL for `editor_handoff` |

## Implementation Notes

- Server code: `packages/mcp/src/server.ts`
- Bundles server-side Arc utilities (`validateDiagramShape`, `autoLayout`, `renderAscii`, `toTypeScriptSource`) from `src/`
- Does **not** require a browser; `editor_handoff` returns a URL to open manually
- PNG capture via `/capture/:sessionId` remains a separate dev-server step (see `docs/agent/verification.agent.md`)

## Also Available on `@arach/arc`

These functions are exported from the main package for programmatic use:

```typescript
import {
  validateDiagramShape,
  isDiagramShape,
  toTypeScriptSource,
  toExportFormat,
  autoLayout,
  renderAscii,
} from '@arach/arc'
```
