import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import DocsLayout, { type DocSection } from './DocsLayout'
import CodeBlock from './CodeBlock'

const sections: DocSection[] = [
  { id: 'install', title: 'Installation', level: 2 },
  { id: 'create-diagram', title: 'Create a Diagram', level: 2 },
  { id: 'render', title: 'Render the Diagram', level: 2 },
  { id: 'customize', title: 'Customize Appearance', level: 2 },
  { id: 'next-steps', title: 'Next Steps', level: 2 },
]

interface QuickstartPageProps {
  currentPage: string
  onNavigate: (page: string) => void
  onBack: () => void
}

export default function QuickstartPage({ currentPage, onNavigate, onBack }: QuickstartPageProps) {
  return (
    <DocsLayout
      title="Quickstart"
      description="Create your first Arc diagram in under 5 minutes."
      badge="Getting Started"
      badgeColor="teal"
      sections={sections}
      currentPage={currentPage}
      onNavigate={onNavigate}
      onBack={onBack}
      ogImage="/og-docs-quickstart.png"
    >
      <h2 id="install">Installation</h2>
      <p>
        Install the Arc player from npm. It's a lightweight React component with no external dependencies besides Lucide icons.
      </p>

      <CodeBlock
        language="bash"
        filename="terminal"
        code={`# Install the Arc player
npm install @arach/arc

# Or use the visual editor
npx @arach/arc-editor`}
      />

      <h2 id="create-diagram">Create a Diagram</h2>
      <p>
        Create a new file for your diagram configuration:
      </p>

      <CodeBlock
        language="typescript"
        filename="src/diagrams/my-system.diagram.ts"
        code={`import type { ArcDiagramData } from '@arach/arc'

const diagram: ArcDiagramData = {
  id: 'MY.SYSTEM.001',
  layout: { width: 600, height: 300 },

  nodes: {
    frontend: { x: 50,  y: 100, size: 'm' },
    backend:  { x: 250, y: 100, size: 'm' },
    database: { x: 450, y: 100, size: 'm' },
  },

  nodeData: {
    frontend: { icon: 'Monitor',  name: 'Frontend', color: 'violet' },
    backend:  { icon: 'Server',   name: 'Backend',  color: 'emerald' },
    database: { icon: 'Database', name: 'Database', color: 'blue' },
  },

  connectors: [
    { from: 'frontend', to: 'backend',  fromAnchor: 'right', toAnchor: 'left', style: 'api' },
    { from: 'backend',  to: 'database', fromAnchor: 'right', toAnchor: 'left', style: 'db' },
  ],

  connectorStyles: {
    api: { color: 'violet', strokeWidth: 2, label: 'REST' },
    db:  { color: 'blue',   strokeWidth: 2, label: 'SQL' },
  },
}

export default diagram`}
      />

      <h2 id="render">Render the Diagram</h2>
      <p>
        Import and render your diagram using the ArcDiagram component:
      </p>

      <CodeBlock
        language="tsx"
        filename="src/pages/ArchitecturePage.tsx"
        code={`import { ArcDiagram } from '@arach/arc'
import mySystemDiagram from '../diagrams/my-system.diagram'

function ArchitecturePage() {
  return (
    <div className="p-8">
      <h1>System Architecture</h1>
      <ArcDiagram
        data={mySystemDiagram}
        mode="light"
        theme="default"
      />
    </div>
  )
}`}
      />

      <h2 id="customize">Customize Appearance</h2>
      <p>
        Switch between themes and modes to match your design:
      </p>

      <CodeBlock
        language="tsx"
        code={`// Light mode with warm editorial theme
<ArcDiagram data={diagram} mode="light" theme="warm" />

// Dark mode with cool technical theme
<ArcDiagram data={diagram} mode="dark" theme="cool" />

// Grayscale for print
<ArcDiagram data={diagram} mode="light" theme="mono" />`}
        showLineNumbers={false}
      />

      <p>
        You can also disable interactivity (zoom/pan) for static displays:
      </p>

      <CodeBlock
        language="tsx"
        code={`<ArcDiagram data={diagram} interactive={false} />`}
        showLineNumbers={false}
      />

      <h2 id="next-steps">Next Steps</h2>
      <p>
        Now that you have a basic diagram, explore the full format and styling options:
      </p>

      <div className="space-y-3 not-prose">
        <button
          onClick={() => onNavigate('diagram-format')}
          className="group w-full flex items-center justify-between p-5 rounded-2xl transition-all text-left"
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            border: '1px solid rgba(16, 21, 24, 0.12)',
            boxShadow: '0 10px 24px rgba(16, 23, 32, 0.1)',
          }}
        >
          <div>
            <span className="font-semibold" style={{ color: '#101518' }}>
              Diagram Format
            </span>
            <p className="text-sm mt-1" style={{ color: '#5c676c' }}>
              Full reference for nodes, connectors, and styles
            </p>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all" style={{ color: '#9ca3af' }} />
        </button>

        <button
          onClick={() => onNavigate('themes')}
          className="group w-full flex items-center justify-between p-5 rounded-2xl transition-all text-left"
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            border: '1px solid rgba(16, 21, 24, 0.12)',
            boxShadow: '0 10px 24px rgba(16, 23, 32, 0.1)',
          }}
        >
          <div>
            <span className="font-semibold" style={{ color: '#101518' }}>
              Themes
            </span>
            <p className="text-sm mt-1" style={{ color: '#5c676c' }}>
              Color palettes and visual treatments
            </p>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all" style={{ color: '#9ca3af' }} />
        </button>

        <Link
          to="/editor"
          className="group w-full flex items-center justify-between p-5 rounded-2xl transition-all"
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            border: '1px solid rgba(16, 21, 24, 0.12)',
            boxShadow: '0 10px 24px rgba(16, 23, 32, 0.1)',
          }}
        >
          <div>
            <span className="font-semibold" style={{ color: '#101518' }}>
              Try the Editor
            </span>
            <p className="text-sm mt-1" style={{ color: '#5c676c' }}>
              Visual editor with real-time preview
            </p>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all" style={{ color: '#9ca3af' }} />
        </Link>
      </div>
    </DocsLayout>
  )
}
