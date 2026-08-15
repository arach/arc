// Model-agnostic geometry for the technical (line-art) isometric styles.
//
// Kept free of any diagram model so both renderers can use it: the editor's
// node/connector canvas and the packaged tier-based iso renderer.

import { isoToScreen } from './isometric'
import { d } from './isoStyles'

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface WireBox {
  /** Face outlines (closed paths), painted before hatching. */
  top: string
  right: string
  left: string
  /** Silhouette + interior creases, as one multi-subpath stroke. */
  visible: string
  /** The three edges meeting at the occluded corner. */
  hidden: string
  /** Projected centre of the top face — label leader anchor. */
  topCenter: { x: number; y: number }
  /** Topmost point of the top face on screen. */
  topApex: { x: number; y: number }
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/**
 * Wireframe projection of a box.
 *
 * With screenY = -(x+y)·sin30 - z, the corner nearest the viewer is (0,0,0)
 * and the fully occluded corner is (w,d,0). Visible faces: top (z=h),
 * right (y=0, spans X), left (x=0, spans Y).
 */
export function isoWireBox(w: number, depth: number, h: number, ox = 0, oy = 0): WireBox {
  const p = (x: number, y: number, z: number) => {
    const s = isoToScreen(x, y, z)
    return { x: s.screenX + ox, y: s.screenY + oy }
  }

  const a = p(0, 0, 0)          // near corner, floor
  const b = p(w, 0, 0)
  const c = p(w, depth, 0)      // occluded corner
  const e = p(0, depth, 0)
  const A = p(0, 0, h)          // near corner, top
  const B = p(w, 0, h)
  const C = p(w, depth, h)
  const E = p(0, depth, h)

  const poly = (pts: Array<{ x: number; y: number }>) =>
    `M ${pts.map((q) => `${q.x},${q.y}`).join(' L ')} Z`
  const line = (from: { x: number; y: number }, to: { x: number; y: number }) =>
    `M ${from.x},${from.y} L ${to.x},${to.y}`

  const all = [a, b, c, e, A, B, C, E]

  return {
    top: poly([A, B, C, E]),
    right: poly([a, b, B, A]),
    left: poly([a, e, E, A]),
    visible: [
      // silhouette
      poly([a, b, B, C, E, e]),
      // interior creases radiating from the near top corner
      line(A, B),
      line(A, E),
      line(A, a),
    ].join(' '),
    hidden: [line(c, b), line(c, e), line(c, C)].join(' '),
    topCenter: { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 },
    topApex: { x: C.x, y: C.y },
    minX: Math.min(...all.map((q) => q.x)),
    minY: Math.min(...all.map((q) => q.y)),
    maxX: Math.max(...all.map((q) => q.x)),
    maxY: Math.max(...all.map((q) => q.y)),
  }
}

/** Grow `bounds` to include `next`. */
export function unionBounds(bounds: Bounds | null, next: Bounds): Bounds {
  if (!bounds) return { ...next }
  return {
    minX: Math.min(bounds.minX, next.minX),
    minY: Math.min(bounds.minY, next.minY),
    maxX: Math.max(bounds.maxX, next.maxX),
    maxY: Math.max(bounds.maxY, next.maxY),
  }
}

/**
 * Margins the technical sheet adds around the drawing for the frame, the
 * component index (top-left), and the title block (bottom-right). Shared so
 * auto-centering frames the plate, not just the boxes.
 */
export const PLATE_MARGIN = { x: d(72), top: d(96), bottom: d(56) }

/** Expand drawing bounds into the framed plate rect. */
export function toPlateBounds(bounds: Bounds): Bounds {
  return {
    minX: bounds.minX - PLATE_MARGIN.x,
    minY: bounds.minY - PLATE_MARGIN.top,
    maxX: bounds.maxX + PLATE_MARGIN.x,
    maxY: bounds.maxY + PLATE_MARGIN.bottom,
  }
}

/** Zero-padded component tag, e.g. 3 → "03". */
export function componentTag(n: number): string {
  return String(n).padStart(2, '0')
}

/** One row of the component index table. */
export interface IndexRow {
  n: number
  name: string
  subtitle?: string
  color?: string
}
