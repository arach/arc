/**
 * Arc Player - Embeddable isometric diagram renderer
 *
 * Usage:
 *   import { ArcPlayer, createDiagram } from '@anthropic/arc-player'
 *
 *   // Render to a container
 *   ArcPlayer.render(container, diagramConfig)
 *
 *   // Or use as React component
 *   <ArcDiagram config={diagramConfig} />
 */

// Core rendering
export { isoToScreen, isoBox, getColorShading } from '../utils/isometric'

// React component (for React users)
export { default as ArcDiagram } from './ArcDiagram'

// Vanilla JS renderer (for non-React users)
export { renderToElement, renderToString } from './vanilla'

// Config utilities
export { parseYamlConfig, configToYaml } from '../utils/yamlConfig'

// Types
export type { DiagramConfig, DiagramNode, TierConfig } from './types'
