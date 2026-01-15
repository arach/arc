/**
 * Arc Player Types
 */

export interface TierConfig {
  name: string
  elevation: number
  floorColor?: string
  floorOpacity?: number
  borderColor?: string
  nodeOpacity?: number
  blur?: number
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
}
