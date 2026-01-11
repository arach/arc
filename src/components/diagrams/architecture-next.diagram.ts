import type { ArcDiagramData } from '../ArcDiagram'

const diagram: ArcDiagramData = {
  id: 'ARC.ARCH.002',
  layout: { width: 880, height: 420 },

  nodes: {
    core:       { x: 340, y: 160, size: 'l' },
    editor:     { x: 80,  y: 100, size: 'm' },
    templates:  { x: 90,  y: 260, size: 's' },
    automation: { x: 355, y: 40,  size: 's' },
    exports:    { x: 620, y: 100, size: 'm' },
    consumers:  { x: 620, y: 260, size: 'm' },
  },

  nodeData: {
    core:       { icon: 'Layers',   name: 'Arc Core',   subtitle: 'Reducer + Model',  description: 'Single source of truth for diagrams.', color: 'emerald' },
    editor:     { icon: 'Monitor',  name: 'Editor UI',  subtitle: 'Canvas',           description: 'Tools, layers, and properties.',       color: 'orange' },
    templates:  { icon: 'Grid3X3',  name: 'Templates',  subtitle: 'Themes',           description: 'Palettes, sizes, defaults.',           color: 'amber' },
    automation: { icon: 'Wand2',    name: 'Automation', subtitle: 'Workflows',        description: 'Build steps, linting, CI hooks.',      color: 'emerald' },
    exports:    { icon: 'Upload',   name: 'Exporters',  subtitle: 'SVG / PNG / TS',   description: 'Asset and config pipelines.',          color: 'blue' },
    consumers:  { icon: 'FileCode', name: 'Docs + Apps', subtitle: 'Consumers',       description: 'Embed Arc models anywhere.',           color: 'zinc' },
  },

  connectors: [
    { from: 'editor',     to: 'core',      fromAnchor: 'right',  toAnchor: 'left',   style: 'solid' },
    { from: 'templates',  to: 'core',      fromAnchor: 'right',  toAnchor: 'left',   style: 'dashed' },
    { from: 'automation', to: 'core',      fromAnchor: 'bottom', toAnchor: 'top',    style: 'dashed' },
    { from: 'core',       to: 'exports',   fromAnchor: 'right',  toAnchor: 'left',   style: 'solid' },
    { from: 'core',       to: 'consumers', fromAnchor: 'right',  toAnchor: 'left',   style: 'solid' },
  ],

  connectorStyles: {
    solid:  { color: 'zinc',    strokeWidth: 2 },
    dashed: { color: 'zinc',    strokeWidth: 2, dashed: true },
  },
}

export default diagram
