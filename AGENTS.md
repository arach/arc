# arc

> Diagrams as Code - Visual editor for architecture diagrams that live in your codebase

## Critical Context

**IMPORTANT:** Read these rules before making any changes:

- Arc exports two npm packages: @arach/arc (full editor) and @arach/arc-player (lightweight renderer)
- Diagrams are stored as declarative JSON/TypeScript configs, not binary files
- The editor uses useReducer + Context for state management (EditorProvider)
- Never modify diagram configs without understanding the schema in src/types/
- Exports should be deterministic - same input = same output for diffability

## Project Structure

| Component | Path | Purpose |
|-----------|------|---------|
| Editor | `src/components/editor/` | |
| Properties | `src/components/properties/` | |
| Utils | `src/utils/` | |
| Types | `src/types/` | |
| Player | `src/player/` | |
| Lib Entry | `src/index.ts` | |

## Quick Navigation

- Working with **diagram state**? → Check EditorProvider.tsx and editorReducer.ts
- Working with **node|connector|group**? → See src/types/diagram.ts for type definitions
- Working with **export|render**? → Look at src/utils/exportUtils.ts and src/player/
- Working with **isometric|3d**? → See src/utils/isometric.ts and IsometricNodeLayer.tsx

## Overview

> Diagrams as Code - Visual editor for architecture diagrams that live in your codebase

# Arc Overview

Arc is a visual editor for building architecture diagrams that stay in code. You design on a canvas, then export a clean, declarative model that can be stored in Git and rendered anywhere.

## Why Arc?

Architecture diagrams typically live in design tools, disconnected from the code they describe. Arc keeps diagrams as declarative configs that:

- **Version with your code** - Diffs show exactly what changed
- **Render anywhere** - Use the lightweight player or export to SVG/PNG
- **Stay consistent** - Templates enforce color palettes and sizing rules

## Key Features

- **Visual Editor** - Drag-and-drop nodes, connectors, groups, and images
- **Declarative Exports** - JSON/TypeScript configs designed for version control
- **Templates** - Built-in themes and sizing presets
- **Isometric View** - Toggle 3D projection for visual impact
- **Multiple Export Formats** - JSON, TypeScript, SVG, PNG, clipboard embed

## Packages

Arc ships as two npm packages:

| Package | Size | Use Case |
|---------|------|----------|
| `@arach/arc` | ~75KB | Full editor + player components |
| `@arach/arc-player` | ~7KB | Lightweight renderer only |

## Quick Links

- [Quickstart](./quickstart.md) - Get started in 5 minutes
- [Architecture](./architecture.md) - How the editor is built

## Quickstart

> Get started with Arc in 5 minutes

# Quickstart

Get up and running with Arc in under 5 minutes.

## Prerequisites

- Node.js >= 18
- React 18 or 19

## Installation

```bash
# Full editor + player
pnpm add @arach/arc

# Or just the lightweight player
pnpm add @arach/arc-player
```

## Using the Player

Render a diagram from a declarative config:

```tsx
import { ArcDiagram } from '@arach/arc'

const config = {
  layout: { width: 600, height: 300 },
  nodes: {
    web: { x: 50, y: 100, size: 'm' },
    api: { x: 250, y: 100, size: 'm' },
    db: { x: 450, y: 100, size: 'm' },
  },
  nodeData: {
    web: { icon: 'Monitor', name: 'Web App', color: 'blue' },
    api: { icon: 'Server', name: 'API', color: 'emerald' },
    db: { icon: 'Database', name: 'Database', color: 'violet' },
  },
  connectors: [
    { from: 'web', to: 'api', fromAnchor: 'right', toAnchor: 'left', style: 'http' },
    { from: 'api', to: 'db', fromAnchor: 'right', toAnchor: 'left', style: 'sql' },
  ],
  connectorStyles: {
    http: { color: 'amber', strokeWidth: 2, label: 'HTTP' },
    sql: { color: 'sky', strokeWidth: 2, label: 'SQL' },
  },
}

export default function MyDiagram() {
  return <ArcDiagram config={config} />
}
```

## Using the Editor

Embed the full editor in your app:

```tsx
import { DiagramEditor, EditorProvider } from '@arach/arc'

export default function Editor() {
  return (
    <EditorProvider>
      <DiagramEditor />
    </EditorProvider>
  )
}
```

## Vanilla JavaScript

For non-React environments:

```js
import { renderToElement } from '@arach/arc-player'

renderToElement(document.getElementById('diagram'), config)
```

## Development

Run the editor locally:

```bash
git clone https://github.com/arach/arc
cd arc
pnpm install
pnpm dev
```

The dev server runs on `http://localhost:5188`.

## Next Steps

- [Architecture](./architecture.md) - Understand the editor internals
- [CLAUDE.md](../CLAUDE.md) - AI agent instructions for this codebase

## Architecture

> How the Arc editor is built - state management, modules, and data flow

# Arc Architecture Overview

Arc is organized around a single diagram model and a small set of modules that read, edit, and
export that model. The goal is to keep editor behavior, state management, and export logic
separate so outputs stay stable even as the UI evolves.

## Major Modules

- `src/components/editor/`: The editor shell (top bar, canvas, panels, layers).
- `src/components/properties/`: Forms for editing node, connector, group, and grid settings.
- `src/components/dialogs/`: Export and share dialogs.
- `src/hooks/`: Keyboard shortcuts and canvas transform helpers.
- `src/utils/`: Diagram helpers, templates, export utilities, and file operations.
- `src/types/`: TypeScript types for diagram + editor state.

## State Model

State lives in a reducer + context pair (`EditorProvider`, `editorReducer`). The state shape is
split into four slices:

- `diagram`: layout, nodes, nodeData, connectors, connectorStyles, groups, images, exportZone
- `editor`: selection, mode, pending actions, template, zoom
- `meta`: filename, dirty state, last saved
- `history`: undo/redo stacks (capped for performance)

The reducer records history on meaningful changes and drives all interactions (add/remove nodes,
update connectors, change templates, etc.).

## Data Flow

1. **Input**: The editor dispatches actions from UI events.
2. **Reducer**: `editorReducer` updates the diagram and tracks history.
3. **Canvas**: `DiagramCanvas` renders nodes, connectors, groups, and images.
4. **Properties**: The panel writes updates back to the reducer.
5. **Export**: `exportUtils` and `fileOperations` serialize the model for external use.

## Diagram Config

Exported diagrams are declarative and designed to be embedded elsewhere:

```ts
{
  layout: { width: 1200, height: 700 },
  nodes: { api: { x: 80, y: 120, size: 'm' } },
  nodeData: { api: { icon: 'Server', name: 'API', color: 'emerald' } },
  connectors: [
    { from: 'web', to: 'api', fromAnchor: 'right', toAnchor: 'left', style: 'http' }
  ],
  connectorStyles: { http: { color: 'amber', strokeWidth: 2, label: 'HTTP' } }
}
```

Keep configs in version control so architecture updates travel with the product.

---
Generated by [Dewey](https://github.com/arach/dewey) | Last updated: 2026-01-15