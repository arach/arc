/**
 * Arc - Visual diagram editor for creating architecture diagrams
 *
 * @package @arach/arc
 */

// =============================================================================
// Editor Components
// =============================================================================
export { default as DiagramEditor } from './components/editor/DiagramEditor'
export { default as DiagramCanvas } from './components/editor/DiagramCanvas'
export { EditorProvider, useEditor, useDiagram, useEditorState, useViewMode } from './components/editor/EditorProvider'

// =============================================================================
// Player / Viewer Components
// =============================================================================
export { default as ArcDiagram } from './player/ArcDiagram'
export { renderToElement, renderToString } from './player/vanilla'

// =============================================================================
// Isometric Utilities
// =============================================================================
export {
  isoToScreen,
  screenToIsoFloor,
  isoBox,
  isoShading,
  getColorShading,
  isoBoundingBox,
  ISO_COLORS,
} from './utils/isometric'

// =============================================================================
// Config Utilities
// =============================================================================
export { parseYamlConfig, configToYaml } from './utils/yamlConfig'

// =============================================================================
// Types
// =============================================================================
export type { ViewMode, EmbedConfig, NodePosition, ConnectorStyle } from './types/editor'
export type { DiagramConfig, DiagramNode, TierConfig } from './player/types'
