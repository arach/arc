/**
 * Quick test: render example diagrams as ASCII and print to stdout.
 * Usage: npx tsx scripts/testAscii.ts
 */

import { renderAscii } from '../src/utils/asciiRenderer'
import type { ArcDiagramData } from '../src/components/ArcDiagram'

// ── Architecture Intro ──────────────────────

const intro: ArcDiagramData = {
  id: 'ARC.ARCH.001',
  layout: { width: 860, height: 400 },
  nodes: {
    editor:    { x: 50,  y: 50,  size: 'l' },
    templates: { x: 70,  y: 200, size: 'm' },
    model:     { x: 340, y: 150, size: 'm' },
    exporters: { x: 340, y: 280, size: 'm' },
    docs:      { x: 600, y: 150, size: 'm' },
  },
  nodeData: {
    editor:    { icon: 'Monitor',  name: 'Arc Editor',    subtitle: 'Canvas UI',      description: 'Drag, connect, style.',     color: 'violet' },
    templates: { icon: 'Grid3X3',  name: 'Templates',     subtitle: 'Themes',          description: 'Palettes, sizes, presets.', color: 'amber' },
    model:     { icon: 'Layers',   name: 'Diagram Model', subtitle: 'JSON / TS',       description: 'Typed, diffable state.',    color: 'blue' },
    exporters: { icon: 'Upload',   name: 'Exporters',     subtitle: 'SVG / PNG / TS',  description: 'Outputs for docs & decks.', color: 'emerald' },
    docs:      { icon: 'FileCode', name: 'Docs + Apps',   subtitle: 'Consumers',       description: 'Embed anywhere.',           color: 'zinc' },
  },
  connectors: [
    { from: 'editor',    to: 'model',     fromAnchor: 'right',  toAnchor: 'left', style: 'diagram' },
    { from: 'templates', to: 'model',     fromAnchor: 'right',  toAnchor: 'left', style: 'themes' },
    { from: 'model',     to: 'docs',      fromAnchor: 'right',  toAnchor: 'left', style: 'publish' },
    { from: 'model',     to: 'exporters', fromAnchor: 'bottom', toAnchor: 'top',  style: 'export' },
  ],
  connectorStyles: {
    diagram: { color: 'violet',  strokeWidth: 2, label: 'diagram' },
    themes:  { color: 'amber',   strokeWidth: 2, label: 'themes' },
    publish: { color: 'blue',    strokeWidth: 2, label: 'publish' },
    export:  { color: 'emerald', strokeWidth: 2, label: 'export' },
  },
}

// ── Architecture Next ───────────────────────

const next: ArcDiagramData = {
  id: 'ARC.ARCH.002',
  layout: { width: 920, height: 440 },
  nodes: {
    core:       { x: 360, y: 170, size: 'l' },
    editor:     { x: 60,  y: 100, size: 'm' },
    templates:  { x: 70,  y: 280, size: 's' },
    automation: { x: 415, y: 50,  size: 's' },
    exports:    { x: 660, y: 100, size: 'm' },
    consumers:  { x: 660, y: 280, size: 'm' },
  },
  nodeData: {
    core:       { icon: 'Layers',   name: 'Arc Core',    subtitle: 'Reducer + Model',  description: 'Single source of truth.',   color: 'emerald' },
    editor:     { icon: 'Monitor',  name: 'Editor UI',   subtitle: 'Canvas',           description: 'Tools, layers, props.',     color: 'orange' },
    templates:  { icon: 'Grid3X3',  name: 'Templates',   subtitle: 'Themes',           description: 'Palettes, sizes.',          color: 'amber' },
    automation: { icon: 'Wand2',    name: 'Automation',  subtitle: 'Workflows',        description: 'Build steps, CI hooks.',    color: 'emerald' },
    exports:    { icon: 'Upload',   name: 'Exporters',   subtitle: 'SVG / PNG / TS',   description: 'Asset pipelines.',          color: 'blue' },
    consumers:  { icon: 'FileCode', name: 'Docs + Apps', subtitle: 'Consumers',        description: 'Embed Arc anywhere.',       color: 'zinc' },
  },
  connectors: [
    { from: 'editor',     to: 'core',      fromAnchor: 'right',  toAnchor: 'left',   style: 'solid' },
    { from: 'templates',  to: 'core',      fromAnchor: 'right',  toAnchor: 'left',   style: 'dashed' },
    { from: 'automation', to: 'core',      fromAnchor: 'bottom', toAnchor: 'top',    style: 'dashed' },
    { from: 'core',       to: 'exports',   fromAnchor: 'right',  toAnchor: 'left',   style: 'solid' },
    { from: 'core',       to: 'consumers', fromAnchor: 'right',  toAnchor: 'left',   style: 'solid' },
  ],
  connectorStyles: {
    solid:  { color: 'zinc', strokeWidth: 2 },
    dashed: { color: 'zinc', strokeWidth: 2, dashed: true },
  },
}

console.log('═══ Architecture Intro (Unicode) ═══\n')
console.log(renderAscii(intro))
console.log('\n')
console.log('═══ Architecture Next (Unicode) ═══\n')
console.log(renderAscii(next))
console.log('\n')
console.log('═══ Architecture Intro (ASCII) ═══\n')
console.log(renderAscii(intro, { charset: 'ascii' }))
console.log('\n')
console.log('═══ Architecture Intro (maxWidth: 80) ═══\n')
console.log(renderAscii(intro, { maxWidth: 80 }))
