export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Transform {
  zoom: number
  pan: Point
}

export type NodeSize = 'large' | 'normal' | 'small'

export type AnchorPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'

export type EditorMode = 'select' | 'addNode' | 'addConnector' | 'pan'

export type ViewMode = '2d' | 'isometric'

// Embed-time configuration for controlling canvas features
export interface EmbedConfig {
  // View mode
  defaultViewMode?: ViewMode       // '2d' | 'isometric', defaults to '2d'
  enableViewModeToggle?: boolean   // Show toggle between 2D/ISO, defaults to false

  // Interaction controls
  enableZoom?: boolean             // Enable zoom controls and wheel zoom, defaults to true
  enablePan?: boolean              // Enable canvas panning, defaults to true
  enableDrag?: boolean             // Enable node dragging, defaults to true
  enableSelection?: boolean        // Enable node/connector selection, defaults to true

  // UI controls
  showZoomControls?: boolean       // Show zoom +/- buttons, defaults to true
  showMiniMap?: boolean            // Show minimap, defaults to true
  showGrid?: boolean               // Show background grid, defaults to true
}

export type ConnectorCurve = 'natural' | 'down' | 'up'

export interface NodePosition {
  x: number
  y: number
  size: NodeSize
  // Optional custom dimensions (override size preset)
  width?: number
  height?: number
  // Isometric properties (used when viewMode is 'isometric')
  z?: number        // Elevation above floor plane, defaults to 0
  isoHeight?: number  // 3D box height, defaults to 20
  isoDepth?: number   // 3D box depth (Y in iso space), defaults to 50
}

export interface NodeData {
  icon: string
  name: string
  subtitle?: string
  description?: string
  color: string
}

export interface Connector {
  from: string
  to: string
  fromAnchor: AnchorPosition
  toAnchor: AnchorPosition
  style: string
  curve?: ConnectorCurve
}

export interface ConnectorStyle {
  color: string
  strokeWidth: number
  label?: string
  dashed?: boolean
  bidirectional?: boolean
  animated?: boolean
  showArrow?: boolean
  showEndpoints?: boolean
}

export interface GridConfig {
  enabled: boolean
  size: number
  color: string
  opacity: number
  type: 'dots' | 'lines'
}

export interface DiagramLayout {
  width: number
  height: number
}

export interface Diagram {
  layout: DiagramLayout
  grid: GridConfig
  nodes: Record<string, NodePosition>
  nodeData: Record<string, NodeData>
  connectors: Connector[]
  connectorStyles: Record<string, ConnectorStyle>
}

export interface PendingConnector {
  from: string
  fromAnchor: AnchorPosition
}

export interface EditorState {
  selectedNodeId: string | null
  selectedConnectorIndex: number | null
  mode: EditorMode
  pendingConnector: PendingConnector | null
  isDragging: boolean
  dragOffset: Point
  template: string
  zoom: number
  pan: Point
  isPanning: boolean
  viewMode: ViewMode  // '2d' | 'isometric'
}

export interface MetaState {
  filename: string | null
  isDirty: boolean
  lastSaved: string | null
}

export interface HistoryState {
  past: Diagram[]
  future: Diagram[]
}

export interface AppState {
  diagram: Diagram
  editor: EditorState
  meta: MetaState
  history: HistoryState
}

export const ZOOM_MIN = 0.1
export const ZOOM_MAX = 4
export const ZOOM_STEP = 1.15
