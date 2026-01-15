/**
 * Arc Player (Slim) - Core renderer without YAML parsing
 * Use this for smallest bundle size when you don't need YAML config
 */

// Core rendering
export { isoToScreen, isoBox, getColorShading } from '../utils/isometric'

// React component
export { default as ArcDiagram } from './ArcDiagram'

// Vanilla JS renderer
export { renderToElement, renderToString } from './vanilla'

// Types
export type { DiagramConfig, DiagramNode, TierConfig, PlayerOptions } from './types'
