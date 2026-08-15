---
title: API Reference
description: Complete API reference for Arc components and types
order: 3
---

# API Reference

## ArcDiagram Component

```tsx
interface ArcDiagramProps {
  data: ArcDiagramData     // Diagram configuration
  mode?: 'light' | 'dark'  // Color mode (default: 'dark')
  theme?: ThemeId          // Theme preset (default: 'default')
  interactive?: boolean    // Enable zoom/pan (default: true)
  className?: string       // Additional CSS classes

  // Zoom
  defaultZoom?: number | 'fit'  // Initial zoom, or 'fit' to size to the container
  maxFitZoom?: number           // Cap applied when defaultZoom='fit' (default: 1)
  zoomLevels?: number[]         // Zoom steps for the +/- controls

  // Chrome
  showControls?: boolean   // Zoom controls (default: follows `interactive`)
  showLegend?: boolean     // Key for connector styles + labelled groups (default: false)
  showMinimap?: boolean    // Minimap overview, bottom-left (default: false)
  showArcToggle?: boolean  // .arc source toggle (default: true)
  showFocusStory?: boolean // Caption + steps for the active focusTarget (default: false)
  showAutoLayout?: boolean // Auto-layout button (default: false)
  label?: string           // Overrides data.id; pass '' to hide
  labelPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  frame?: BrandSpec['frame']    // Override the theme's edge treatment
  titleBlock?: TitleBlockInfo   // Override title-block fields (themes that opt in)

  // Interaction
  hoverEffects?: boolean | HoverEffectsConfig  // true = all effects (default)
  onNodeHover?: (nodeId: string | null) => void
}
```

Every one of these is live at [`/showcase`](/showcase), which emits the matching
JSX for whatever combination you dial in.

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

// Access theme colors
const palette = theme.light.palette.violet
// { border: '#...', bg: '#...', icon: '#...', stroke: '#...' }
```

## Available Icons

Arc uses Lucide React icons. Common architecture icons:

- **Infrastructure**: Server, Database, Cloud, CloudCog, HardDrive, Network, Cpu
- **Interfaces**: Monitor, Smartphone, Laptop, Globe, Terminal
- **Services**: MessageSquare, Mail, Bell, Shield, Lock, Key
- **Data**: FileText, Folder, Package, Archive, Layers
- **Connectivity**: Wifi, Radio, Plug, Cable, Router
- **Actions**: RefreshCw, Download, Upload, Send, Zap

## Export Formats

The Arc Editor can export diagrams as:
- **JSON**: Full diagram configuration
- **TypeScript**: Type-safe diagram constant
- **SVG**: Vector graphic (light or dark)
- **PNG**: Raster image
