import { useState } from 'react'
import { Link } from 'react-router-dom'
import ArcDiagram, { type ThemeId } from './ArcDiagram'
import ArcArchitectureNext from './ArcArchitectureNext'
import architectureDiagram from './diagrams/architecture.diagram'
import { getThemeList } from '../utils/themes'
import { useMeta } from '../hooks/useMeta'

const schemaReference = `interface ArcDiagramData {
  id?: string                    // Unique diagram identifier
  layout: {
    width: number               // Canvas width in pixels
    height: number              // Canvas height in pixels
  }
  nodes: Record<string, {
    x: number                   // X position
    y: number                   // Y position
    size: 's' | 'm' | 'l'       // Node size variant
  }>
  nodeData: Record<string, {
    icon: LucideIconName        // Icon from lucide-react
    name: string                // Primary label
    subtitle?: string           // Secondary label
    color: DiagramColor         // Accent color
  }>
  connectors: Array<{
    from: string                // Source node ID
    to: string                  // Target node ID
    fromAnchor: AnchorPosition  // left | right | top | bottom
    toAnchor: AnchorPosition    // Connection endpoint
    style: string               // Reference to connectorStyles
  }>
  connectorStyles?: Record<string, {
    color: DiagramColor         // Line color
    strokeWidth: number         // Line thickness (1-4)
    label?: string              // Optional label on line
    dashed?: boolean            // Dashed line style
  }>
}`

const architectureMarkup = `const diagram: ArcDiagramData = {
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
    editor:    { icon: 'Monitor',  name: 'Arc Editor',    subtitle: 'Canvas UI',      color: 'violet' },
    templates: { icon: 'Grid3X3',  name: 'Templates',     subtitle: 'Themes',         color: 'amber' },
    model:     { icon: 'Layers',   name: 'Diagram Model', subtitle: 'JSON / TS',      color: 'blue' },
    exporters: { icon: 'Upload',   name: 'Exporters',     subtitle: 'SVG / PNG / TS', color: 'emerald' },
    docs:      { icon: 'FileCode', name: 'Docs + Apps',   subtitle: 'Consumers',      color: 'zinc' },
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
}`

function highlightCode(code: string, isSchema = false): string {
  if (isSchema) {
    return code
      // Comments first (preserve them)
      .replace(/(\/\/.*)/g, '<span class="hl-comment">$1</span>')
      // Keywords
      .replace(/\b(interface|type|string|number|boolean|Array|Record)\b/g, '<span class="hl-keyword">$1</span>')
      // Type names (capitalized words not followed by colon)
      .replace(/\b([A-Z][a-zA-Z]+)(?!:)/g, '<span class="hl-type">$1</span>')
      // Properties (word followed by optional ? and colon)
      .replace(/(\w+)(\??:)/g, '<span class="hl-property">$1</span>$2')
      // String literals
      .replace(/'([^']*)'/g, '<span class="hl-string">\'$1\'</span>')
  }
  return code
    // Properties first (word followed by colon) - this captures 'from:', 'to:', etc.
    .replace(/(\w+)(\s*:)/g, '<span class="hl-property">$1</span>$2')
    // Then keywords (only at start of line or after specific contexts)
    .replace(/^(\s*)(const|let|var|type)\b/gm, '$1<span class="hl-keyword">$2</span>')
    // Strings
    .replace(/'([^']*)'/g, '<span class="hl-string">\'$1\'</span>')
    // Numbers
    .replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>')
    // Comments
    .replace(/(\/\/.*)/g, '<span class="hl-comment">$1</span>')
    // Type annotation
    .replace(/: <span class="hl-property">ArcDiagramData<\/span>/g, ': <span class="hl-type">ArcDiagramData</span>')
}

function DiagramShowcase() {
  const [view, setView] = useState<'diagram' | 'source'>('diagram')
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [theme, setTheme] = useState<ThemeId>('default')
  const themes = getThemeList()

  return (
    <div className="arc-diagram-shell">
      <div className="arc-diagram-full">
        <div className="arc-view-controls">
          <div className="arc-view-toggle">
            <button
              className={`arc-view-btn ${view === 'diagram' ? 'active' : ''}`}
              onClick={() => setView('diagram')}
            >
              Diagram
            </button>
            <button
              className={`arc-view-btn ${view === 'source' ? 'active' : ''}`}
              onClick={() => setView('source')}
            >
              Source
            </button>
          </div>
          {view === 'diagram' && (
            <div className="arc-controls-right">
              <div className="arc-theme-selector">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    className={`arc-theme-chip ${theme === t.id ? 'active' : ''}`}
                    onClick={() => setTheme(t.id as ThemeId)}
                    title={t.description}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <div className="arc-theme-toggle">
                <button
                  className={`arc-theme-btn ${mode === 'light' ? 'active' : ''}`}
                  onClick={() => setMode('light')}
                  title="Light mode"
                >
                  ☀
                </button>
                <button
                  className={`arc-theme-btn ${mode === 'dark' ? 'active' : ''}`}
                  onClick={() => setMode('dark')}
                  title="Dark mode"
                >
                  ☾
                </button>
              </div>
            </div>
          )}
        </div>
        {view === 'diagram' ? (
          <div className="arc-diagram-scroll">
            <ArcDiagram data={architectureDiagram} mode={mode} theme={theme} className="min-w-[860px]" />
          </div>
        ) : (
          <div className="arc-showcase-code" style={{ margin: 0, borderRadius: '16px' }}>
            <div className="arc-showcase-code-header">
              <span className="arc-showcase-dot arc-showcase-dot-red" />
              <span className="arc-showcase-dot arc-showcase-dot-yellow" />
              <span className="arc-showcase-dot arc-showcase-dot-green" />
              <span className="arc-showcase-filename">architecture.diagram.ts</span>
            </div>
            <pre className="arc-showcase-pre">
              <code dangerouslySetInnerHTML={{ __html: highlightCode(architectureMarkup) }} />
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

type LandingPageProps = {
  onLaunchEditor: () => void
}

export default function LandingPage({ onLaunchEditor }: LandingPageProps) {
  // Set page-specific meta tags
  useMeta({
    title: 'Arc | Visual Diagram Editor',
    description: 'Design architecture diagrams visually. Drag-and-drop interface with clean JSON export.',
    image: '/og-landing.png',
    url: '/',
  })

  return (
    <div className="arc-landing">
      <div className="arc-shell">
        <header className="arc-topbar">
          <div className="arc-topbar-inner">
            <div className="arc-brand">
              <span className="arc-brand-mark" aria-hidden="true" />
              <span className="arc-brand-name">Arc</span>
              <span className="arc-brand-sub">Diagram Studio</span>
            </div>
            <nav className="arc-nav">
              <a href="#overview">Why Arc</a>
              <a href="#architecture">Architecture</a>
              <Link to="/docs">Docs</Link>
            </nav>
            <div className="arc-topbar-actions">
              <span className="arc-chip">Declarative</span>
              <button type="button" className="arc-button" onClick={onLaunchEditor}>
                Launch Editor
              </button>
            </div>
          </div>
        </header>

        <section className="arc-hero" id="overview">
          <div className="arc-hero-grid">
            <div className="arc-reveal">
              <div className="arc-eyebrow">Architecture, by design</div>
              <h1>Arc makes architecture diagrams readable, versionable, and ready for docs.</h1>
              <p>
                Arc is a visual editor that outputs a clean, declarative model. Design the system
                once, export to TypeScript or JSON, and reuse it across documentation sites,
                onboarding decks, and product briefs.
              </p>
              <div className="arc-hero-actions">
                <button type="button" className="arc-button" onClick={onLaunchEditor}>
                  Try the live editor
                </button>
                <Link className="arc-button secondary" to="/docs">
                  Read the intro docs
                </Link>
              </div>
            </div>
            <div className="arc-hero-card arc-reveal arc-delay-1">
              <div className="arc-hero-stat">
                <span>Design once</span>
                <strong>Export everywhere</strong>
              </div>
              <div className="arc-hero-stat">
                <span>Declarative</span>
                <strong>Diff-friendly configs</strong>
              </div>
              <div className="arc-hero-stat">
                <span>Ship-ready</span>
                <strong>SVG, PNG, JSON, TS</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="arc-quickstart">
          <div className="arc-quickstart-inner">
            <div className="arc-quickstart-text">
              <h2>Get started in seconds</h2>
              <p>Install Arc and start creating diagrams</p>
            </div>
            <div className="arc-quickstart-install">
              <code>npx @arach/arc init</code>
              <button type="button" className="arc-copy-btn" onClick={() => navigator.clipboard.writeText('npx @arach/arc init')}>
                Copy
              </button>
            </div>
          </div>
        </section>

        <section className="arc-section">
          <div className="arc-section-header">
            <h2>Why Arc exists</h2>
            <p>
              Architecture diagrams usually die in slide decks. Arc keeps the diagram in the same
              place as the product: in code, in docs, and in the repo.
            </p>
          </div>
          <div className="arc-grid">
            <div className="arc-card arc-reveal">
              <h3>Design with confidence</h3>
              <p>Use the canvas to place nodes, connections, groups, and images quickly.</p>
            </div>
            <div className="arc-card arc-reveal arc-delay-1">
              <h3>Ship declarative outputs</h3>
              <p>Export configs you can lint, review, and reuse in CI-driven docs.</p>
            </div>
            <div className="arc-card arc-reveal arc-delay-2">
              <h3>Templates that scale</h3>
              <p>Start from curated templates and keep styling consistent across teams.</p>
            </div>
            <div className="arc-card arc-reveal arc-delay-3">
              <h3>Share the story</h3>
              <p>Generate SVG/PNG exports for decks and live docs in a single click.</p>
            </div>
          </div>
        </section>

        <section className="arc-section" id="architecture">
          <div className="arc-section-header">
            <h2>Arc architecture at a glance</h2>
            <p>
              Arc keeps the editor experience separate from the model and exporters. That makes it
              easy to maintain and makes outputs reliable for documentation pipelines.
            </p>
          </div>
          <DiagramShowcase />
          <div className="arc-diagram-details arc-reveal arc-delay-1">
            <div className="arc-grid">
              <div className="arc-card">
                <h3>Editor surface</h3>
                <p>Canvas, layers, and properties stay fast with a single reducer.</p>
              </div>
              <div className="arc-card">
                <h3>Diagram model</h3>
                <p>All nodes, connectors, and styles live in one serialized object.</p>
              </div>
              <div className="arc-card">
                <h3>Export pipeline</h3>
                <p>Generate shareable configs or image exports for docs and decks.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="arc-section" id="architecture-next">
          <div className="arc-section-header">
            <h2>Declarative by design</h2>
            <p>
              Every diagram is a typed data structure. Edit it visually or in code—the result
              is always portable, versionable, and ready for your pipeline.
            </p>
          </div>
          <ArcArchitectureNext />
        </section>

        <section className="arc-section">
          <div className="arc-section-header">
            <h2>Human-readable, agent-friendly</h2>
            <p>
              The schema is designed for humans to review and agents to write. Keep diagrams in Git,
              generate them programmatically, and consume them in any UI.
            </p>
          </div>
          <div className="arc-showcase-code" style={{ margin: 0, borderRadius: '16px' }}>
            <div className="arc-showcase-code-header">
              <span className="arc-showcase-dot arc-showcase-dot-red" />
              <span className="arc-showcase-dot arc-showcase-dot-yellow" />
              <span className="arc-showcase-dot arc-showcase-dot-green" />
              <span className="arc-showcase-filename">types.d.ts</span>
            </div>
            <pre className="arc-showcase-pre">
              <code dangerouslySetInnerHTML={{ __html: highlightCode(schemaReference, true) }} />
            </pre>
          </div>
        </section>

        <section className="arc-section" id="docs">
          <div className="arc-section-header">
            <h2>Documentation</h2>
            <p>Start here for the mental model, then dive deeper into the architecture.</p>
          </div>
          <div className="arc-doc-grid">
            <Link className="arc-doc-card" to="/docs/overview">
              <strong>Overview</strong>
              <span>Introduction to Arc</span>
            </Link>
            <Link className="arc-doc-card" to="/docs/quickstart">
              <strong>Quickstart</strong>
              <span>Get up and running</span>
            </Link>
            <Link className="arc-doc-card" to="/docs/diagram-format">
              <strong>Diagram Format</strong>
              <span>Data structure reference</span>
            </Link>
            <Link className="arc-doc-card" to="/docs/themes">
              <strong>Themes</strong>
              <span>Color palettes</span>
            </Link>
          </div>
        </section>

        <section className="arc-section">
          <div className="arc-section-header">
            <h2>Ready to share the system story?</h2>
            <p>
              Open the editor, design a diagram, and export it to the docs. Arc keeps diagrams
              living alongside your codebase.
            </p>
          </div>
          <div className="arc-hero-actions">
            <button type="button" className="arc-button" onClick={onLaunchEditor}>
              Launch the editor
            </button>
            <a className="arc-button secondary" href="#overview">
              Back to top
            </a>
          </div>
        </section>

        <footer className="arc-footer">
          <span>Arc is built for teams who want architecture that stays up to date.</span>
          <span>Designed for Git-friendly, declarative diagrams.</span>
        </footer>
      </div>
    </div>
  )
}
