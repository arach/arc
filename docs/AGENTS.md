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

> Arc is a React component library for rendering beautiful, interactive architecture diagrams

# Arc - Visual Architecture Diagram Library

Arc is a React component library for rendering beautiful, interactive architecture diagrams. It provides a declarative JSON format for defining diagrams and multiple built-in themes.

## Why Arc?

Architecture diagrams typically live in design tools, disconnected from the code they describe. Arc keeps diagrams as declarative configs that:

- **Version with your code** - Diffs show exactly what changed
- **Render anywhere** - Use the lightweight player or export to SVG/PNG
- **Stay consistent** - Templates enforce color palettes and sizing rules

## Packages

| Package | Size | Use Case |
|---------|------|----------|
| `@arach/arc` | ~75KB | Full editor + player components |
| `@arach/arc-player` | ~7KB | Lightweight renderer only |

## Key Features

- **Visual Editor** - Drag-and-drop nodes, connectors, groups, and images
- **Declarative Exports** - JSON/TypeScript configs designed for version control
- **Templates** - Built-in themes and sizing presets
- **Isometric View** - Toggle 3D projection for visual impact
- **Multiple Export Formats** - JSON, TypeScript, SVG, PNG, clipboard embed

## Links

- GitHub: https://github.com/arach/arc
- npm (player): https://www.npmjs.com/package/@arach/arc

## Quickstart

> Get started with Arc in 5 minutes

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

## API Reference

> Complete API reference for Arc components and types

# API Reference

## ArcDiagram Component

```tsx
interface ArcDiagramProps {
  data: ArcDiagramData     // Diagram configuration
  mode?: 'light' | 'dark'  // Color mode (default: 'light')
  theme?: ThemeId          // Theme preset (default: 'default')
  interactive?: boolean    // Enable zoom/pan (default: true)
  className?: string       // Additional CSS classes
}
```

## ArcDiagramData Schema

```typescript
interface ArcDiagramData {
  id?: string                                    // Optional diagram identifier
  layout: { width: number; height: number }     // Canvas dimensions
  nodes: Record<string, NodePosition>           // Node positions by ID
  nodeData: Record<string, NodeData>            // Node display data by ID
  connectors: Connector[]                       // Connection definitions
  connectorStyles: Record<string, ConnectorStyle> // Style definitions
}
```

## Node Types

```typescript
interface NodePosition {
  x: number           // X coordinate
  y: number           // Y coordinate
  size: 's' | 'm' | 'l'  // Node size (small, medium, large)
}

interface NodeData {
  icon: string        // Lucide icon name (e.g., 'Monitor', 'Server', 'Database')
  name: string        // Display name
  subtitle?: string   // Optional subtitle
  description?: string // Optional description
  color: DiagramColor // Color theme for this node
}

type DiagramColor = 'violet' | 'emerald' | 'blue' | 'amber' | 'sky' | 'zinc' | 'rose' | 'orange'
```

## Connector Types

```typescript
interface Connector {
  from: string          // Source node ID
  to: string            // Target node ID
  fromAnchor: AnchorPosition  // Where to attach on source
  toAnchor: AnchorPosition    // Where to attach on target
  style: string         // Reference to connectorStyles key
  curve?: 'natural' | 'step'  // Line curve style (default: 'natural')
}

type AnchorPosition = 'left' | 'right' | 'top' | 'bottom' |
                      'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'

interface ConnectorStyle {
  color: DiagramColor   // Line color
  strokeWidth: number   // Line thickness (1-4 recommended)
  label?: string        // Optional label text
  labelAlign?: 'left' | 'right' | 'center'  // Label position
  dashed?: boolean      // Dashed line style
}
```

## Themes

Arc includes 4 built-in themes:

| Theme ID | Name | Description |
|----------|------|-------------|
| default | Default | Balanced, vibrant colors |
| warm | Warm | Editorial, earth tones |
| cool | Cool | Technical, blue-focused |
| mono | Mono | Grayscale for print |

### Theme API

```typescript
import { getTheme, getThemeList, THEMES } from '@arach/arc'

// Get a specific theme
const theme = getTheme('warm')

// List all available themes
const themes = getThemeList()
// Returns: [{ id: 'default', name: 'Default', description: '...' }, ...]

// Access theme colors
const palette = theme.light.palette.violet
// { border: '#...', bg: '#...', icon: '#...', stroke: '#...' }
```

## Available Icons

Arc uses Lucide React icons. Common architecture icons:

**Infrastructure**: Server, Database, Cloud, CloudCog, HardDrive, Network, Cpu
**Interfaces**: Monitor, Smartphone, Laptop, Globe, Terminal
**Services**: MessageSquare, Mail, Bell, Shield, Lock, Key
**Data**: FileText, Folder, Package, Archive, Layers
**Connectivity**: Wifi, Radio, Plug, Cable, Router
**Actions**: RefreshCw, Download, Upload, Send, Zap

## Export Formats

The Arc Editor can export diagrams as:
- **JSON**: Full diagram configuration
- **TypeScript**: Type-safe diagram constant
- **SVG**: Vector graphic (light or dark)
- **PNG**: Raster image

## Examples

> Real-world diagram examples

# Examples

## Complex Microservices Architecture

```tsx
const microservicesArchitecture: ArcDiagramData = {
  layout: { width: 900, height: 500 },
  nodes: {
    client: { x: 50, y: 200, size: 'l' },
    gateway: { x: 200, y: 200, size: 'm' },
    auth: { x: 400, y: 50, size: 'm' },
    users: { x: 400, y: 200, size: 'm' },
    orders: { x: 400, y: 350, size: 'm' },
    cache: { x: 600, y: 50, size: 's' },
    userDb: { x: 600, y: 200, size: 's' },
    orderDb: { x: 600, y: 350, size: 's' },
    queue: { x: 750, y: 275, size: 'm' },
  },
  nodeData: {
    client: { icon: 'Smartphone', name: 'Mobile App', color: 'violet' },
    gateway: { icon: 'Network', name: 'API Gateway', color: 'emerald' },
    auth: { icon: 'Shield', name: 'Auth Service', color: 'amber' },
    users: { icon: 'Users', name: 'User Service', color: 'blue' },
    orders: { icon: 'ShoppingCart', name: 'Order Service', color: 'rose' },
    cache: { icon: 'Zap', name: 'Redis', subtitle: 'Cache', color: 'orange' },
    userDb: { icon: 'Database', name: 'PostgreSQL', subtitle: 'Users', color: 'blue' },
    orderDb: { icon: 'Database', name: 'PostgreSQL', subtitle: 'Orders', color: 'rose' },
    queue: { icon: 'MessageSquare', name: 'RabbitMQ', color: 'sky' },
  },
  connectors: [
    { from: 'client', to: 'gateway', fromAnchor: 'right', toAnchor: 'left', style: 'http' },
    { from: 'gateway', to: 'auth', fromAnchor: 'topRight', toAnchor: 'left', style: 'grpc' },
    { from: 'gateway', to: 'users', fromAnchor: 'right', toAnchor: 'left', style: 'grpc' },
    { from: 'gateway', to: 'orders', fromAnchor: 'bottomRight', toAnchor: 'left', style: 'grpc' },
    { from: 'auth', to: 'cache', fromAnchor: 'right', toAnchor: 'left', style: 'redis' },
    { from: 'users', to: 'userDb', fromAnchor: 'right', toAnchor: 'left', style: 'sql' },
    { from: 'orders', to: 'orderDb', fromAnchor: 'right', toAnchor: 'left', style: 'sql' },
    { from: 'orders', to: 'queue', fromAnchor: 'right', toAnchor: 'left', style: 'amqp' },
    { from: 'users', to: 'queue', fromAnchor: 'bottomRight', toAnchor: 'topLeft', style: 'amqp' },
  ],
  connectorStyles: {
    http: { color: 'violet', strokeWidth: 3, label: 'HTTPS' },
    grpc: { color: 'emerald', strokeWidth: 2, label: 'gRPC' },
    redis: { color: 'orange', strokeWidth: 2, dashed: true },
    sql: { color: 'blue', strokeWidth: 2, label: 'SQL' },
    amqp: { color: 'sky', strokeWidth: 2, label: 'AMQP', dashed: true },
  },
}
```

## Simple Three-Tier

```tsx
const threeTier: ArcDiagramData = {
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
```

---
Generated by [Dewey](https://github.com/arach/dewey) | Last updated: 2026-01-15