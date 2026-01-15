---
title: Quickstart
description: Get started with Arc in 5 minutes
order: 2
---

# Quickstart

## Installation

```bash
# Install the player/renderer
pnpm add @arach/arc

# Or just the lightweight player
pnpm add @arach/arc-player
```

## Quick Start

```tsx
import { ArcDiagram } from '@arach/arc'
import type { ArcDiagramData } from '@arach/arc'

const diagram: ArcDiagramData = {
  layout: { width: 600, height: 300 },
  nodes: {
    frontend: { x: 50, y: 100, size: 'm' },
    backend: { x: 250, y: 100, size: 'm' },
    database: { x: 450, y: 100, size: 'm' },
  },
  nodeData: {
    frontend: { icon: 'Monitor', name: 'Frontend', color: 'violet' },
    backend: { icon: 'Server', name: 'Backend', color: 'emerald' },
    database: { icon: 'Database', name: 'Database', color: 'blue' },
  },
  connectors: [
    { from: 'frontend', to: 'backend', fromAnchor: 'right', toAnchor: 'left', style: 'api' },
    { from: 'backend', to: 'database', fromAnchor: 'right', toAnchor: 'left', style: 'db' },
  ],
  connectorStyles: {
    api: { color: 'violet', strokeWidth: 2, label: 'REST' },
    db: { color: 'blue', strokeWidth: 2, label: 'SQL' },
  },
}

function App() {
  return <ArcDiagram data={diagram} mode="light" theme="default" />
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
