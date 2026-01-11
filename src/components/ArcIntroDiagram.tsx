import ArcDiagram from './ArcDiagram'
import diagram from './diagrams/architecture-intro.diagram'

const sourceCode = `const diagram: ArcDiagramData = {
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
    editor:    { icon: 'Monitor',  name: 'Arc Editor',    color: 'violet' },
    templates: { icon: 'Grid3X3',  name: 'Templates',     color: 'amber' },
    model:     { icon: 'Layers',   name: 'Diagram Model', color: 'blue' },
    exporters: { icon: 'Upload',   name: 'Exporters',     color: 'emerald' },
    docs:      { icon: 'FileCode', name: 'Docs + Apps',   color: 'zinc' },
  },
  connectors: [
    { from: 'editor',    to: 'model',     style: 'diagram' },
    { from: 'templates', to: 'model',     style: 'themes' },
    { from: 'model',     to: 'docs',      style: 'publish' },
    { from: 'model',     to: 'exporters', style: 'export' },
  ],
  connectorStyles: {
    diagram: { color: 'violet',  label: 'diagram' },
    themes:  { color: 'amber',   label: 'themes' },
    publish: { color: 'blue',    label: 'publish' },
    export:  { color: 'emerald', label: 'export' },
  },
}`

export default function ArcIntroDiagram() {
  return (
    <div className="arc-showcase">
      <div className="arc-showcase-diagram">
        <ArcDiagram data={diagram} theme="light" />
      </div>
      <div className="arc-showcase-code">
        <div className="arc-showcase-code-header">
          <span className="arc-showcase-dot arc-showcase-dot-red" />
          <span className="arc-showcase-dot arc-showcase-dot-yellow" />
          <span className="arc-showcase-dot arc-showcase-dot-green" />
          <span className="arc-showcase-filename">intro.diagram.ts</span>
        </div>
        <pre className="arc-showcase-pre">
          <code dangerouslySetInnerHTML={{ __html: highlightCode(sourceCode) }} />
        </pre>
      </div>
    </div>
  )
}

function highlightCode(code: string): string {
  return code
    .replace(/\b(const|let|var|function|return|export|default|import|from|type)\b/g, '<span class="hl-keyword">$1</span>')
    .replace(/'([^']*)'/g, '<span class="hl-string">\'$1\'</span>')
    .replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>')
    .replace(/(\w+)(\s*:)/g, '<span class="hl-property">$1</span>$2')
    .replace(/(\/\/.*)/g, '<span class="hl-comment">$1</span>')
    .replace(/:\s*(ArcDiagramData)/g, ': <span class="hl-type">$1</span>')
}
