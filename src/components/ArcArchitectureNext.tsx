import ArcDiagram from './ArcDiagram'
import diagram from './diagrams/architecture-next.diagram'

// Clean source representation for display
const sourceCode = `const diagram: ArcDiagramData = {
  id: 'ARC.ARCH.002',
  layout: { width: 920, height: 440 },
  nodes: {
    core:    { x: 360, y: 170, size: 'l' },
    editor:  { x: 60,  y: 100, size: 'm' },
    exports: { x: 660, y: 100, size: 'm' },
  },
  nodeData: {
    core:    { icon: 'Layers',  name: 'Arc Core',  color: 'emerald' },
    editor:  { icon: 'Monitor', name: 'Editor UI', color: 'orange' },
    exports: { icon: 'Upload',  name: 'Exporters', color: 'blue' },
  },
  connectors: [
    { from: 'editor', to: 'core',    style: 'solid' },
    { from: 'core',   to: 'exports', style: 'solid' },
  ],
  connectorStyles: {
    solid: { color: 'zinc', strokeWidth: 2 },
  },
}`

export default function ArcArchitectureNext() {
  return (
    <div className="arc-showcase">
      {/* Diagram section */}
      <div className="arc-showcase-diagram">
        <ArcDiagram data={diagram} theme="light" />
      </div>

      {/* Code section below */}
      <div className="arc-showcase-code">
        <div className="arc-showcase-code-header">
          <span className="arc-showcase-dot arc-showcase-dot-red" />
          <span className="arc-showcase-dot arc-showcase-dot-yellow" />
          <span className="arc-showcase-dot arc-showcase-dot-green" />
          <span className="arc-showcase-filename">architecture.diagram.ts</span>
        </div>
        <pre className="arc-showcase-pre">
          <code dangerouslySetInnerHTML={{ __html: highlightCode(sourceCode) }} />
        </pre>
      </div>
    </div>
  )
}

// Simple syntax highlighting without extra spacing
function highlightCode(code: string): string {
  return code
    // Keywords
    .replace(/\b(const|let|var|function|return|export|default|import|from|type)\b/g, '<span class="hl-keyword">$1</span>')
    // Strings
    .replace(/'([^']*)'/g, '<span class="hl-string">\'$1\'</span>')
    // Numbers
    .replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>')
    // Properties before colon
    .replace(/(\w+)(\s*:)/g, '<span class="hl-property">$1</span>$2')
    // Comments
    .replace(/(\/\/.*)/g, '<span class="hl-comment">$1</span>')
    // Types
    .replace(/:\s*(ArcDiagramData)/g, ': <span class="hl-type">$1</span>')
}
