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
export { default } from './components/ArcDiagram'
export {
  default as ArcDiagram,
  type ArcDiagramProps,
  type ArcDiagramData,
  type FocusConnectorRef,
  type FocusStep,
  type FocusTarget,
  type GroupLayoutDirection,
  type GroupLayoutHint,
  type GroupShape,
  type LayoutBoundary,
  type LayoutHints,
  type NodeLayoutHint,
  type NodeSize,
  type NodePosition as ArcNodePosition,
  type NodeData as ArcNodeData,
  type NodeChrome,
  type Connector as ArcConnector,
  type ConnectorStyle as ArcConnectorStyle,
  type DiagramColor,
  type DiagramMode,
  type DiagramLayout,
  type ThemeId,
} from './components/ArcDiagram'

// Theme utilities
export { THEMES, getTheme, getThemeList, getThemeSourcePath, THEME_SOURCE_PATH, type Theme, type ColorPalette, type ThemeListItem } from './utils/themes'

// Template utilities
export { TEMPLATES, DEFAULT_TEMPLATE, getTemplate, getTemplateList, getTemplateSourcePath, TEMPLATE_SOURCE_PATH, type DiagramTemplate, type TemplateId, type TemplateListItem } from './utils/templates'

// 3D Isometric Diagram Player (tiers, floorSize, nodes format)
export { default as ArcDiagramIsometric } from './iso/ArcDiagram'
export { renderToElement, renderToString } from './iso/vanilla'

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
// ASCII Renderer
// =============================================================================
export { renderAscii, type AsciiOptions } from './utils/asciiRenderer'

// =============================================================================
// Types
// =============================================================================
export type { ViewMode, EmbedConfig, NodePosition, ConnectorStyle, DiagramMeta } from './types/editor'

// =============================================================================
// Session Persistence
// =============================================================================
export { generateSessionId, deriveSessionId, saveDiagramSession, loadDiagramSession, listDiagramSessions, deleteDiagramSession } from './utils/sessionStorage'
export type { DiagramSession } from './utils/sessionStorage'
export { registerDiagramReference, getDiagramReference, listDiagramReferences } from './utils/diagramRegistry'
export type { DiagramReferenceEntry, DiagramReferenceSource } from './utils/diagramRegistry'
export type { DiagramConfig, DiagramNode, TierConfig } from './iso/types'
