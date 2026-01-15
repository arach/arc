---
title: Quickstart
description: Get started with Arc in 5 minutes
order: 2
---

# Quickstart

Get up and running with Arc in under 5 minutes.

## Installation

```bash
# Install the player/renderer
npm install @arach/arc

# Or install the visual editor CLI
npx @arach/arc-editor
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

For non-React projects, use the player package:

```html
<script type="module">
  import { renderDiagram } from '@arach/arc-player'

  renderDiagram(document.getElementById('diagram'), {
    layout: { width: 600, height: 300 },
    // ... diagram config
  })
</script>
```

## Next Steps

- Read the [API Reference](./api.md) for full component props
- Explore [Examples](./examples.md) for common patterns
- Learn about [Themes](./themes.md) for styling options
