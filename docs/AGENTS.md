---
title: LLM Documentation
description: Agent-friendly documentation for AI coding assistants
order: 6
---

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

| Component | Path |
|-----------|------|
| Editor | src/components/editor/ |
| Player | src/player/ |
| Landing Page | src/components/LandingPage.tsx |
| Documentation | src/components/docs/ |
| Utilities | src/utils/ |
| Types | src/types/ |

## Quick Navigation

- Entry point: `src/main.jsx`
- Main editor: `src/components/editor/DiagramEditor.jsx`
- State management: `src/components/editor/EditorProvider.jsx`
- Canvas rendering: `src/components/editor/DiagramCanvas.jsx`

## Overview

Arc is a React component library for rendering beautiful, interactive architecture diagrams. It provides a declarative JSON format for defining diagrams and multiple built-in themes.

## Why Arc?

Architecture diagrams typically live in design tools, disconnected from the code they describe. Arc keeps diagrams as declarative configs that:

- **Version with your code** - Diffs show exactly what changed
- **Render anywhere** - Use the lightweight player or export to SVG/PNG
- **Stay consistent** - Templates enforce color palettes and sizing rules

## Packages

| Package | Description |
|---------|-------------|
| `@arach/arc` | Core player/renderer component |
| `@arach/arc-player` | Lightweight embeddable player |

## Key Features

- **Declarative Format** - Diagrams are data structures
- **Templates** - Structural presets for layout
- **Themes** - Color palettes (default, warm, cool, mono)
- **Export** - SVG, PNG, JSON, TypeScript

## Links

- [GitHub Repository](https://github.com/arach/arc)
- [NPM: @arach/arc](https://www.npmjs.com/package/@arach/arc)

## Quickstart

### Installation

```bash
npm install @arach/arc
npx @arach/arc-editor
```

### Quick Start

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

### Vanilla JavaScript

```html
<script type="module">
  import { renderDiagram } from '@arach/arc-player'
  renderDiagram(document.getElementById('diagram'), diagramConfig)
</script>
```

## Development

```bash
pnpm dev      # Start dev server
pnpm build    # Production build
pnpm lint     # Run ESLint
```

## Architecture

### Major Modules

| Module | Path | Purpose |
|--------|------|---------|
| Editor | `src/components/editor/` | Visual drag-and-drop editor |
| Player | `src/player/` | Lightweight renderer |
| Utils | `src/utils/` | Shared helpers |

### State Model

```typescript
{
  diagram: { layout, nodes, nodeData, connectors, connectorStyles },
  editor: { selectedNodeId, selectedConnectorIndex, mode, pendingConnector, isDragging },
  meta: { filename, isDirty, lastSaved },
  history: { past, future }
}
```

### Data Flow

1. User Action → Dispatch action to reducer
2. Reducer → Updates state immutably, pushes to history
3. Context → Propagates new state to components
4. Canvas → Re-renders affected nodes/connectors

### Diagram Config

```json
{
  "layout": { "width": 700, "height": 340 },
  "nodes": { "nodeId": { "x": 25, "y": 15, "size": "large" } },
  "nodeData": { "nodeId": { "icon": "Monitor", "name": "...", "color": "violet" } },
  "connectors": [{ "from": "a", "to": "b", "fromAnchor": "right", "toAnchor": "left", "style": "http" }],
  "connectorStyles": { "http": { "color": "amber", "strokeWidth": 2, "label": "HTTP" } }
}
```

## API Reference

### ArcDiagram Component

```tsx
interface ArcDiagramProps {
  data: ArcDiagramData     // Diagram configuration
  mode?: 'light' | 'dark'  // Color mode (default: 'light')
  theme?: ThemeId          // Theme preset (default: 'default')
  interactive?: boolean    // Enable zoom/pan (default: true)
  className?: string       // Additional CSS classes
}
```

### ArcDiagramData Schema

```typescript
interface ArcDiagramData {
  id?: string
  layout: { width: number; height: number }
  nodes: Record<string, NodePosition>
  nodeData: Record<string, NodeData>
  connectors: Connector[]
  connectorStyles: Record<string, ConnectorStyle>
}
```

### Node Types

```typescript
interface NodePosition {
  x: number
  y: number
  size: 's' | 'm' | 'l'
}

interface NodeData {
  icon: string
  name: string
  subtitle?: string
  description?: string
  color: DiagramColor
}

type DiagramColor = 'violet' | 'emerald' | 'blue' | 'amber' | 'sky' | 'zinc' | 'rose' | 'orange'
```

### Connector Types

```typescript
interface Connector {
  from: string
  to: string
  fromAnchor: AnchorPosition
  toAnchor: AnchorPosition
  style: string
  curve?: 'natural' | 'step'
}

type AnchorPosition = 'left' | 'right' | 'top' | 'bottom' |
                      'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'

interface ConnectorStyle {
  color: DiagramColor
  strokeWidth: number
  label?: string
  labelAlign?: 'left' | 'right' | 'center'
  dashed?: boolean
}
```

## Themes

| Theme ID | Name | Description |
|----------|------|-------------|
| default | Default | Balanced, vibrant colors |
| warm | Warm | Editorial, earth tones |
| cool | Cool | Technical, blue-focused |
| mono | Mono | Grayscale for print |

### Theme API

```typescript
import { getTheme, getThemeList, THEMES } from '@arach/arc'

const theme = getTheme('warm')
const themes = getThemeList()
const palette = theme.light.palette.violet
```

## Available Icons

Arc uses Lucide React icons:

- **Infrastructure**: Server, Database, Cloud, CloudCog, HardDrive, Network, Cpu
- **Interfaces**: Monitor, Smartphone, Laptop, Globe, Terminal
- **Services**: MessageSquare, Mail, Bell, Shield, Lock, Key
- **Data**: FileText, Folder, Package, Archive, Layers
- **Connectivity**: Wifi, Radio, Plug, Cable, Router
- **Actions**: RefreshCw, Download, Upload, Send, Zap

## Export Formats

- **JSON**: Full diagram configuration
- **TypeScript**: Type-safe diagram constant
- **SVG**: Vector graphic (light or dark)
- **PNG**: Raster image
