# MCP Server — Agent Context

## Status: Shipped (`arc-mcp` bin on `@arach/arc`)

The MCP server is part of the main authoring package — same family as `arc-ascii`
and the dev studio. It is **not** a separate npm package.

## Run

```bash
# local dev (from repo)
bun run mcp

# published bin (after build:mcp)
arc-mcp
npx @arach/arc arc-mcp   # if invoked via package bin
```

Build the bundled bin: `bun run build:mcp` → `bin/arc-mcp.mjs`

## Cursor / Claude Desktop Config

```json
{
  "mcpServers": {
    "arc": {
      "command": "node",
      "args": ["/absolute/path/to/arc/bin/arc-mcp.mjs"],
      "env": {
        "ARC_EDITOR_URL": "http://localhost:5188"
      }
    }
  }
}
```

From a global install (after publish):

```json
{
  "mcpServers": {
    "arc": {
      "command": "arc-mcp"
    }
  }
}
```

## Tools (v0 — authoring coverage)

| Tool | Description |
|------|-------------|
| `validate_diagram` | Check JSON against `ArcDiagramData` |
| `auto_layout` | Sugiyama layout (full diagram or minimal input) |
| `render_ascii` | Unicode/ASCII box-drawing output |
| `diagram_to_typescript` | Emit a typed TS module |
| `editor_handoff` | Build `#data=` studio URL + session id |

## Resources

| URI | Content |
|-----|---------|
| `arc://schema/diagram` | `src/types/diagram.ts` |
| `arc://skill/diagrams` | `skills/arc-diagrams/SKILL.md` |
| `arc://docs/llm` | `docs/llm.txt` |

## Not in MCP (yet)

These stay CLI/studio/API paths for now:

| Capability | Where |
|------------|-------|
| SVG / PNG export | Studio Export, `exportUtils` |
| Dev PNG capture | `/capture/:sessionId` (dev server) |
| Mermaid import | `@arach/arc-viewer` |
| Read-only embed | `@arach/arc-viewer` (`<ArcDiagram />`) |
| Isometric YAML | `@arach/arc-iso` |

v0 targets the **authoring loop**: validate → layout → preview as text → open in studio.

## Implementation

- Source: `scripts/mcp/server.ts`
- Bundle: `scripts/build-arc-mcp.mjs` → `bin/arc-mcp.mjs`
- MCP SDK + zod are devDependencies, bundled into the bin (zero production deps on `@arach/arc`)

## Programmatic API (same package)

```typescript
import {
  validateDiagramShape,
  isDiagramShape,
  toTypeScriptSource,
  autoLayout,
  renderAscii,
} from '@arach/arc'
```
