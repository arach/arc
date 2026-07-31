// Arc Diagram Types
// Shared format for Arc editor and consumers (Talkie docs, etc.)

export type NodeSize = 'xs' | 's' | 'm' | 'l'

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

export interface FocusConnectorRef {
  from: string
  to: string
}

export interface FocusStep {
  icon: string
  label: string
}

/** A declarative highlight story activated by hovering or selecting a node. */
export interface FocusTarget {
  /** `append` includes direct neighbors; `replace` uses only the explicit story. */
  mode?: 'append' | 'replace'
  nodes?: string[]
  connectors?: FocusConnectorRef[]
  caption?: string
  steps?: FocusStep[]
}

export type LayoutAlignment = 'start' | 'center' | 'end'
export type GroupLayoutDirection = 'horizontal' | 'vertical'

/** Optional placement hints used by autoLayout when nodes belong to groups. */
export interface NodeLayoutHint {
  /** ID of the group frame that owns this node. */
  group?: string
  /** Explicit layer within the group. Connected nodes are layered automatically otherwise. */
  layer?: number
  /** Stable ordering within a layer. Lower values render first. */
  order?: number
}

/** Layout policy for the nodes inside one group frame. */
export interface GroupLayoutHint {
  /** `horizontal` lays layers left-to-right; `vertical` lays them top-to-bottom. */
  direction?: GroupLayoutDirection
  padding?: number
  layerGap?: number
  itemGap?: number
  align?: LayoutAlignment
  justify?: LayoutAlignment | 'space-between'
}

export interface LayoutHints {
  nodes?: Record<string, NodeLayoutHint>
  groups?: Record<string, GroupLayoutHint>
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
  layoutHints?: LayoutHints
  nodes: Record<string, NodePosition>
  nodeData: Record<string, NodeData>
  connectors: Connector[]
  connectorStyles: Record<string, ConnectorStyle>
  groups?: GroupShape[]
  focusTargets?: Record<string, FocusTarget>
  images?: DiagramImage[]
  exportZone?: ExportZone | null
}

// Clean export format (for consumers)
export interface ArcDiagramData {
  id?: string
  layout: DiagramLayout
  layoutHints?: LayoutHints
  nodes: Record<string, NodePosition>
  nodeData: Record<string, NodeData>
  connectors: Connector[]
  connectorStyles: Record<string, ConnectorStyle>
  focusTargets?: Record<string, FocusTarget>
  groups?: GroupShape[]
}

// Convert full diagram to clean export format
export function toExportFormat(diagram: ArcDiagram): ArcDiagramData {
  return {
    layout: diagram.layout,
    layoutHints: diagram.layoutHints,
    nodes: diagram.nodes,
    nodeData: diagram.nodeData,
    connectors: diagram.connectors,
    connectorStyles: diagram.connectorStyles,
    focusTargets: diagram.focusTargets,
    groups: diagram.groups,
  }
}

// Generate TypeScript source file content
export function toTypeScriptSource(diagram: ArcDiagram, name: string = 'diagram'): string {
  const data = toExportFormat(diagram)
  const json = JSON.stringify(data, null, 2)
    .replace(/"([^"]+)":/g, '$1:') // Remove quotes from keys
    .replace(/"/g, "'") // Use single quotes

  return `import type { ArcDiagramData } from '@arach/arc'

const ${name}: ArcDiagramData = ${json}

export default ${name}
`
}
