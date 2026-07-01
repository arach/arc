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

Vector export — crisp at any size, ideal for docs, decks, and print. Theme and mode
are baked into the output.

## PNG

Raster export for places that can't render SVG (READMEs, chat, social cards),
available from the editor and the `/capture` screenshot endpoint.

## ASCII

A Unicode/ASCII box-drawing render via `renderAscii()` — for terminals, code
comments, and plain-text READMEs.

```ts
import { renderAscii } from '@arach/arc'

console.log(renderAscii(diagram))
```

All formats come from the **same** declarative source — design once, render anywhere.
