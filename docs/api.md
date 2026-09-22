---
title: API Reference
description: Complete API reference for Arc components and types
order: 3
---

# API Reference

## ArcDiagram Component

```tsx
interface ArcDiagramProps {
  data: ArcDiagramData              // Diagram configuration (required)
  className?: string                // Additional CSS classes
  interactive?: boolean             // Enable zoom/pan (default: true)
  mode?: 'light' | 'dark'           // Color mode (default: 'dark')
  theme?: ThemeId                   // Theme preset (default: 'default')
  label?: string                    // Diagram label (default: data.id)
  labelPosition?: LabelCorner       // Label corner (default: 'top-left')
  defaultZoom?: number | 'fit'      // Initial zoom (default: 1; 'fit' auto-fits content)
  maxFitZoom?: number               // Max zoom when defaultZoom is 'fit' (default: 1)
  zoomLevels?: number[]             // Zoom steps (default: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2])
  showArcToggle?: boolean           // Show .arc source toggle (default: true)
  showAutoLayout?: boolean          // Show auto-layout button (default: false)
  showControls?: boolean            // Zoom controls (default: follows `interactive`)
  showMinimap?: boolean             // Minimap overview (default: false)
  showFocusStory?: boolean          // Show active focus target caption and steps (default: false)
  frame?: BrandSpec['frame']        // Override the theme's frame treatment:
                                    // hairline, inset, brackets, ticks, cropmarks,
                                    // corners, sheet, reticle, none
  hoverEffects?: boolean | HoverEffectsConfig  // Hover behavior (default: true)
  onNodeHover?: (nodeId: string | null) => void  // Node hover/click callback
  titleBlock?: TitleBlockInfo       // Override engineering title-block fields
}
```

The `theme` prop falls back to `'default'` when omitted. The Arc editor is a separate default: new editor sessions start in `'command'`.

## ArcDiagramData Schema

```typescript
interface ArcDiagramData {
  id?: string                                    // Optional diagram identifier
  layout: { width: number; height: number }     // Canvas dimensions
  layoutHints?: LayoutHints                     // Optional group/auto-layout hints
  nodes: Record<string, NodePosition>           // Node positions by ID
  nodeData: Record<string, NodeData>            // Node display data by ID
  connectors: Connector[]                       // Connection definitions
  connectorStyles: Record<string, ConnectorStyle> // Style definitions
  focusTargets?: Record<string, FocusTarget>    // Optional focus story targets
  groups?: GroupShape[]                         // Optional group shapes
}
```

## Node Types

```typescript
interface NodePosition {
  x: number           // X coordinate
  y: number           // Y coordinate
  size: 'xs' | 's' | 'm' | 'l'  // Node size (extra small, small, medium, large)
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

Arc includes 8 built-in themes, each with light and dark modes:

| Theme ID | Name | Description |
|----------|------|-------------|
| default | Default | Balanced, vibrant colors |
| warm | Warm | Editorial, earth tones |
| cool | Cool | Technical, blue-focused |
| mono | Mono | Grayscale for print |
| engineering | Engineering | Systematic enterprise blue on a graph grid |
| workbench | Workbench | Dark slate with intent colors |
| tactical | Tactical | Near-black with signature amber |
| command | Command | HUD console, cyan glass, crosshair grid (Arc editor default) |

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
