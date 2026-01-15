# API Reference - Agent Context

## ArcDiagram Component

```tsx
interface ArcDiagramProps {
  data: ArcDiagramData
  mode?: 'light' | 'dark'
  theme?: 'default' | 'warm' | 'cool' | 'mono'
  interactive?: boolean
  className?: string
}
```

## ArcDiagramData Schema

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

## Node Types

```typescript
interface NodePosition {
  x: number
  y: number
  size: 's' | 'm' | 'l'
}

interface NodeData {
  icon: string           // Lucide icon name
  name: string
  subtitle?: string
  description?: string
  color: DiagramColor
}

type DiagramColor = 'violet' | 'emerald' | 'blue' | 'amber' | 'sky' | 'zinc' | 'rose' | 'orange'
```

## Connector Types

```typescript
interface Connector {
  from: string
  to: string
  fromAnchor: AnchorPosition
  toAnchor: AnchorPosition
  style: string
  curve?: 'natural' | 'step'
}

type AnchorPosition = 'left' | 'right' | 'top' | 'bottom' | 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'

interface ConnectorStyle {
  color: DiagramColor
  strokeWidth: number
  label?: string
  labelAlign?: 'left' | 'right' | 'center'
  dashed?: boolean
}
```

## Theme API

```typescript
import { getTheme, getThemeList, THEMES } from '@arach/arc'

const theme = getTheme('warm')
const themes = getThemeList()
const palette = theme.light.palette.violet
// { border, bg, icon, stroke }
```

## Available Icons (Lucide)

**Infrastructure**: Server, Database, Cloud, CloudCog, HardDrive, Network, Cpu
**Interfaces**: Monitor, Smartphone, Laptop, Globe, Terminal
**Services**: MessageSquare, Mail, Bell, Shield, Lock, Key
**Data**: FileText, Folder, Package, Archive, Layers
**Connectivity**: Wifi, Radio, Plug, Cable, Router
**Actions**: RefreshCw, Download, Upload, Send, Zap

## Valid Values Quick Reference

| Property | Valid Values |
|----------|-------------|
| `size` | `'s'`, `'m'`, `'l'` |
| `color` | `'violet'`, `'emerald'`, `'blue'`, `'amber'`, `'sky'`, `'zinc'`, `'rose'`, `'orange'` |
| `theme` | `'default'`, `'warm'`, `'cool'`, `'mono'` |
| `mode` | `'light'`, `'dark'` |
| `anchor` | `'left'`, `'right'`, `'top'`, `'bottom'`, `'topLeft'`, `'topRight'`, `'bottomLeft'`, `'bottomRight'` |
| `curve` | `'natural'`, `'step'` |
