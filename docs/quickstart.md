---
title: Quickstart
description: Get started with Arc in 5 minutes
order: 2
---

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
