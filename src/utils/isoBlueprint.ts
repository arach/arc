// Geometry helpers for the technical (line-art) isometric styles.
//
// The shaded renderer paints three filled faces and lets the painter's
// algorithm do the rest. A technical plate also needs the *edges*: the visible
// silhouette, the three interior creases, and the three hidden edges that get
// drawn as fine dashes — plus stable component numbers for the index table.

import { isoToScreen, isoBoundingBox } from './isometric'
import { NODE_SIZES } from './constants'
import { isoWireBox, unionBounds, toPlateBounds } from './isoWire'
import type { Bounds } from './isoWire'
import type { NodePosition, NodeData } from '../types/editor'

export { isoWireBox, componentTag, PLATE_MARGIN } from './isoWire'
export type { WireBox, Bounds, IndexRow } from './isoWire'

/** 2D node widths are scaled down in iso space for visual balance. */
export const ISO_WIDTH_SCALE = 0.8
export const DEFAULT_ISO_HEIGHT = 10
export const DEFAULT_ISO_DEPTH = 50

export interface IsoNodeDims {
  width: number
  depth: number
  height: number
  elevation: number
}

/** Resolve a node's box dimensions in world (iso) units. */
export function isoNodeDims(node: NodePosition): IsoNodeDims {
  const size = NODE_SIZES[node.size as keyof typeof NODE_SIZES] || NODE_SIZES.m
  return {
    width: (node.width || size.width) * ISO_WIDTH_SCALE,
    depth: node.isoDepth ?? DEFAULT_ISO_DEPTH,
    height: node.isoHeight ?? DEFAULT_ISO_HEIGHT,
    elevation: node.z ?? 0,
  }
}

/** Axis-aligned world box used for painter's-algorithm sorting. */
export interface IsoWorldBox {
  id: string
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
  order: number
}

export function isoWorldBox(id: string, node: NodePosition): IsoWorldBox {
  const dims = isoNodeDims(node)
  return {
    id,
    minX: node.x,
    maxX: node.x + dims.width,
    minY: node.y,
    maxY: node.y + dims.depth,
    minZ: dims.elevation,
    maxZ: dims.elevation + dims.height,
    order: node.isoOrder ?? 0,
  }
}

/**
 * Back-to-front compare for isometric AABBs.
 *
 * Camera looks from +X+Y+Z, so the near corner is (maxX, maxY, maxZ). When two
 * volumes occupy the same space, `isoOrder` is the only way to pick a winner —
 * that's the inspector's Under / Over control.
 */
export function compareIsoWorldBoxes(a: IsoWorldBox, b: IsoWorldBox): number {
  const overlap =
    a.minX < b.maxX && a.maxX > b.minX &&
    a.minY < b.maxY && a.maxY > b.minY &&
    a.minZ < b.maxZ && a.maxZ > b.minZ

  if (overlap && a.order !== b.order) return a.order - b.order

  const aFront = a.maxX + a.maxY
  const bFront = b.maxX + b.maxY
  if (aFront !== bFront) return aFront - bFront

  if (a.maxZ !== b.maxZ) return a.maxZ - b.maxZ
  if (a.order !== b.order) return a.order - b.order
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

export function sortIsoNodeIds(
  nodes: Record<string, NodePosition>,
  nodeData: Record<string, NodeData>
): string[] {
  return Object.keys(nodes)
    .filter((id) => nodeData[id])
    .map((id) => isoWorldBox(id, nodes[id]))
    .sort(compareIsoWorldBoxes)
    .map((box) => box.id)
}

const ISO_FACE_ANCHORS = ['top', 'right', 'bottom', 'left'] as const
export type IsoFaceAnchor = (typeof ISO_FACE_ANCHORS)[number]

/** Canvas-space position of an anchor on an isometric box. */
export function isoNodeAnchor(
  node: NodePosition,
  anchorPosition: string,
  originX: number,
  originY: number
): { x: number; y: number } {
  const { width: isoWidth, depth: isoDepth, height: isoHeight, elevation } = isoNodeDims(node)
  let wx: number
  let wy: number
  let wz: number

  switch (anchorPosition) {
    case 'left':
      wx = node.x
      wy = node.y + isoDepth / 2
      wz = elevation + isoHeight / 2
      break
    case 'right':
      wx = node.x + isoWidth / 2
      wy = node.y
      wz = elevation + isoHeight / 2
      break
    case 'top':
      wx = node.x + isoWidth / 2
      wy = node.y + isoDepth / 2
      wz = elevation + isoHeight
      break
    case 'bottom':
      wx = node.x + isoWidth / 2
      wy = node.y + isoDepth / 2
      wz = elevation
      break
    case 'topLeft':
      wx = node.x
      wy = node.y + isoDepth
      wz = elevation + isoHeight
      break
    case 'topRight':
      wx = node.x + isoWidth
      wy = node.y
      wz = elevation + isoHeight
      break
    case 'bottomLeft':
      wx = node.x
      wy = node.y + isoDepth
      wz = elevation
      break
    case 'bottomRight':
      wx = node.x + isoWidth
      wy = node.y
      wz = elevation
      break
    default:
      wx = node.x + isoWidth / 2
      wy = node.y + isoDepth / 2
      wz = elevation + isoHeight
  }

  const screen = isoToScreen(wx, wy, wz)
  return { x: originX + screen.screenX, y: originY + screen.screenY }
}

/** Closest of the four main faces to a canvas-space point. */
export function nearestIsoAnchor(
  node: NodePosition,
  canvasX: number,
  canvasY: number,
  originX: number,
  originY: number
): IsoFaceAnchor {
  let best: IsoFaceAnchor = 'right'
  let bestD = Infinity
  for (const face of ISO_FACE_ANCHORS) {
    const p = isoNodeAnchor(node, face, originX, originY)
    const d = (p.x - canvasX) ** 2 + (p.y - canvasY) ** 2
    if (d < bestD) {
      bestD = d
      best = face
    }
  }
  return best
}

/** Front-most isometric box whose screen AABB contains the canvas point. */
export function hitTestIsoNode(
  nodes: Record<string, NodePosition>,
  nodeData: Record<string, NodeData>,
  canvasX: number,
  canvasY: number,
  originX: number,
  originY: number
): string | null {
  let best: string | null = null
  let bestFront = -Infinity
  for (const [id, node] of Object.entries(nodes)) {
    if (!nodeData[id]) continue
    const box = isoNodeScreenBounds(node, originX, originY)
    if (
      canvasX >= box.minX &&
      canvasX <= box.minX + box.width &&
      canvasY >= box.minY &&
      canvasY <= box.minY + box.height
    ) {
      const world = isoWorldBox(id, node)
      const front = world.maxX + world.maxY
      if (front >= bestFront) {
        bestFront = front
        best = id
      }
    }
  }
  return best
}

/** Screen-space AABB of a node's isometric box — for marquee hit-testing. */
export function isoNodeScreenBounds(
  node: NodePosition,
  originX: number,
  originY: number
) {
  const dims = isoNodeDims(node)
  const origin = isoToScreen(node.x, node.y, dims.elevation)
  return isoBoundingBox(
    dims.width,
    dims.depth,
    dims.height,
    originX + origin.screenX,
    originY + origin.screenY
  )
}

/** Screen-space bounds of a rectangle (or its inscribed ellipse) on the iso floor. */
function isoFloorBounds(
  x: number,
  y: number,
  width: number,
  depth: number,
  originX: number,
  originY: number
): Bounds {
  const corners = [
    isoToScreen(x, y, 0),
    isoToScreen(x + width, y, 0),
    isoToScreen(x + width, y + depth, 0),
    isoToScreen(x, y + depth, 0),
  ]
  const xs = corners.map((p) => p.screenX + originX)
  const ys = corners.map((p) => p.screenY + originY)
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  }
}

/** Screen-space bounds of every drawn box — used to size the drawing sheet. */
export function isoContentBounds(
  nodes: Record<string, NodePosition>,
  nodeData: Record<string, NodeData>,
  originX: number,
  originY: number,
  groups?: Array<{ x: number; y: number; width: number; height: number }>
): Bounds | null {
  let bounds: Bounds | null = null

  for (const [nodeId, node] of Object.entries(nodes)) {
    if (!nodeData[nodeId]) continue
    const dims = isoNodeDims(node)
    const origin = isoToScreen(node.x, node.y, dims.elevation)
    const box = isoWireBox(
      dims.width,
      dims.depth,
      dims.height,
      originX + origin.screenX,
      originY + origin.screenY
    )
    bounds = unionBounds(bounds, box)
  }

  for (const group of groups || []) {
    bounds = unionBounds(
      bounds,
      isoFloorBounds(group.x, group.y, group.width, group.height, originX, originY)
    )
  }

  return bounds
}

/**
 * Stable component numbers, keyed by node id in alphabetical order so the
 * callout tags and the index table always agree (and don't renumber when a
 * node is dragged in front of another).
 */
export function buildNodeIndex(
  nodes: Record<string, NodePosition>,
  nodeData: Record<string, NodeData>
): Record<string, number> {
  const ids = Object.keys(nodes)
    .filter((id) => nodeData[id])
    .sort()
  return Object.fromEntries(ids.map((id, i) => [id, i + 1]))
}

/** The framed plate rect drawn by the technical styles, in canvas space. */
export function isoPlateBounds(
  nodes: Record<string, NodePosition>,
  nodeData: Record<string, NodeData>,
  originX: number,
  originY: number,
  fallback: { width: number; height: number },
  groups?: Array<{ x: number; y: number; width: number; height: number }>
): Bounds {
  const bounds = isoContentBounds(nodes, nodeData, originX, originY, groups) || {
    minX: 0,
    minY: 0,
    maxX: fallback.width,
    maxY: fallback.height,
  }
  return toPlateBounds(bounds)
}
