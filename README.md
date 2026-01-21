# Arc

A visual diagram editor for creating architecture diagrams. Design system architectures with a drag-and-drop interface, then export to clean TypeScript for use in documentation sites.

## Features

- **Visual Editor** - Drag-and-drop nodes, connect with arrows
- **Multiple Node Sizes** - Large, medium, small
- **Color Themes** - Violet, emerald, blue, amber, sky, zinc, rose, orange
- **Connector Styles** - Solid/dashed lines, labels, curved paths
- **Export Options** - TypeScript, JSON, SVG, PNG, shareable links
- **Interactive Canvas** - Infinite pan/zoom, grid snapping
- **Groups & Images** - Visual grouping, background images
- **Templates** - Quick-start layouts

## Getting Started

```bash
pnpm install
pnpm dev
```

## Export Format

Arc exports diagrams as clean TypeScript compatible with the `ArcDiagram` player component:

```typescript
import type { ArcDiagramData } from './ArcDiagram'

const diagram: ArcDiagramData = {
  layout: { width: 800, height: 400 },
  nodes: {
    app: { x: 50, y: 50, size: 'l' },
    api: { x: 300, y: 50, size: 'm' },
  },
  nodeData: {
    app: { icon: 'Monitor', name: 'App', color: 'violet' },
    api: { icon: 'Server', name: 'API', color: 'emerald' },
  },
  connectors: [
    { from: 'app', to: 'api', fromAnchor: 'right', toAnchor: 'left', style: 'http' }
  ],
  connectorStyles: {
    http: { color: 'amber', strokeWidth: 2, label: 'HTTP' }
  },
}

export default diagram
```

## Requirements

The `ArcDiagram` player component requires:

- **Tailwind CSS v3+** - Component uses Tailwind utility classes for styling
- **Default color palette** - The following colors must be available: `violet`, `emerald`, `blue`, `amber`, `sky`, `zinc`, `rose`, `orange`

If you're using a custom Tailwind config that restricts the color palette, ensure these colors are included.

## Tech Stack

- React 19
- Vite 7
- TailwindCSS 4
- Lucide React (icons)

## License

MIT
