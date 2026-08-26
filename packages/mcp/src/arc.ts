/**
 * Thin server-side imports from the Arc source tree.
 * Avoids pulling React component types into the MCP package build.
 */
export { validateDiagramShape, isDiagramShape } from '../../../src/utils/diagramValidation'
export { autoLayout, createAutoLayout } from '../../../src/utils/autoLayout'
export { renderAscii } from '../../../src/utils/asciiRenderer'
export { toTypeScriptSource } from '../../../src/types/diagram'
export type { ArcDiagramData, ArcDiagram } from '../../../src/types/diagram'
