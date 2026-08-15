// Node silhouettes and decoration.
//
// `nodeShape` used to collapse into a border-radius — 'chamfer' was just 2px of
// rounding — so themes that asked for a distinct silhouette all looked alike.
// Chamfer and notch are now real cut corners, drawn with clip-path in px (not
// %) so the cut stays at 45° whatever the node's height.
//
// A clipped element clips its border and its box-shadow too, so those two get
// handled differently for cut shapes: the outline is a 1px "matte" layer behind
// the fill, and the hover glow becomes a drop-shadow filter, which follows the
// clip path.

export type NodeShape = 'rounded' | 'square' | 'chamfer' | 'notch' | 'pill'

/** Ornament drawn on the node shell. Purely decorative; never carries meaning. */
export type NodeDecor = 'none' | 'bar-left' | 'bar-top' | 'ticks' | 'rule' | 'dot' | 'stripe'

export type NodeSizeKey = 'xs' | 's' | 'm' | 'l'

/** Corner cut, in px, scaled to the node's footprint. */
export function shapeCut(size: NodeSizeKey): number {
  switch (size) {
    case 'l': return 11
    case 'm': return 9
    case 's': return 7
    default: return 5
  }
}

/** True when the silhouette needs clipping rather than a border-radius. */
export function isCutShape(shape: NodeShape): boolean {
  return shape === 'chamfer' || shape === 'notch'
}

/**
 * clip-path for a cut silhouette.
 * - chamfer: all four corners cut — an octagon, the drafting-plate look
 * - notch: one cut at the top-right, like a tag or a keyed card
 */
export function shapeClipPath(shape: NodeShape, cut: number): string | undefined {
  const c = `${cut}px`
  const rc = `calc(100% - ${cut}px)`
  switch (shape) {
    case 'chamfer':
      return `polygon(${c} 0, ${rc} 0, 100% ${c}, 100% ${rc}, ${rc} 100%, ${c} 100%, 0 ${rc}, 0 ${c})`
    case 'notch':
      return `polygon(0 0, ${rc} 0, 100% ${c}, 100% 100%, 0 100%)`
    default:
      return undefined
  }
}

/**
 * Stroked outline for a cut silhouette, as an SVG path. A clipped element eats
 * its own border, so cut shapes draw their edge here instead. Half-pixel
 * offsets keep a 1px stroke crisp.
 */
export function shapeOutlinePath(shape: NodeShape, w: number, h: number, cut: number): string | undefined {
  const x0 = 0.5
  const y0 = 0.5
  const x1 = w - 0.5
  const y1 = h - 0.5
  switch (shape) {
    case 'chamfer':
      return [
        `M ${x0 + cut} ${y0}`,
        `L ${x1 - cut} ${y0}`,
        `L ${x1} ${y0 + cut}`,
        `L ${x1} ${y1 - cut}`,
        `L ${x1 - cut} ${y1}`,
        `L ${x0 + cut} ${y1}`,
        `L ${x0} ${y1 - cut}`,
        `L ${x0} ${y0 + cut}`,
        'Z',
      ].join(' ')
    case 'notch':
      return [
        `M ${x0} ${y0}`,
        `L ${x1 - cut} ${y0}`,
        `L ${x1} ${y0 + cut}`,
        `L ${x1} ${y1}`,
        `L ${x0} ${y1}`,
        'Z',
      ].join(' ')
    default:
      return undefined
  }
}

/** Resolve the silhouette from the brand spec, falling back to the radius. */
export function resolveNodeShape(shape?: string, radius?: string): NodeShape {
  if (shape === 'square' || shape === 'chamfer' || shape === 'notch' || shape === 'pill' || shape === 'rounded') {
    return shape
  }
  if (radius === '0px') return 'square'
  if (radius === '9999px') return 'pill'
  return 'rounded'
}

/**
 * Back-compat: `accentBar` predates `nodeDecor` and said the same thing in a
 * narrower vocabulary.
 */
export function resolveNodeDecor(decor?: string, accentBar?: string): NodeDecor {
  if (decor) return decor as NodeDecor
  if (accentBar === 'left') return 'bar-left'
  if (accentBar === 'top') return 'bar-top'
  return 'none'
}
