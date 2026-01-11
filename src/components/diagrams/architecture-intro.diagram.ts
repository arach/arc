import type { ArcDiagramData } from '../ArcDiagram'

const diagram: ArcDiagramData = {
  id: 'ARC.ARCH.001',
  layout: { width: 780, height: 380 },
  nodes: {
    editor:    { x: 40,  y: 40,  size: 'l' },
    templates: { x: 40,  y: 160, size: 'm' },
    model:     { x: 320, y: 140, size: 'm' },
    exporters: { x: 320, y: 260, size: 'm' },
    docs:      { x: 560, y: 140, size: 'm' },
  },
  nodeData: {
    editor:    { icon: 'Monitor',  name: 'Arc Editor',     subtitle: 'Canvas UI',      description: 'Drag nodes, connect systems, manage layers.', color: 'violet' },
    templates: { icon: 'Grid3X3',  name: 'Templates',      subtitle: 'Themes',         description: 'Presets for sizes, palettes, typography.',    color: 'amber' },
    model:     { icon: 'Layers',   name: 'Diagram Model',  subtitle: 'JSON / TS',      description: 'Layout, nodes, connectors, metadata.',        color: 'blue' },
    exporters: { icon: 'Upload',   name: 'Exporters',      subtitle: 'SVG / PNG / TS', description: 'Render outputs for docs and decks.',          color: 'emerald' },
    docs:      { icon: 'FileCode', name: 'Docs + Apps',    subtitle: 'Consumers',      description: 'Embed configs in docs, wikis, apps.',         color: 'zinc' },
  },
  connectors: [
    { from: 'editor',    to: 'model',     fromAnchor: 'right',  toAnchor: 'left',   style: 'diagram' },
    { from: 'templates', to: 'model',     fromAnchor: 'right',  toAnchor: 'left',   style: 'themes' },
    { from: 'model',     to: 'docs',      fromAnchor: 'right',  toAnchor: 'left',   style: 'publish' },
    { from: 'model',     to: 'exporters', fromAnchor: 'bottom', toAnchor: 'top',    style: 'export' },
  ],
  connectorStyles: {
    diagram: { color: 'violet',  strokeWidth: 2, label: 'diagram' },
    themes:  { color: 'amber',   strokeWidth: 2, label: 'themes' },
    publish: { color: 'blue',    strokeWidth: 2, label: 'publish' },
    export:  { color: 'emerald', strokeWidth: 2, label: 'export', labelAlign: 'right' },
  },
}

export default diagram
