import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Zap, Shield, Rabbit, Copy, Check, Github } from 'lucide-react'
import { ArcDiagram, type ThemeId, type ArcDiagramData } from '@arach/arc'
import ArcArchitectureNext from './ArcArchitectureNext'
import architectureDiagram from './diagrams/architecture.diagram'
import { getThemeList } from '@arach/arc'
import { useMeta } from '../hooks/useMeta'

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

const packageManagers: Record<PackageManager, { icon: typeof Package; command: string }> = {
  npm: { icon: Package, command: 'npx @arach/arc init' },
  pnpm: { icon: Zap, command: 'pnpm dlx @arach/arc init' },
  yarn: { icon: Shield, command: 'yarn dlx @arach/arc init' },
  bun: { icon: Rabbit, command: 'bunx @arach/arc init' },
}

const packageManagerOrder: PackageManager[] = ['npm', 'pnpm', 'yarn', 'bun']

// Hero diagram - system architecture example
const heroDiagram: ArcDiagramData = {
  id: 'ARC.HERO.001',
  layout: { width: 440, height: 240 },
  nodes: {
    app: { x: 20, y: 15, size: 's' },
    engine: { x: 20, y: 105, size: 's' },
    server: { x: 180, y: 15, size: 's' },
    cloud: { x: 180, y: 155, size: 's' },
    mobile: { x: 320, y: 15, size: 's' },
    watch: { x: 320, y: 105, size: 's' },
  },
  nodeData: {
    app: { icon: 'Monitor', name: 'App', color: 'violet' },
    engine: { icon: 'Cpu', name: 'Engine', color: 'blue' },
    server: { icon: 'Server', name: 'Server', color: 'amber' },
    cloud: { icon: 'Cloud', name: 'Cloud', color: 'sky' },
    mobile: { icon: 'Smartphone', name: 'Mobile', color: 'zinc' },
    watch: { icon: 'Watch', name: 'Watch', color: 'zinc' },
  },
  connectors: [
    { from: 'app', to: 'engine', fromAnchor: 'bottom', toAnchor: 'top', style: 'internal' },
    { from: 'app', to: 'server', fromAnchor: 'right', toAnchor: 'left', style: 'http' },
    { from: 'server', to: 'mobile', fromAnchor: 'right', toAnchor: 'left', style: 'api' },
    { from: 'mobile', to: 'watch', fromAnchor: 'bottom', toAnchor: 'top', style: 'sync' },
    { from: 'engine', to: 'cloud', fromAnchor: 'right', toAnchor: 'left', style: 'cloud' },
    { from: 'watch', to: 'cloud', fromAnchor: 'bottom', toAnchor: 'right', style: 'cloud', curve: 'natural' },
  ],
  connectorStyles: {
    internal: { color: 'violet', strokeWidth: 2, dashed: true },
    http: { color: 'amber', strokeWidth: 2, label: 'HTTP' },
    api: { color: 'sky', strokeWidth: 2 },
    sync: { color: 'zinc', strokeWidth: 1 },
    cloud: { color: 'sky', strokeWidth: 1, dashed: true },
  },
}

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
  const [pkgManager, setPkgManager] = useState<PackageManager>('npm')
  const [copied, setCopied] = useState(false)

  const copyCommand = async () => {
    await navigator.clipboard.writeText(packageManagers[pkgManager].command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
            </div>
            <nav className="arc-nav">
              <a href="#overview">Why Arc</a>
              <a href="#architecture">Architecture</a>
              <Link to="/docs">Docs</Link>
              <a href="https://github.com/arach/arc" target="_blank" rel="noopener noreferrer" className="arc-nav-github">
                <Github className="w-4 h-4" />
                <span>Star on GitHub</span>
              </a>
            </nav>
          </div>
        </header>

        <section className="arc-hero" id="overview">
          <h1 className="arc-hero-headline arc-reveal">Architecture diagrams that live in your codebase.</h1>
          <div className="arc-hero-grid">
            <div className="arc-hero-text arc-reveal arc-delay-1">
              <p>
                Declarative diagrams your AI agent can draft and you can refine visually.
                Export as TypeScript or JSON—versionable, reviewable, ready for docs.
              </p>
              <ul className="arc-hero-features">
                <li>Design once, render anywhere</li>
                <li>SVG, PNG, and JSON exports</li>
                <li>Git-friendly declarative format</li>
                <li>Let agents draft your diagrams and edit alongside them to get pixel perfect outputs</li>
              </ul>
              <div className="arc-hero-actions">
                <button type="button" className="arc-button" onClick={onLaunchEditor}>
                  Try Arc Editor
                </button>
                <Link className="arc-button secondary" to="/docs">
                  Docs
                </Link>
              </div>
            </div>
            <div className="arc-hero-visual arc-reveal arc-delay-1">
              <ArcDiagram data={heroDiagram} mode="light" theme="default" />
            </div>
          </div>
        </section>

        <section className="arc-why-section">
          <div className="arc-why-inner">
            <div className="arc-why-content">
              <h2>Why Arc exists</h2>
              <p>
                Architecture diagrams usually die in slide decks. Arc keeps the diagram in the same
                place as the product: in code, in docs, and in the repo.
              </p>
              <ul className="arc-why-list">
                <li><strong>Design with confidence</strong> — Canvas for nodes, connections, groups, and images</li>
                <li><strong>Ship declarative outputs</strong> — Export configs you can lint, review, and CI</li>
                <li><strong>Templates that scale</strong> — Curated themes, consistent styling across teams</li>
                <li><strong>Share the story</strong> — SVG/PNG exports for decks and live docs</li>
                <li><strong>Embed anywhere</strong> — Drop-in React component with zoom, pan, and infinite canvas</li>
              </ul>
            </div>
            <div className="arc-get-started">
              <h3>Get started in seconds</h3>
              <div className="arc-install">
                <div className="arc-install-tabs">
                  {packageManagerOrder.map((pm) => {
                    const Icon = packageManagers[pm].icon
                    return (
                      <button
                        key={pm}
                        type="button"
                        className={`arc-install-tab ${pkgManager === pm ? 'active' : ''}`}
                        onClick={() => setPkgManager(pm)}
                      >
                        <Icon className="arc-install-icon" />
                        <span>{pm.toUpperCase()}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="arc-install-command">
                  <code>{packageManagers[pkgManager].command}</code>
                  <button type="button" className="arc-install-copy" onClick={copyCommand}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="arc-architecture-section">
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
        </div>

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
