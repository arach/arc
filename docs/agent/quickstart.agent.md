# Quickstart - Agent Context

## Install

```bash
npm install @arach/arc        # Core package
npx @arach/arc-editor         # Visual editor
```

## Minimal Example

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

## Vanilla JS

```html
<script type="module">
  import { renderDiagram } from '@arach/arc-player'
  renderDiagram(document.getElementById('diagram'), diagramConfig)
</script>
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `ArcDiagramData` | required | Diagram config |
| `mode` | `'light' \| 'dark'` | `'light'` | Color mode |
| `theme` | `ThemeId` | `'default'` | Color theme |
| `interactive` | `boolean` | `true` | Enable zoom/pan |

## Theme Options

```tsx
<ArcDiagram data={d} mode="light" theme="warm" />   // Editorial
<ArcDiagram data={d} mode="dark" theme="cool" />    // Technical
<ArcDiagram data={d} mode="light" theme="mono" />   // Print
```
