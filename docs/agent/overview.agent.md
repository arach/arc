# Arc - Agent Context

> Visual diagram editor outputting declarative JSON/TypeScript configs

## TL;DR
- Diagrams are data (JSON/TS), not images
- Three packages: `@arach/arc` (editor), `@arach/arc-viewer` (viewer), `@arach/arc-iso` (isometric)
- React 19 + Vite + TailwindCSS
- State: useReducer + Context in EditorProvider

## Packages

| Package | Purpose | Install |
|---------|---------|---------|
| `@arach/arc` | Full editor + renderer | `npm install @arach/arc` |
| `@arach/arc-viewer` | Lightweight viewer | `npm install @arach/arc-viewer` |
| `@arach/arc-iso` | Isometric renderer | `npm install @arach/arc-iso` |

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
| **Themes** | 8 color palettes (default, warm, cool, mono, engineering, workbench, tactical, command) |

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
| Editor entry | `src/components/editor/DiagramEditor.tsx` |
| State management | `src/components/editor/EditorProvider.tsx` |
| Canvas rendering | `src/components/editor/DiagramCanvas.tsx` |
| Icon registry | `src/utils/iconRegistry.ts` |
| Colors/constants | `src/utils/constants.ts` |
