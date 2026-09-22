import type { AnchorPosition, ArrowHead, NodePosition, DiagramLayout, Point } from '../types/editor'
import { NODE_SIZES, NodeSizeKey, NodeDimensions } from './constants'

// Distance from box edge to arrow start/end (minimal gap for tight alignment)
const GAP = 0

// Extended node with computed dimensions
interface NodeWithDimensions extends NodePosition {
  width: number
  height: number
}

// Get node with merged position and size data
export function getNode(
  nodes: Record<string, NodePosition>,
  id: string
): NodeWithDimensions | null {
  const node = nodes[id]
  if (!node) return null
  const size: NodeDimensions = NODE_SIZES[node.size as NodeSizeKey] || NODE_SIZES.m
  return { ...node, ...size }
}

// Calculate anchor point coordinates for a node
export function anchor(
  nodes: Record<string, NodePosition>,
  nodeId: string,
  position: AnchorPosition
): Point {
  const n = getNode(nodes, nodeId)
  if (!n) return { x: 0, y: 0 }

  switch (position) {
    case 'left':
      return { x: n.x - GAP, y: n.y + n.height / 2 }
    case 'right':
      return { x: n.x + n.width + GAP, y: n.y + n.height / 2 }
    case 'top':
      return { x: n.x + n.width / 2, y: n.y - GAP }
    case 'bottom':
      return { x: n.x + n.width / 2, y: n.y + n.height + GAP }
    case 'bottomRight':
      return { x: n.x + n.width + GAP, y: n.y + n.height - 15 }
    case 'bottomLeft':
      return { x: n.x - GAP, y: n.y + n.height - 15 }
    case 'topRight':
      return { x: n.x + n.width + GAP, y: n.y + 15 }
    case 'topLeft':
      return { x: n.x - GAP, y: n.y + 15 }
    default:
      return { x: n.x + n.width / 2, y: n.y + n.height / 2 }
  }
}

const MAIN_ANCHORS: AnchorPosition[] = ['top', 'right', 'bottom', 'left']

/** Closest of the four main faces to a canvas-space point. */
export function nearestNodeAnchor(
  nodes: Record<string, NodePosition>,
  nodeId: string,
  canvasX: number,
  canvasY: number
): AnchorPosition {
  let best: AnchorPosition = 'right'
  let bestD = Infinity
  for (const face of MAIN_ANCHORS) {
    const p = anchor(nodes, nodeId, face)
    const d = (p.x - canvasX) ** 2 + (p.y - canvasY) ** 2
    if (d < bestD) {
      bestD = d
      best = face
    }
  }
  return best
}

/** Last matching node in 2D canvas space (later draw order wins). */
export function hitTestNode(
  nodes: Record<string, NodePosition>,
  nodeData: Record<string, unknown>,
  pt: Point
): string | null {
  let hit: string | null = null
  for (const [id, node] of Object.entries(nodes)) {
    if (!nodeData[id]) continue
    const size = NODE_SIZES[node.size as NodeSizeKey] || NODE_SIZES.m
    const w = node.width || size.width
    const h = node.height || size.height
    if (pt.x >= node.x && pt.x <= node.x + w && pt.y >= node.y && pt.y <= node.y + h) {
      hit = id
    }
  }
  return hit
}

// Calculate midpoint between two coordinates
export function midPoint(p1: Point, p2: Point): Point {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
}

// Generate SVG path for straight line
export function straightPath(from: Point, to: Point): string {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
}

// Curve direction type
type CurveDirection = 'down' | 'up'

// Generate SVG path for curved line
export function curvedPath(from: Point, to: Point, direction: CurveDirection = 'down'): string {
  const cp = 50
  if (direction === 'down') {
    return `M ${from.x} ${from.y} C ${from.x + cp} ${from.y + 50}, ${to.x - cp} ${to.y - 30}, ${to.x} ${to.y}`
  }
  return straightPath(from, to)
}

// Generate unique node ID
export function generateNodeId(): string {
  return `node_${crypto.randomUUID().slice(0, 8)}`
}

// Get center position of canvas for new nodes
export function getCanvasCenter(layout: DiagramLayout): Point {
  return {
    x: layout.width / 2 - NODE_SIZES.m.width / 2,
    y: layout.height / 2 - NODE_SIZES.m.height / 2,
  }
}

/** Bounding box of everything drawn — nodes, groups, images — in canvas
 *  coordinates. Returns null when the canvas is empty. */
export function getContentBounds(
  nodes: Record<string, NodePosition>,
  groups?: Array<{ x: number; y: number; width: number; height: number }>,
  images?: Array<{ x: number; y: number; width: number; height: number }>,
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  let found = false

  for (const node of Object.values(nodes)) {
    const dims = NODE_SIZES[node.size as NodeSizeKey] || NODE_SIZES.m
    const w = node.width || dims.width
    const h = node.height || dims.height
    minX = Math.min(minX, node.x)
    minY = Math.min(minY, node.y)
    maxX = Math.max(maxX, node.x + w)
    maxY = Math.max(maxY, node.y + h)
    found = true
  }

  for (const g of groups || []) {
    minX = Math.min(minX, g.x)
    minY = Math.min(minY, g.y)
    maxX = Math.max(maxX, g.x + g.width)
    maxY = Math.max(maxY, g.y + g.height)
    found = true
  }

  for (const img of images || []) {
    minX = Math.min(minX, img.x)
    minY = Math.min(minY, img.y)
    maxX = Math.max(maxX, img.x + img.width)
    maxY = Math.max(maxY, img.y + img.height)
    found = true
  }

  return found ? { minX, minY, maxX, maxY } : null
}

// ============================================
// Connector appearance & routing
// ============================================

export interface ConnectorEndStyle {
  dashed?: boolean
  lineStyle?: 'solid' | 'dashed' | 'dotted'
  opacity?: number
  bidirectional?: boolean
  animated?: boolean
  showArrow?: boolean
  showEndpoints?: boolean
  fromArrow?: ArrowHead
  toArrow?: ArrowHead
  arrowSize?: number
  fromArrowSize?: number
  toArrowSize?: number
  arrowScale?: boolean
  strokeWidth?: number
}

/** Resolved stroke pattern — `lineStyle` wins over the legacy `dashed` flag. */
export function connectorLineStyle(style: ConnectorEndStyle): 'solid' | 'dashed' | 'dotted' {
  return style.lineStyle ?? (style.dashed ? 'dashed' : 'solid')
}

/** Arrowhead drawn at one end of a connector, honouring the legacy flags. */
export function connectorArrowAt(style: ConnectorEndStyle, end: 'from' | 'to'): ArrowHead {
  const explicit = end === 'from' ? style.fromArrow : style.toArrow
  if (explicit) return explicit
  if (end === 'to') return style.showArrow === false ? 'none' : 'arrow'
  return style.bidirectional ? 'arrow' : 'none'
}

/** Arrowhead length in px at one end. `arrowScale` makes it follow the
 *  stroke width; per-end overrides win over `arrowSize`. */
export function connectorArrowSize(style: ConnectorEndStyle, end: 'from' | 'to'): number {
  const size = (end === 'from' ? style.fromArrowSize : style.toArrowSize) ?? style.arrowSize
  if (size != null) return size
  if (style.arrowScale) return Math.max(4, (style.strokeWidth ?? 2) * 4)
  return 8
}

export interface ArrowShape {
  /** Path 'd' in local coords — +x is the direction of travel, origin at the tip. */
  d?: string
  /** Circle for the 'dot' end. */
  circle?: { cx: number; r: number }
  /** Filled polygon vs stroked path. */
  filled: boolean
}

/** Geometry for an arrowhead kind at a given size. */
export function arrowShape(kind: ArrowHead, size: number): ArrowShape | null {
  const s = size
  switch (kind) {
    case 'arrow':
      return { d: `M 0 0 L ${-s} ${-s / 2.6} L ${-s} ${s / 2.6} Z`, filled: true }
    case 'open':
      return { d: `M ${-s} ${-s / 2.4} L 0 0 L ${-s} ${s / 2.4}`, filled: false }
    case 'dot':
      return { circle: { cx: -s / 2, r: s / 2.8 }, filled: true }
    case 'diamond':
      return { d: `M 0 0 L ${-s * 0.5} ${-s * 0.3} L ${-s} 0 L ${-s * 0.5} ${s * 0.3} Z`, filled: true }
    case 'bar':
      return { d: `M ${-s * 0.15} ${-s * 0.5} L ${-s * 0.15} ${s * 0.5}`, filled: false }
    default:
      return null
  }
}

/** Degrees of a → b. */
export function angleBetween(a: Point, b: Point): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
}

function horizontalAnchor(a?: AnchorPosition): boolean {
  return a === 'left' || a === 'right'
}

/** Polyline points for an orthogonal route ('step' curve). Corner anchors
 *  (topLeft, bottomRight…) exit vertically. */
export function elbowPolyline(
  from: Point,
  to: Point,
  fromAnchor?: AnchorPosition,
  toAnchor?: AnchorPosition,
): Point[] {
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  const fH = horizontalAnchor(fromAnchor)
  const tH = horizontalAnchor(toAnchor)
  if (fH && tH) return [from, { x: midX, y: from.y }, { x: midX, y: to.y }, to]
  if (!fH && !tH) return [from, { x: from.x, y: midY }, { x: to.x, y: midY }, to]
  if (fH) return [from, { x: to.x, y: from.y }, to]
  return [from, { x: from.x, y: to.y }, to]
}

/** SVG path through polyline points, corners rounded by `radius`. */
export function roundedPolylineD(pts: Point[], radius = 10): string {
  if (pts.length < 2) return ''
  if (pts.length === 2) return straightPath(pts[0], pts[1])
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1]
    const cur = pts[i]
    const next = pts[i + 1]
    const lenIn = Math.hypot(cur.x - prev.x, cur.y - prev.y)
    const lenOut = Math.hypot(next.x - cur.x, next.y - cur.y)
    const r = Math.min(radius, lenIn / 2, lenOut / 2)
    if (r < 0.5 || lenIn === 0 || lenOut === 0) {
      d += ` L ${cur.x} ${cur.y}`
      continue
    }
    const inX = cur.x - ((cur.x - prev.x) / lenIn) * r
    const inY = cur.y - ((cur.y - prev.y) / lenIn) * r
    const outX = cur.x + ((next.x - cur.x) / lenOut) * r
    const outY = cur.y + ((next.y - cur.y) / lenOut) * r
    d += ` L ${inX} ${inY} Q ${cur.x} ${cur.y} ${outX} ${outY}`
  }
  const last = pts[pts.length - 1]
  d += ` L ${last.x} ${last.y}`
  return d
}
