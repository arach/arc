import type { AnchorPosition, Connector, NodePosition, DiagramLayout, Point } from '../types/editor'
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
  // Custom width/height on the node override the size preset.
  return { ...size, ...node }
}

// Anchor point on an already-resolved node box. Shared by the editor canvas,
// the player, and the static export so the same anchor name lands on the same
// pixel everywhere.
export function anchorOnNode(
  n: { x: number; y: number; width: number; height: number },
  position: AnchorPosition
): Point {
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

// Calculate anchor point coordinates for a node
export function anchor(
  nodes: Record<string, NodePosition>,
  nodeId: string,
  position: AnchorPosition
): Point {
  const n = getNode(nodes, nodeId)
  if (!n) return { x: 0, y: 0 }
  return anchorOnNode(n, position)
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

// Connector geometry — shared by the editor canvas and the static SVG export
// so both draw the same curve for the same connector.

/** Control-point offset along an anchor's natural direction: side anchors exit
 *  orthogonal to the node edge, corner anchors cut a 45° diagonal toward their
 *  corner. */
export function getConnectorControlOffset(anchor: AnchorPosition, distance: number): Point {
  const d = Math.abs(distance) * 0.5
  switch (anchor) {
    case 'top': return { x: 0, y: -d }
    case 'bottom': return { x: 0, y: d }
    case 'left': return { x: -d, y: 0 }
    case 'right': return { x: d, y: 0 }
    case 'topLeft': return { x: -d * 0.7, y: -d * 0.7 }
    case 'topRight': return { x: d * 0.7, y: -d * 0.7 }
    case 'bottomLeft': return { x: -d * 0.7, y: d * 0.7 }
    case 'bottomRight': return { x: d * 0.7, y: d * 0.7 }
    default: return { x: 0, y: 0 }
  }
}

/** Bezier control points for a connector (see generatePath semantics below). */
export function connectorControlPoints(
  from: Point, to: Point, fromAnchor: AnchorPosition, toAnchor: AnchorPosition,
  curve?: Connector['curve'], curveDepth = 40,
): { cp1: Point; cp2: Point } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  // Natural bezier - control points extend from anchors in their natural direction,
  // scaled by curveDepth (50 = 50% of the endpoint distance).
  if (curve === 'natural' || curve === 'down' || curve === 'up') {
    const scale = curveDepth / 50
    const fromOffset = getConnectorControlOffset(fromAnchor, distance)
    const toOffset = getConnectorControlOffset(toAnchor, distance)
    return {
      cp1: { x: from.x + fromOffset.x * scale, y: from.y + fromOffset.y * scale },
      cp2: { x: to.x + toOffset.x * scale, y: to.y + toOffset.y * scale },
    }
  }

  // Horizontal connections (right->left or left->right) pass through midX
  if ((fromAnchor === 'right' && toAnchor === 'left') || (fromAnchor === 'left' && toAnchor === 'right')) {
    const midX = (from.x + to.x) / 2
    return { cp1: { x: midX, y: from.y }, cp2: { x: midX, y: to.y } }
  }

  // Vertical connections (top->bottom or bottom->top) pass through midY
  if ((fromAnchor === 'bottom' && toAnchor === 'top') || (fromAnchor === 'top' && toAnchor === 'bottom')) {
    const midY = (from.y + to.y) / 2
    return { cp1: { x: from.x, y: midY }, cp2: { x: to.x, y: midY } }
  }

  // Any other pairing: gentle curve along both anchors' directions
  const fromOffset = getConnectorControlOffset(fromAnchor, distance)
  const toOffset = getConnectorControlOffset(toAnchor, distance)
  return {
    cp1: { x: from.x + fromOffset.x, y: from.y + fromOffset.y },
    cp2: { x: to.x + toOffset.x, y: to.y + toOffset.y },
  }
}

/** Smooth curved path between two anchor points. */
export function connectorPath(
  from: Point, to: Point, fromAnchor: AnchorPosition, toAnchor: AnchorPosition,
  curve?: Connector['curve'], curveDepth = 40,
): string {
  const { cp1, cp2 } = connectorControlPoints(from, to, fromAnchor, toAnchor, curve, curveDepth)
  return `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`
}

/** Degrees the path arrives at `to` — the bezier's end tangent, for arrowhead
 *  orientation (the endpoint secant mis-rotates heads on curved paths). */
export function connectorEndAngle(
  from: Point, to: Point, fromAnchor: AnchorPosition, toAnchor: AnchorPosition,
  curve?: Connector['curve'], curveDepth = 40,
): number {
  const { cp2 } = connectorControlPoints(from, to, fromAnchor, toAnchor, curve, curveDepth)
  const vx = to.x - cp2.x
  const vy = to.y - cp2.y
  if (vx === 0 && vy === 0) return Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI)
  return Math.atan2(vy, vx) * (180 / Math.PI)
}

/** Degrees a bidirectional arrow at `from` points back into its node. */
export function connectorStartAngle(
  from: Point, to: Point, fromAnchor: AnchorPosition, toAnchor: AnchorPosition,
  curve?: Connector['curve'], curveDepth = 40,
): number {
  const { cp1 } = connectorControlPoints(from, to, fromAnchor, toAnchor, curve, curveDepth)
  const vx = from.x - cp1.x
  const vy = from.y - cp1.y
  if (vx === 0 && vy === 0) return Math.atan2(from.y - to.y, from.x - to.x) * (180 / Math.PI)
  return Math.atan2(vy, vx) * (180 / Math.PI)
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
