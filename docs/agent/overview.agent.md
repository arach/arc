# Arc - Agent Context

> Visual diagram editor outputting declarative JSON/TypeScript configs

## TL;DR
- Diagrams are data (JSON/TS), not images
- Two packages: `@arach/arc` (editor), `@arach/arc-player` (renderer)
- React 19 + Vite + TailwindCSS
- State: useReducer + Context in EditorProvider

## Packages

| Package | Purpose | Install |
|---------|---------|---------|
| `@arach/arc` | Full editor + renderer | `npm install @arach/arc` |
| `@arach/arc-player` | Lightweight embed | `npm install @arach/arc-player` |

## Why Declarative?
- Version control: diffs show changes
- Portable: render anywhere (React, vanilla JS, export to SVG/PNG)
- Consistent: templates enforce rules

## Key Concepts

| Concept | What It Is |
|---------|-----------|
| **Nodes** | Boxes with icon, name, color, position |
| **Connectors** | Lines between nodes with labels |
| **Templates** | Structural presets (shapes, layouts) |
| **Themes** | Color palettes (default, warm, cool, mono) |

## Quick Start

```tsx
import { ArcDiagram } from '@arach/arc'

<ArcDiagram
  data={diagramConfig}
  mode="light"
  theme="default"
/>
```

## File Locations

| What | Where |
|------|-------|
| Editor entry | `src/components/editor/DiagramEditor.jsx` |
| State management | `src/components/editor/EditorProvider.jsx` |
| Canvas rendering | `src/components/editor/DiagramCanvas.jsx` |
| Icon registry | `src/utils/iconRegistry.js` |
| Colors/constants | `src/utils/constants.js` |
