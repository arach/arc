import ArcDiagram from './ArcDiagram'
import ArcArchitectureNext from './ArcArchitectureNext'
import architectureDiagram from './diagrams/architecture.diagram'

const sampleConfig = `const diagram = {
  layout: { width: 1200, height: 700 },
  nodes: {
    api: { x: 80, y: 120, size: 'm' },
    web: { x: 360, y: 120, size: 'm' },
  },
  nodeData: {
    api: { name: 'API', icon: 'Server', color: 'emerald' },
    web: { name: 'Web App', icon: 'Monitor', color: 'violet' },
  },
  connectors: [
    { from: 'web', to: 'api', fromAnchor: 'right', toAnchor: 'left', style: 'http' },
  ],
}`

const architectureMarkup = `const diagram = ${JSON.stringify(architectureDiagram, null, 2)}`

type LandingPageProps = {
  onLaunchEditor: () => void
}

export default function LandingPage({ onLaunchEditor }: LandingPageProps) {
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
              <a href="#docs">Docs</a>
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
                <a className="arc-button secondary" href="#docs">
                  Read the intro docs
                </a>
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
          <div className="arc-diagram-shell">
            <div className="arc-diagram-full">
              <div className="arc-diagram-scroll">
                <ArcDiagram data={architectureDiagram} className="min-w-[960px]" />
              </div>
              <details className="arc-markup">
                <summary>View diagram markup</summary>
                <pre className="arc-code">
                  <code>{architectureMarkup}</code>
                </pre>
              </details>
            </div>
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
          </div>
        </section>

        <section className="arc-section" id="architecture-next">
          <div className="arc-section-header">
            <h2>Arc architecture, next</h2>
            <p>
              A complementary view of the same system: the core model sits in the middle while
              editors, templates, exporters, and automation orbit around it.
            </p>
          </div>
          <ArcArchitectureNext />
        </section>

        <section className="arc-section">
          <div className="arc-section-header">
            <h2>Declarative design, human-readable</h2>
            <p>
              The output is designed for review. Keep diagrams in Git, update them alongside code,
              and reuse them in any UI that consumes Arc configs.
            </p>
          </div>
          <pre className="arc-code">
            <code>{sampleConfig}</code>
          </pre>
        </section>

        <section className="arc-section" id="docs">
          <div className="arc-section-header">
            <h2>Introductory docs</h2>
            <p>Start here for the mental model, then dive deeper into the architecture.</p>
          </div>
          <div className="arc-doc-links">
            <a className="arc-doc-link" href="docs/intro.md">
              <div>
                <strong>Introduction to Arc</strong>
                <span>What it is, key concepts, and quickstart commands.</span>
              </div>
              <span>docs/intro.md</span>
            </a>
            <a className="arc-doc-link" href="docs/architecture/">
              <div>
                <strong>Architecture overview</strong>
                <span>State flow, major modules, and exporter responsibilities.</span>
              </div>
              <span>docs/architecture/</span>
            </a>
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
