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
        "ARC_EDITOR_URL": "http://localhost:5188",
        "ARC_CHROME": "/path/to/chrome-or-chromium"
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

## Tools (v0.7 — authoring coverage)

| Tool | Description |
|------|-------------|
| `validate_diagram` | Validate JSON; returns `{ok, diagnostics[]}` with stable codes + repair fixes |
| `diff_diagram` | Structural diff `{ base, head }` → `DiagramDelta` |
| `auto_layout` | Sugiyama layout (full diagram or minimal input) |
| `render_ascii` | Unicode/ASCII box-drawing output |
| `render_svg` | Deterministic SVG markup from the static export path |
| `render_png` | PNG image content via optional Chrome/Chromium rasterization |
| `render_html` | `component` TSX, `iframe` embed, or standalone `html` output |
| `diagram_to_typescript` | Emit a typed TS module |
| `editor_handoff` | Build `#data=` studio URL + session id; `view` adds a `playerUrl` deep-linked to a `views[]` chapter |

`render_png` returns MCP `image` content (`mimeType: image/png`, base64 `data`) plus text metadata (`width`, `height`, `scale`, `bytes`, `chrome`, `theme`, `mode`). `render_svg`, `render_png`, and `render_html` accept Arc `theme`/`mode`; omit `mode` to use the theme's default (`claude` → light, `spacex`/`codex` → dark). Branded themes include their grid/frame by default; set `includeGrid: false` to suppress it. `render_html` returns paste-ready text: a React component for `format=component`, an iframe tag backed by the studio hash URL for `format=iframe`, or a standalone SVG HTML document for `format=html`.

## Resources

| URI | Content |
|-----|---------|
| `arc://schema/diagram` | Generated `schemas/arc-diagram.schema.json` |
| `arc://skill/diagrams` | `skills/arc-diagrams/SKILL.md` |
| `arc://docs/llm` | `docs/llm.txt` |

## PNG rasterization

`render_png` keeps `@arach/arc` dependency-free by reusing `generateSVG()` and
launching an installed Chrome/Chromium binary in headless screenshot mode. It
looks for `ARC_CHROME`, `CHROME_PATH`, `PUPPETEER_EXECUTABLE_PATH`, common OS
install paths, then `google-chrome`/`chromium` on `PATH`. If none is available,
the tool returns `render/chrome-unavailable` instead of a broken image.

## Not in MCP (yet)

These stay CLI/studio/API paths for now:

| Capability | Where |
|------------|-------|
| Dev PNG capture | `/capture/:sessionId` (dev server) |
| Mermaid import | `@arach/arc-viewer` |
| Read-only embed | `@arach/arc-viewer` (`<ArcDiagram />`) |
| Isometric YAML | `@arach/arc-iso` |

v0 targets the **authoring loop**: validate → layout → preview → open in studio. `diff_diagram` covers the review loop: base vs head → render the delta.

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
