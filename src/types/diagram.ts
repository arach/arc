// Arc Diagram Types
// Shared format for Arc editor and consumers (Talkie docs, etc.)

import type { NodeShape } from '../utils/nodeShape'

export type { NodeShape }

export type NodeSize = 'xs' | 's' | 'm' | 'l'

export type AnchorPosition =
  | 'left' | 'right' | 'top' | 'bottom'
  | 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'

export type DiagramColor =
  | 'violet' | 'emerald' | 'blue' | 'amber'
  | 'sky' | 'zinc' | 'rose' | 'orange'

/**
 * Semantic role for a node. When set, `icon` and `color` may be omitted —
 * NODE_KIND_DEFAULTS supplies them — and every renderer resolves the kind
 * through the theme palette the same way an authored `color` resolves.
 */
export type NodeKind =
  | 'frontend' | 'backend' | 'service'
  | 'database' | 'cache' | 'queue' | 'storage'
  | 'gateway' | 'security' | 'user'
  | 'external' | 'observability'

export interface NodePosition {
  x: number
  y: number
  size: NodeSize
  /** Custom rendered dimensions; when present they override the size preset. */
  width?: number
  height?: number
  /** Isometric elevation above the floor plane. */
  z?: number
  /** Isometric box height. */
  isoHeight?: number
  /** Isometric box depth (Y in iso space). */
  isoDepth?: number
  /** Painter's-algorithm bias when two iso boxes occupy the same volume. */
  isoOrder?: number
  /** Top-face label axis. Omit / `auto` = along the longer edge. */
  isoLabelDir?: 'auto' | 'x' | 'y'
  /** Rotate the printed iso label 180° on the face. */
  isoLabelFlip?: boolean
  /** Typeface for the printed iso label. Omit / `theme` follows the diagram brand. */
  isoLabelFont?: 'theme' | 'ui' | 'mono'
}

export interface NodeData {
  /** Lucide icon name. Omit when `kind` supplies the default icon. */
  icon?: string
  name: string
  subtitle?: string
  description?: string
  /** Palette color. Omit when `kind` supplies the default color. */
  color?: DiagramColor
  /** Semantic role — supplies default `icon` and `color`; explicit fields still win. */
  kind?: NodeKind
  /** Per-node silhouette. Omit to follow the theme's own node shape. */
  shape?: NodeShape
}

export type ConnectorCurve = 'natural' | 'down' | 'up' | 'step'

export interface Connector {
  /**
   * Stable identity for diffs, deep links, and diagnostics. Without it a
   * connector is only addressable by `from`/`to` pair or array index, which
   * breaks under reordering and parallel edges.
   */
  id?: string
  from: string
  to: string
  fromAnchor: AnchorPosition
  toAnchor: AnchorPosition
  style: string
  curve?: ConnectorCurve
  /** Bezier control-point scale for curved connectors (percent of distance). */
  curveDepth?: number
}

/**
 * Stable identity for a connector: its authored `id`, else the `from→to`
 * pair. Parallel edges between the same endpoints collide without `id`.
 */
export function connectorKey(connector: Pick<Connector, 'from' | 'to' | 'id'>): string {
  return connector.id ?? `${connector.from}->${connector.to}`
}

export type LabelAlign = 'left' | 'right' | 'center'

export interface ConnectorStyle {
  color: DiagramColor
  strokeWidth: number
  label?: string
  /** For vertical connectors, `right`/`left` places the label beside the line. */
  labelAlign?: LabelAlign
  dashed?: boolean
  bidirectional?: boolean
  animated?: boolean
  showArrow?: boolean
  showEndpoints?: boolean
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
  /** Pins a specific connector by `Connector.id` — survives reordering and parallel edges. */
  id?: string
  /** Endpoint-pair matching, used when `id` is absent. Ambiguous on parallel edges. */
  from?: string
  to?: string
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

/**
 * A named stop in a guided tour. `views[]` turns a diagram into a document:
 * an ordered set of camera/highlight states the reader can step through, and
 * each `id` is stable enough to deep-link (`/player/<session>?view=<id>`).
 */
export interface DiagramView {
  /** Stable slug — used by deep links and the views rail. */
  id: string
  /** Chapter title shown in the rail. */
  title: string
  /** Anchor node — behaves like selecting it, including its focusTarget story
   *  unless the view overrides the highlight set. */
  node?: string
  /** `append` adds direct neighbors of `node`; `replace` draws only the
   *  declared set. Views without `node` always behave as `replace`. */
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
  /** Ordered guided views — the chapter rail in the player. */
  views?: DiagramView[]
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
  views?: DiagramView[]
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
    views: diagram.views,
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
