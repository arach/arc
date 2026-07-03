/**
 * Arc Isometric Types
 */

export interface TierConfig {
  name: string
  elevation: number
  floorColor?: string
  floorOpacity?: number
  borderColor?: string
  nodeOpacity?: number
  blur?: number
  /** Projected (screen-space) offset applied to the whole layer AFTER isometric projection.
   *  Staggers layers in the picture plane — e.g. { x: 0, y: -40 } lifts a layer up the projected
   *  Y axis; { x: -60, y: 0 } pushes one left on −X. Purely declarative; default = no offset. */
  offset?: { x: number; y: number }
}

export interface DiagramNode {
  tier: number
  x: number
  y: number
  width: number
  depth: number
  height: number
  color: string
  label: string
  opacity?: number
  blur?: number
  translucent?: boolean
  /** Optional link target; clicking the node surfaces this (declarative click hook). */
  link?: string
}

export interface DiagramConfig {
  id?: string
  title: string
  description?: string
  theme: 'dark' | 'light'
  canvas: { width: number; height: number }
  origin: { x: number; y: number }
  cornerRadius?: number
  tiers: TierConfig[]
  floorSize: { width: number; depth: number }
  nodes: DiagramNode[]
  pillars?: { x: number; y: number; fromTier: number; toTier: number }[]
}

export interface PlayerOptions {
  /** Enable hover effects */
  interactive?: boolean
  /** Enable zoom/pan */
  zoomable?: boolean
  /** Show tier labels */
  showLabels?: boolean
  /** Animation on load */
  animate?: boolean
  /** On hover, lift the hovered layer out of the stack (default: true when interactive) */
  expandOnHover?: boolean
}
