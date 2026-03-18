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
export { EditorProvider, useEditor, useDiagram, useEditorState, useViewMode, useThemeId, useColorMode, useResolvedTheme, useDiagramMeta } from './components/editor/EditorProvider'

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
// Auto-Layout
// =============================================================================
export { autoLayout, createAutoLayout, type AutoDiagramInput } from './utils/autoLayout'

// =============================================================================
// Types
// =============================================================================
export type { ViewMode, EmbedConfig, NodePosition, ConnectorStyle, DiagramMeta } from './types/editor'

// =============================================================================
// Session Persistence
// =============================================================================
export { generateSessionId, deriveSessionId, saveDiagramSession, loadDiagramSession, listDiagramSessions, deleteDiagramSession } from './utils/sessionStorage'
export type { DiagramSession } from './utils/sessionStorage'
export type { DiagramConfig, DiagramNode, TierConfig } from './player/types'
