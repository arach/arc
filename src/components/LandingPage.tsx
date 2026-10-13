import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import ArcDiagram, { type ArcDiagramData } from './ArcDiagram'
import { version } from '../../package.json'
import { useMeta } from '../hooks/useMeta'
import ArcMark from './ArcMark'
import '../landing-technical.css'

// Below-the-fold showcases load on demand — the mermaid engine and the second
// ArcDiagram mount aren't worth blocking first paint on.
const IsoPlateShowcase = lazy(() => import('./IsoPlateShowcase'))
const SequenceEngineShowcase = lazy(() => import('./SequenceEngineShowcase'))

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
  // Packet flows keep the plate in motion — the same `flows` feature used by
  // animated exports, looping indefinitely on the landing.
  flows: [
    { id: 'author',  legs: [{ from: 'editor',    to: 'model' }],     marker: 'packet', color: 'blue',    duration: 3.2, repeat: 'indefinite' },
    { id: 'style',   legs: [{ from: 'templates', to: 'model' }],     marker: 'packet', color: 'amber',   duration: 3.2, delay: 1.1, repeat: 'indefinite' },
    { id: 'publish', legs: [{ from: 'model',     to: 'docs' }],      marker: 'packet', color: 'sky',     duration: 3.2, delay: 2.0, repeat: 'indefinite' },
    { id: 'export',  legs: [{ from: 'model',     to: 'exporters' }], marker: 'packet', color: 'emerald', duration: 3.2, delay: 2.7, repeat: 'indefinite' },
  ],
  // Guided views turn the plate into a three-chapter walkthrough — the same
  // `views` feature the docs describe, dogfooded on the landing itself.
  views: [
    {
      id: 'overview',
      title: 'Overview',
      nodes: ['editor', 'templates', 'model', 'exporters', 'docs'],
      caption: 'The whole pipeline on one plate.',
    },
    {
      id: 'authoring',
      title: 'Authoring',
      nodes: ['editor', 'templates', 'model'],
      connectors: [
        { from: 'editor', to: 'model' },
        { from: 'templates', to: 'model' },
      ],
      caption: 'The canvas and its themes feed one typed model.',
    },
    {
      id: 'publishing',
      title: 'Publishing',
      nodes: ['model', 'docs', 'exporters'],
      connectors: [
        { from: 'model', to: 'docs' },
        { from: 'model', to: 'exporters' },
      ],
      caption: 'The same model publishes to docs and static exports.',
    },
  ],
}

// The pipeline plate ships to the editor verbatim through the #data= handoff
// the editor already parses — 'edit this diagram' is one link, not an export.
const editorHandoff = `/editor#data=${btoa(JSON.stringify({ ...archDiagram, _theme: 'cool', _mode: 'light' }))}`

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
  { n: 'GUIDE.01', h: 'Guided views', p: 'Ordered chapters and deep-linked walkthroughs.', to: '/docs/views' },
  { n: 'GUIDE.02', h: 'Diagram diffs', p: 'Added, removed, moved, changed — rendered.', to: '/docs/diff' },
  { n: 'EXP.01', h: 'Connection pool explainer', p: 'A live model of borrow, wait, reuse.', to: '/examples/connection-pool' },
  { n: 'EXP.02', h: 'Player showcase', p: 'Every renderer option, live on the canvas.', to: '/showcase' },
  { n: 'GUIDE.03', h: 'Field guide', p: 'How the architecture-diagram tools compare.', to: '/architecture-diagram-software' },
  { n: 'AGENT.01', h: 'MCP server', p: 'Give agents tools to validate, lay out, and render.', to: '/mcp' },
  { n: 'AGENT.02', h: 'Agent skills', p: 'Reusable diagram authoring and repair playbooks.', to: '/skills' },
]

const loopBeats = [
  { n: 'NUDGE', h: 'Updated in the loop', p: 'A changed file claims a diagram — the agent touches the *.arc.json in the same commit it edits the code.' },
  { n: 'CHECK', h: 'Verified mechanically', p: 'arc check returns coded diagnostics with supportedFixes — an instruction list to converge on, not output to parse.' },
  { n: 'DIFF', h: 'Reviewed as a delta', p: 'arc diff renders added, removed, moved, changed next to the code diff — drift becomes a review artifact.' },
]

type LandingPageProps = { onLaunchEditor: () => void }

export default function LandingPage({ onLaunchEditor }: LandingPageProps) {
  useMeta({
    title: 'Arc | Diagrams as code',
    description: 'Arc renders architecture diagrams from a typed, diffable config — shipping the picture of your system in code, in docs, and in the repo.',
    image: '/og-landing.png',
    url: '/',
  })

  return (
    <div className="tl-root">
      <div className="tl-shell">
        {/* TOP BAR */}
        <header className="tl-header">
          <div className="tl-brand-cluster">
            <Link className="tl-brand" to="/" aria-label="Arc home">
              <ArcMark className="tl-brand-mark" />
              <span className="tl-brand-lockup">
                <span className="tl-brand-name">Arc</span>
                <span className="tl-brand-descriptor">diagrams as code</span>
              </span>
            </Link>
            <span className="tl-brand-ver">v{version}</span>
          </div>
          <nav className="tl-nav">
            <a href="#why">WHY ARC</a>
            <a href="#pipeline">ARCHITECTURE</a>
            <a href="#isometric">ISOMETRIC</a>
            <a href="#sequence">SEQUENCE</a>
            <Link to="/docs">DOCS</Link>
            <a className="tl-nav-accent" href="https://github.com/arach/arc" target="_blank" rel="noopener noreferrer">GITHUB ↗</a>
          </nav>
        </header>

        {/* HERO */}
        <section className="tl-hero">
          <div>
            <div className="tl-eyebrow">// DIAGRAMS-AS-CODE</div>
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
                showViews
                label="arc.arch.001"
              />
            </div>
          </div>
          <div className="tl-sequence-links">
            <Link to={editorHandoff}>Edit this diagram in the editor →</Link>
            <Link to="/docs/views">How the chapter rail works →</Link>
          </div>
        </section>

        {/* ISOMETRIC PLATES */}
        <section id="isometric" className="tl-section">
          <div className="tl-pipeline-head">
            <div>
              <div className="tl-tag">// 03 — ISOMETRIC VIEWS</div>
              <h2 className="tl-h2">The same model, on the drafting table.</h2>
              <p className="tl-section-p" style={{ marginTop: 16 }}>
                One typed config in isometric view — toggle the ink between sepia
                blueprint and cyanotype.
              </p>
            </div>
            <div className="tl-pipeline-id">ARC.ARCH.001<br />viewMode: isometric</div>
          </div>
          <Suspense fallback={<div style={{ minHeight: 320 }} />}>
            <IsoPlateShowcase data={archDiagram} />
          </Suspense>
        </section>

        {/* NATIVE MERMAID SEQUENCE */}
        <section id="sequence" className="tl-section tl-sequence-section">
          <div className="tl-sequence-head">
            <div>
              <div className="tl-tag">// 04 — NATIVE MERMAID</div>
              <h2 className="tl-h2">Interaction, rendered in sequence.</h2>
              <p className="tl-section-p">
                Keep Mermaid as the reviewable source while Arc owns the typed interaction model,
                theme, renderer, and playback controls.
              </p>
            </div>
            <div className="tl-pipeline-id">MERMAID.SEQUENCE.001<br />source → model → player</div>
          </div>
          <Suspense fallback={<div style={{ minHeight: 320 }} />}>
            <SequenceEngineShowcase showSource />
          </Suspense>
          <div className="tl-sequence-links">
            <Link to="/blog/native-mermaid-sequences">Read the build note →</Link>
            <Link to="/docs/mermaid-sequences">Open the implementation guide →</Link>
          </div>
        </section>

        {/* AGENTIC LOOP */}
        <section id="agentic" className="tl-section">
          <div className="tl-pipeline-head">
            <div>
              <div className="tl-tag">// 05 — THE AGENTIC LOOP</div>
              <h2 className="tl-h2">Diagrams maintained by the agents that change the code.</h2>
              <p className="tl-section-p" style={{ marginTop: 16, maxWidth: '42em' }}>
                The author is a model now. Typed JSON, coded diagnostics, and structural
                diffs mean the agent that edits the system updates the picture in the
                same commit — and review can check that it did.
              </p>
            </div>
            <div className="tl-pipeline-id">AGENT.LOOP.001<br />edit → check → diff → review</div>
          </div>
          <div className="tl-feature-grid">
            {loopBeats.map((f) => (
              <div className="tl-feature" key={f.n}>
                <div className="tl-feature-n">{f.n}</div>
                <div className="tl-feature-h">{f.h}</div>
                <div className="tl-feature-p">{f.p}</div>
              </div>
            ))}
          </div>
          <div className="tl-sequence-links">
            <Link to="/docs/agentic-loop">Read the agentic loop →</Link>
            <Link to="/mcp">MCP tools for agents →</Link>
          </div>
        </section>

        {/* DOCS */}
        <section id="docs" className="tl-section">
          <div className="tl-tag">// 06 — DOCUMENTATION</div>
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
              <div className="tl-eyebrow" style={{ marginBottom: 16 }}>// 07 — GET STARTED</div>
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
              <div>version&nbsp;&nbsp;<b>v{version}</b></div>
              <div>install&nbsp;&nbsp;<b>npm i @arach/arc</b></div>
              <div>bundle&nbsp;&nbsp;<b>~28kb gz</b></div>
              <div>render&nbsp;&nbsp;<b>SSR · client</b></div>
              <div>export&nbsp;&nbsp;<b>SVG · PNG</b></div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="tl-footer">
          <span className="tl-footer-brand"><ArcMark />Arc — diagrams as code.</span>
          <span>Designed for Git-friendly, declarative diagrams · v{version}</span>
        </footer>
      </div>
    </div>
  )
}
