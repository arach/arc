import ArcDiagram from './ArcDiagram'
import diagram from './diagrams/architecture-next.diagram'

// Clean source representation for display
const sourceCode = `const diagram: ArcDiagramData = {
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
    core:   { icon: 'Layers',  name: 'Arc Core',  color: 'emerald' },
    editor: { icon: 'Monitor', name: 'Editor UI', color: 'orange' },
    // ...
  },

  connectors: [
    { from: 'editor', to: 'core', style: 'solid' },
    { from: 'core',   to: 'exports', style: 'solid' },
    // ...
  ],
}`

export default function ArcArchitectureNext() {
  return (
    <div className="arc-showcase">
      {/* Code panel */}
      <div className="arc-showcase-code">
        <div className="arc-showcase-code-header">
          <span className="arc-showcase-dot arc-showcase-dot-red" />
          <span className="arc-showcase-dot arc-showcase-dot-yellow" />
          <span className="arc-showcase-dot arc-showcase-dot-green" />
          <span className="arc-showcase-filename">architecture.diagram.ts</span>
        </div>
        <pre className="arc-showcase-pre">
          <code>{sourceCode}</code>
        </pre>
      </div>

      {/* Diagram panel */}
      <div className="arc-showcase-diagram">
        <ArcDiagram data={diagram} />
      </div>
    </div>
  )
}
