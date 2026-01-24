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

// 2D Flow Diagram Player (layout, nodes, nodeData, connectors format)
export {
  default as ArcDiagram,
  type ArcDiagramData,
  type NodeSize,
  type NodePosition as ArcNodePosition,
  type NodeData as ArcNodeData,
  type Connector as ArcConnector,
  type ConnectorStyle as ArcConnectorStyle,
  type DiagramColor,
  type DiagramMode,
  type DiagramLayout,
  type ThemeId,
} from './components/ArcDiagram'

// Theme utilities
export { THEMES, getTheme, getThemeList, type Theme, type ColorPalette } from './utils/themes'

// 3D Isometric Diagram Player (tiers, floorSize, nodes format)
export { default as ArcDiagramIsometric } from './player/ArcDiagram'
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
