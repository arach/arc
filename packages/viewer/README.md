# @arach/arc-viewer

Native React renderers for diagrams as code, including typed architecture
diagrams and interactive Mermaid sequences.

## Installation

```bash
npm install @arach/arc-viewer
```

## Usage

```tsx
import { ArcDiagram } from '@arach/arc-viewer'
import type { ArcDiagramData } from '@arach/arc-viewer'

const diagram: ArcDiagramData = {
  id: 'MY.DIAGRAM.001',
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
  return (
    <ArcDiagram
      data={diagram}
      mode="light"
      theme="default"
      interactive={true}
    />
  )
}
```

## Mermaid Sequences

Arc parses canonical Mermaid source into a typed document and renders it with a
native player. The source remains reviewable while Arc owns the theme,
interaction, and playback controls.

```tsx
import { ArcMermaidPlayer } from '@arach/arc-viewer'

const source = `sequenceDiagram
  participant App
  participant API
  App->>API: Load architecture
  API-->>App: Typed diagram`

export function Sequence() {
  return <ArcMermaidPlayer source={source} mode="light" />
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `ArcDiagramData` | required | The diagram configuration |
| `mode` | `'light' \| 'dark'` | `'dark'` | Light or dark appearance |
| `theme` | `ThemeId` | `'default'` | Color palette (`default`, `warm`, `cool`, `mono`) |
| `interactive` | `boolean` | `true` | Enable zoom/pan controls |
| `className` | `string` | `''` | Additional CSS classes |

## Themes

- **default** - Clean, neutral colors
- **warm** - Soft, editorial warmth
- **cool** - Crisp, modern blues
- **mono** - Elegant grayscale

## Requirements

- React 18+
- Tailwind CSS (for styling classes)

## Editor

To visually design diagrams, use [@arach/arc-editor](https://www.npmjs.com/package/@arach/arc-editor).

## License

MIT
