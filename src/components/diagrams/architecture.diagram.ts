import type { ArcDiagramData } from '../ArcDiagram'

const diagram: ArcDiagramData = {
  id: 'ARC.ARCH.001',
  layout: { width: 960, height: 460 },

  nodes: {
    editor: { x: 70, y: 70, size: 'l' },
    templates: { x: 90, y: 200, size: 'm' },
    model: { x: 360, y: 150, size: 'm' },
    exporters: { x: 360, y: 260, size: 'm' },
    docs: { x: 640, y: 150, size: 'm' },
  },

  nodeData: {
    editor: {
      icon: 'Monitor',
      name: 'Arc Editor',
      subtitle: 'Canvas UI',
      description: 'Drag, connect, and style systems.',
      color: 'violet',
    },
    templates: {
      icon: 'Grid',
      name: 'Templates',
      subtitle: 'Themes',
      description: 'Palettes, sizes, layout presets.',
      color: 'amber',
    },
    model: {
      icon: 'Layers',
      name: 'Diagram Model',
      subtitle: 'JSON / TS',
      description: 'Typed, diffable diagram state.',
      color: 'blue',
    },
    exporters: {
      icon: 'Upload',
      name: 'Exporters',
      subtitle: 'SVG / PNG / TS',
      description: 'Render outputs for docs and decks.',
      color: 'emerald',
    },
    docs: {
      icon: 'FileCode',
      name: 'Docs + Apps',
      subtitle: 'Consumers',
      description: 'Embed configs anywhere.',
      color: 'zinc',
    },
  },

  connectors: [
    { from: 'editor', to: 'model', fromAnchor: 'right', toAnchor: 'left', style: 'diagram' },
    { from: 'templates', to: 'model', fromAnchor: 'right', toAnchor: 'left', style: 'themes' },
    { from: 'model', to: 'docs', fromAnchor: 'right', toAnchor: 'left', style: 'publish' },
    { from: 'model', to: 'exporters', fromAnchor: 'bottom', toAnchor: 'top', style: 'export' },
  ],

  connectorStyles: {
    diagram: { color: 'violet', strokeWidth: 2, label: 'diagram' },
    themes: { color: 'amber', strokeWidth: 2, label: 'themes' },
    export: { color: 'emerald', strokeWidth: 2, label: 'export' },
    publish: { color: 'blue', strokeWidth: 2, label: 'publish' },
  },
}

export default diagram
