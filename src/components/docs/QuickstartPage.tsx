import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import DocsLayout, { type DocSection } from './DocsLayout'

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
      badgeColor="emerald"
      sections={sections}
      currentPage={currentPage}
      onNavigate={onNavigate}
      onBack={onBack}
    >
      <h2 id="install">Installation</h2>
      <p>
        Arc is a React component. Copy the <code>ArcDiagram.tsx</code> component and its
        dependencies into your project:
      </p>

      <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto">
        <code>{`# Required dependencies
pnpm add lucide-react

# Copy these files to your project:
# - src/components/ArcDiagram.tsx
# - src/utils/themes.ts`}</code>
      </pre>

      <h2 id="create-diagram">Create a Diagram</h2>
      <p>
        Create a new file for your diagram configuration:
      </p>

      <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{`// src/diagrams/my-system.diagram.ts
import type { ArcDiagramData } from '../components/ArcDiagram'

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

export default diagram`}</code>
      </pre>

      <h2 id="render">Render the Diagram</h2>
      <p>
        Import and render your diagram using the ArcDiagram component:
      </p>

      <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto">
        <code>{`import ArcDiagram from './components/ArcDiagram'
import mySystemDiagram from './diagrams/my-system.diagram'

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
}`}</code>
      </pre>

      <h2 id="customize">Customize Appearance</h2>
      <p>
        Switch between themes and modes to match your design:
      </p>

      <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto">
        <code>{`// Light mode with warm editorial theme
<ArcDiagram data={diagram} mode="light" theme="warm" />

// Dark mode with cool technical theme
<ArcDiagram data={diagram} mode="dark" theme="cool" />

// Grayscale for print
<ArcDiagram data={diagram} mode="light" theme="mono" />`}</code>
      </pre>

      <p>
        You can also disable interactivity (zoom/pan) for static displays:
      </p>

      <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto">
        <code>{`<ArcDiagram data={diagram} interactive={false} />`}</code>
      </pre>

      <h2 id="next-steps">Next Steps</h2>
      <p>
        Now that you have a basic diagram, explore the full format and styling options:
      </p>

      <div className="space-y-3 not-prose">
        <button
          onClick={() => onNavigate('diagram-format')}
          className="group w-full flex items-center justify-between p-4 rounded-lg border border-zinc-200 bg-white hover:border-violet-300 transition-colors"
        >
          <div>
            <span className="font-bold text-zinc-900 group-hover:text-violet-600 transition-colors">
              Diagram Format
            </span>
            <p className="text-sm text-zinc-600 mt-1">
              Full reference for nodes, connectors, and styles
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => onNavigate('themes')}
          className="group w-full flex items-center justify-between p-4 rounded-lg border border-zinc-200 bg-white hover:border-violet-300 transition-colors"
        >
          <div>
            <span className="font-bold text-zinc-900 group-hover:text-violet-600 transition-colors">
              Themes
            </span>
            <p className="text-sm text-zinc-600 mt-1">
              Color palettes and visual treatments
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
        </button>

        <Link
          to="/editor"
          className="group w-full flex items-center justify-between p-4 rounded-lg border border-zinc-200 bg-white hover:border-violet-300 transition-colors"
        >
          <div>
            <span className="font-bold text-zinc-900 group-hover:text-violet-600 transition-colors">
              Try the Editor
            </span>
            <p className="text-sm text-zinc-600 mt-1">
              Visual editor with real-time preview
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </DocsLayout>
  )
}
