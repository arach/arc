import { Link } from 'react-router-dom'
import { ArcDiagram, type ArcDiagramData } from '@arach/arc'
import { useMeta } from '../hooks/useMeta'
import '../landing-technical.css'

// The pipeline diagram rendered in section 02 — the real ArcDiagram component.
const archDiagram: ArcDiagramData = {
  id: 'arc.arch.001',
  layout: { width: 760, height: 372 },
  nodes: {
    editor:    { x: 18,  y: 36,  size: 'm' },
    templates: { x: 18,  y: 210, size: 'm' },
    model:     { x: 300, y: 128, size: 'l' },
    exporters: { x: 300, y: 262, size: 'm' },
    docs:      { x: 556, y: 128, size: 'm' },
  },
  nodeData: {
    editor:    { icon: 'Monitor',  name: 'Editor',        subtitle: 'Canvas UI',  description: 'Drag, connect, style.',      color: 'blue' },
    templates: { icon: 'Grid3X3',  name: 'Templates',     subtitle: 'Themes',     description: 'Palettes, sizes, presets.',  color: 'amber' },
    model:     { icon: 'Layers',   name: 'Diagram Model', subtitle: 'JSON / TS',  description: 'Typed, diffable state.',     color: 'violet' },
    exporters: { icon: 'Upload',   name: 'Exporters',     subtitle: 'SVG / PNG',  description: 'Outputs for docs & decks.',  color: 'emerald' },
    docs:      { icon: 'FileCode', name: 'Docs',          subtitle: 'Apps',       description: 'Embed anywhere.',            color: 'sky' },
  },
  connectors: [
    { from: 'editor',    to: 'model',     fromAnchor: 'right',  toAnchor: 'left', style: 'diagram' },
    { from: 'templates', to: 'model',     fromAnchor: 'right',  toAnchor: 'left', style: 'themes' },
    { from: 'model',     to: 'docs',      fromAnchor: 'right',  toAnchor: 'left', style: 'publish' },
    { from: 'model',     to: 'exporters', fromAnchor: 'bottom', toAnchor: 'top',  style: 'export' },
  ],
  connectorStyles: {
    diagram: { color: 'blue',    strokeWidth: 2, label: 'diagram' },
    themes:  { color: 'amber',   strokeWidth: 2, label: 'themes' },
    publish: { color: 'sky',     strokeWidth: 2, label: 'publish' },
    export:  { color: 'emerald', strokeWidth: 2, label: 'export' },
  },
}

const features = [
  { n: '01', h: 'Design with confidence', p: 'A real canvas for nodes, connections, groups, and images.' },
  { n: '02', h: 'Ship declarative outputs', p: 'Export configs you can lint, review, and run in CI.' },
  { n: '03', h: 'Templates that scale', p: 'Curated themes and consistent styling across teams.' },
  { n: '04', h: 'Share the story', p: 'SVG / PNG exports for decks and living docs.' },
]

const docs = [
  { n: 'DOC.01', h: 'Introduction to Arc', p: 'What it is and the problem it solves.', to: '/docs/overview' },
  { n: 'DOC.02', h: 'Get up and running', p: 'Install, import, render your first diagram.', to: '/docs/quickstart' },
  { n: 'DOC.03', h: 'Data structure reference', p: 'Nodes, connectors, layout, and theming.', to: '/docs/diagram-format' },
  { n: 'DOC.04', h: 'Color palettes', p: 'default · warm · cool · mono, light & dark.', to: '/docs/themes' },
]

type LandingPageProps = { onLaunchEditor: () => void }

export default function LandingPage({ onLaunchEditor }: LandingPageProps) {
  useMeta({
    title: 'Arc | Architecture diagrams that live in your codebase',
    description: 'Arc renders architecture diagrams from a typed, diffable config — shipping the picture of your system in code, in docs, and in the repo.',
    image: '/og-landing.png',
    url: '/',
  })

  return (
    <div className="tl-root">
      <div className="tl-shell">
        {/* TOP BAR */}
        <header className="tl-header">
          <div className="tl-brand">
            <span className="tl-brand-dot" aria-hidden="true" />
            <span className="tl-brand-name">Arc</span>
            <span className="tl-brand-ver">v0.4.1</span>
          </div>
          <nav className="tl-nav">
            <a href="#why">WHY ARC</a>
            <a href="#pipeline">ARCHITECTURE</a>
            <Link to="/docs">DOCS</Link>
            <a className="tl-nav-accent" href="https://github.com/arach/arc" target="_blank" rel="noopener noreferrer">GITHUB ↗</a>
          </nav>
        </header>

        {/* HERO */}
        <section className="tl-hero">
          <div>
            <div className="tl-eyebrow">// ARCHITECTURE-AS-DATA</div>
            <h1 className="tl-h1">Diagrams that live where your system does.</h1>
            <p className="tl-lead">
              Arc renders architecture diagrams from a typed, diffable config — so the picture of your
              system ships in code, in docs, and in the repo. Never stranded in a stale slide again.
            </p>
            <div className="tl-actions">
              <button type="button" className="tl-btn tl-btn-primary" onClick={onLaunchEditor}>Launch the editor →</button>
              <Link className="tl-btn tl-btn-ghost" to="/docs">Read the docs</Link>
            </div>
            <div className="tl-specbar">
              <span>REACT</span>
              <span>TYPESCRIPT</span>
              <span>SVG / PNG EXPORT</span>
              <span>ZERO RUNTIME DEPS</span>
            </div>
          </div>

          {/* hero spec card */}
          <div className="tl-card">
            <div className="tl-card-bar">
              <div className="tl-dots"><span /><span /><span /></div>
              <span className="tl-card-name">system.arc.ts</span>
            </div>
            <pre className="tl-code">
<span className="tl-c-comment">// the diagram is the source</span>{'\n'}
<span className="tl-c-kw">const</span> system = {'{\n'}
{'  nodes: { editor, model, exporters },\n'}
{'  connectors: [\n'}
{'    { from: '}<span className="tl-c-str">'editor'</span>{', to: '}<span className="tl-c-str">'model'</span>{' },\n'}
{'    { from: '}<span className="tl-c-str">'model'</span>{',  to: '}<span className="tl-c-str">'exporters'</span>{' },\n'}
{'  ],\n'}
{'  theme: '}<span className="tl-c-str">'cool'</span>{',\n'}
{'}\n'}
<span className="tl-c-comment">// → render · diff · export</span>
            </pre>
          </div>
        </section>

        {/* TICK RULER */}
        <div className="tl-ruler" aria-hidden="true" />

        {/* WHY */}
        <section id="why" className="tl-why">
          <div>
            <div className="tl-tag">// 01 — WHY ARC EXISTS</div>
            <h2 className="tl-h2" style={{ marginBottom: 18 }}>Architecture diagrams usually die in slide decks.</h2>
            <p className="tl-section-p">
              Arc keeps the diagram in the same place as the product: in code, in docs, and in the repo —
              so it stays true as the system changes.
            </p>
          </div>
          <div className="tl-feature-grid">
            {features.map((f) => (
              <div className="tl-feature" key={f.n}>
                <div className="tl-feature-n">{f.n}</div>
                <div className="tl-feature-h">{f.h}</div>
                <div className="tl-feature-p">{f.p}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PIPELINE / DIAGRAM */}
        <section id="pipeline" className="tl-section">
          <div className="tl-pipeline-head">
            <div>
              <div className="tl-tag">// 02 — THE PIPELINE</div>
              <h2 className="tl-h2">From editor to everywhere.</h2>
            </div>
            <div className="tl-pipeline-id">ARC.ARCH.001<br />editor → model → exporters</div>
          </div>
          <div className="tl-diagram-card">
            <div className="tl-diagram-mount">
              <ArcDiagram
                data={archDiagram}
                mode="light"
                theme="cool"
                defaultZoom="fit"
                maxFitZoom={1}
                interactive={false}
                hoverEffects={false}
                label="arc.arch.001"
              />
            </div>
          </div>
        </section>

        {/* DOCS */}
        <section id="docs" className="tl-section">
          <div className="tl-tag">// 03 — DOCUMENTATION</div>
          <h2 className="tl-h2" style={{ marginBottom: 28 }}>Start reading.</h2>
          <div className="tl-doc-grid">
            {docs.map((d) => (
              <Link className="tl-doc" to={d.to} key={d.n}>
                <div className="tl-doc-n">{d.n}</div>
                <div className="tl-doc-h">{d.h}</div>
                <div className="tl-doc-p">{d.p}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="tl-cta">
          <div className="tl-cta-card">
            <div>
              <div className="tl-eyebrow" style={{ marginBottom: 16 }}>// 04 — GET STARTED</div>
              <h2 className="tl-h2" style={{ fontSize: 34, marginBottom: 14 }}>Ready to share the system story?</h2>
              <p className="tl-section-p" style={{ maxWidth: '34em', marginBottom: 28 }}>
                Open the editor, design a diagram, and export it to the docs. Arc keeps diagrams living
                alongside your codebase.
              </p>
              <div className="tl-actions">
                <button type="button" className="tl-btn tl-btn-primary" onClick={onLaunchEditor}>Launch the editor →</button>
                <a className="tl-btn tl-btn-ghost" href="#why">Back to top ↑</a>
              </div>
            </div>
            <div className="tl-specs">
              <div className="tl-specs-h">SPECS</div>
              <div>install&nbsp;&nbsp;<b>npm i @arach/arc</b></div>
              <div>bundle&nbsp;&nbsp;<b>~28kb gz</b></div>
              <div>render&nbsp;&nbsp;<b>SSR · client</b></div>
              <div>export&nbsp;&nbsp;<b>SVG · PNG</b></div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="tl-footer">
          <span>Arc — architecture that stays up to date.</span>
          <span>Designed for Git-friendly, declarative diagrams · v0.4.1</span>
        </footer>
      </div>
    </div>
  )
}
