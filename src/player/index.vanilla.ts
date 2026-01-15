/**
 * Arc Player (Vanilla) - Zero dependencies, pure SVG output
 * Smallest possible bundle for static rendering
 */

// Core rendering
export { isoToScreen, isoBox, getColorShading } from '../utils/isometric'

// Static renderer only (no React)
export { renderToElement, renderToString } from './vanilla'

// Types
export type { DiagramConfig, DiagramNode, TierConfig } from './types'
