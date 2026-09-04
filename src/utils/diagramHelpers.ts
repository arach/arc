import type { AnchorPosition, NodePosition, DiagramLayout, Point } from '../types/editor'
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
