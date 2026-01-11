// Arc Diagram Types
// Shared format for Arc editor and consumers (Talkie docs, etc.)

export type NodeSize = 's' | 'm' | 'l'

export type AnchorPosition =
  | 'left' | 'right' | 'top' | 'bottom'
  | 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'

export type DiagramColor =
  | 'violet' | 'emerald' | 'blue' | 'amber'
  | 'sky' | 'zinc' | 'rose' | 'orange'

export interface NodePosition {
  x: number
  y: number
  size: NodeSize
}

export interface NodeData {
  icon: string
  name: string
  subtitle?: string
  description?: string
  color: DiagramColor
}

export interface Connector {
  from: string
  to: string
  fromAnchor: AnchorPosition
  toAnchor: AnchorPosition
  style: string
  curve?: 'natural' | 'step'
}

export interface ConnectorStyle {
  color: DiagramColor
  strokeWidth: number
  label?: string
  dashed?: boolean
}

export interface DiagramLayout {
  width: number
  height: number
}

export interface GridConfig {
  enabled: boolean
  size: number
  color: string
  opacity: number
  type: 'dots' | 'lines'
}

export interface GroupShape {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: 'rect' | 'circle'
  color: DiagramColor
  label?: string
  dashed?: boolean
}

export interface DiagramImage {
  id: string
  src: string
  name: string
  x: number
  y: number
  width: number
  height: number
  opacity: number
}

export interface ExportZone {
  x: number
  y: number
  width: number
  height: number
}

// Full diagram format (internal Arc state)
export interface ArcDiagram {
  layout: DiagramLayout
  grid: GridConfig
  nodes: Record<string, NodePosition>
  nodeData: Record<string, NodeData>
  connectors: Connector[]
  connectorStyles: Record<string, ConnectorStyle>
  groups?: GroupShape[]
  images?: DiagramImage[]
  exportZone?: ExportZone | null
}

// Clean export format (for consumers)
export interface ArcDiagramData {
  layout: DiagramLayout
  nodes: Record<string, NodePosition>
  nodeData: Record<string, NodeData>
  connectors: Connector[]
  connectorStyles: Record<string, ConnectorStyle>
}

// Convert full diagram to clean export format
export function toExportFormat(diagram: ArcDiagram): ArcDiagramData {
  return {
    layout: diagram.layout,
    nodes: diagram.nodes,
    nodeData: diagram.nodeData,
    connectors: diagram.connectors,
    connectorStyles: diagram.connectorStyles,
  }
}

// Generate TypeScript source file content
export function toTypeScriptSource(diagram: ArcDiagram, name: string = 'diagram'): string {
  const data = toExportFormat(diagram)
  const json = JSON.stringify(data, null, 2)
    .replace(/"([^"]+)":/g, '$1:') // Remove quotes from keys
    .replace(/"/g, "'") // Use single quotes

  return `import type { ArcDiagramData } from '../ArcDiagram'

const ${name}: ArcDiagramData = ${json}

export default ${name}
`
}
