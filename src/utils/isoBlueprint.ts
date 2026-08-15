// Geometry helpers for the technical (line-art) isometric styles.
//
// The shaded renderer paints three filled faces and lets the painter's
// algorithm do the rest. A technical plate also needs the *edges*: the visible
// silhouette, the three interior creases, and the three hidden edges that get
// drawn as fine dashes — plus stable component numbers for the index table.

import { isoToScreen } from './isometric'
import { NODE_SIZES } from './constants'
import { isoWireBox, unionBounds, toPlateBounds } from './isoWire'
import type { Bounds } from './isoWire'
import type { NodePosition, NodeData } from '../types/editor'

export { isoWireBox, componentTag, PLATE_MARGIN } from './isoWire'
export type { WireBox, Bounds, IndexRow } from './isoWire'

/** 2D node widths are scaled down in iso space for visual balance. */
export const ISO_WIDTH_SCALE = 0.8
export const DEFAULT_ISO_HEIGHT = 25
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

/** Screen-space bounds of every drawn box — used to size the drawing sheet. */
export function isoContentBounds(
  nodes: Record<string, NodePosition>,
  nodeData: Record<string, NodeData>,
  originX: number,
  originY: number
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
  fallback: { width: number; height: number }
): Bounds {
  const bounds = isoContentBounds(nodes, nodeData, originX, originY) || {
    minX: 0,
    minY: 0,
    maxX: fallback.width,
    maxY: fallback.height,
  }
  return toPlateBounds(bounds)
}
