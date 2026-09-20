# Export Formats

An Arc diagram is just data, so it leaves the editor in whatever shape your pipeline
needs — versionable source, typed code, or rendered images.

## JSON

The raw, declarative diagram config (`layout`, `nodes`, `nodeData`, `connectors`,
`connectorStyles`). Diff it in code review, generate it programmatically, commit it
next to the system it describes.

## TypeScript

The same config as a typed `ArcDiagramData` object — drop it into a React app and
render with the component:

```tsx
import { ArcDiagram, type ArcDiagramData } from '@arach/arc'

const diagram: ArcDiagramData = { /* … */ }
<ArcDiagram data={diagram} theme="cool" mode="light" />
```

## SVG

Vector export — crisp at any size, ideal for docs, decks, and print. The static
`generateSVG()` path is deterministic and theme-aware; agents can call the same
export through MCP `render_svg` with `theme`/`mode` (`spacex`, `claude`, and
`codex` each have a sensible default mode). Branded themes include their grid
and frame by default; pass `includeGrid: false` to suppress the grid.

## PNG

Raster export for places that can't render SVG (READMEs, chat, social cards).
The editor and `/capture` screenshot endpoint produce PNGs, and MCP `render_png`
returns image content when a Chrome/Chromium executable is available (`ARC_CHROME`,
`CHROME_PATH`, `PUPPETEER_EXECUTABLE_PATH`, or a common install/PATH location).

## HTML / embeds

MCP `render_html` emits paste-ready integration output: `format=component` for a
React `<ArcDiagram />` TSX component, `format=iframe` for a studio embed tag, and
`format=html` for a standalone SVG document.

## ASCII

A Unicode/ASCII box-drawing render via `renderAscii()` — for terminals, code
comments, and plain-text READMEs.

```ts
import { renderAscii } from '@arach/arc'

console.log(renderAscii(diagram))
```

All formats come from the **same** declarative source — design once, render anywhere.
