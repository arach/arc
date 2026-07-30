import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Github } from 'lucide-react'
import SequenceEngineShowcase from '../SequenceEngineShowcase'
import { useMeta } from '../../hooks/useMeta'
import '../../blog.css'

export default function NativeMermaidSequencesPost() {
  useMeta({
    title: 'Mermaid in, Arc out | Arc',
    description: 'Why Arc built a native sequence engine instead of turning interactions into architecture boxes.',
    url: '/blog/native-mermaid-sequences',
  })

  return (
    <div className="arc-blog">
      <header className="arc-blog-nav">
        <Link to="/" className="arc-blog-brand" aria-label="Arc home">
          <span aria-hidden="true" /> Arc
        </Link>
        <nav>
          <Link to="/docs/mermaid-sequences">Sequence docs</Link>
          <a href="https://github.com/arach/arc" target="_blank" rel="noreferrer">
            <Github size={15} aria-hidden="true" /> GitHub
          </a>
        </nav>
      </header>

      <main>
        <article>
          <Link className="arc-blog-back" to="/">
            <ArrowLeft size={14} aria-hidden="true" /> Arc notes
          </Link>

          <header className="arc-blog-hero">
            <div className="arc-blog-kicker">Build note · Sequence engine</div>
            <h1>Mermaid in, Arc out.</h1>
            <p className="arc-blog-dek">
              Why we built a native sequence renderer instead of turning interactions into
              architecture boxes—or putting a prettier frame around Mermaid.js.
            </p>
            <div className="arc-blog-meta">
              <span>Arc team</span>
              <span>July 2026</span>
              <span>8 min read</span>
            </div>
          </header>

          <div className="arc-blog-prose arc-blog-prose--lead">
            <p>
              Architecture diagrams usually describe what exists. A sequence diagram describes
              what happens: who speaks, in what order, where a decision forks, and when a local
              operation becomes paid model work. Those are different stories, with different
              semantics.
            </p>
            <p>
              The tempting implementation is one universal graph—convert every participant and
              message into boxes and connectors, then let the existing renderer do the rest. It is
              also how sequence diagrams lose the thing that made them useful.
            </p>
          </div>

          <figure className="arc-blog-demo">
            <SequenceEngineShowcase showSource />
            <figcaption>
              This is the real renderer. Use the player controls to step through each message, or
              open Source to see the Mermaid text it parsed.
            </figcaption>
          </figure>

          <div className="arc-blog-prose">
            <h2>A diagram family deserves its own model</h2>
            <p>
              Arc's 2D engine is built around nodes, connectors, groups, and positions. Its
              isometric engine adds a spatial reading of system structure. Sequence needs
              participants, lifelines, ordered messages, notes, and fragments. So it gets a typed
              <code>ArcSequenceDocument</code>, not a lossy trip through <code>ArcDiagramData</code>.
            </p>

            <div className="arc-blog-pipeline" aria-label="Sequence rendering pipeline">
              <span>Mermaid source</span><i>→</i><span>Semantic document</span><i>→</i>
              <span>Pure layout</span><i>→</i><span>SVG parts</span><i>→</i><span>Player</span>
            </div>

            <p>
              Mermaid remains the canonical, reviewable source. Arc parses that source, chooses a
              family renderer from its registry, computes layout, and composes replaceable visual
              parts. The host can change participant headers, messages, notes, fragments, theme
              tokens, or domain accents without changing the sequence itself.
            </p>

            <h2>A player, not a screenshot</h2>
            <p>
              Sequence diagrams are read in time, so the presentation should help tell the story.
              The Arc sequence player can focus participants, zoom, enter fullscreen, and step
              through messages in authored order. In the Scout example, that makes the boundary
              between local coordination and delegated model work visible one message at a time.
            </p>
            <p>
              The colored cost notes in this demo are an explicit presentation choice. The host
              maps Scout note language to accents; Arc does not pretend to infer operational cost
              from arbitrary prose.
            </p>

            <aside className="arc-blog-callout">
              <span>Why not Mermaid.js?</span>
              <p>
                The goal is not grammar parity with a new coat of paint. It is an Arc-native model
                and rendering surface whose parts, interaction, and visual language are genuinely
                under product control.
              </p>
            </aside>

            <h2>What v1 means</h2>
            <p>
              This first native family supports the slice proven by the Scout interaction model:
              actors and participants, solid and dashed messages, notes, and <code>alt</code>/<code>else</code>
              fragments, in light and dark themes. Unsupported syntax produces diagnostics instead
              of being inventively redrawn as something else.
            </p>
            <p>
              It is not full Mermaid support. Native flowchart and state renderers are still
              separate future work. Activation bars, measured fit-to-container, a dedicated export
              API, and opening <code>.mmd</code> in the main editor are not shipped claims. Naming
              those boundaries is part of making the engine trustworthy.
            </p>

            <h2>One product, more than one visual grammar</h2>
            <p>
              Arc is becoming a family of diagram engines. 2D and isometric describe structure.
              Sequence describes interaction over time. They share the same product goal—diagrams
              that live with the system—but keep the semantics each story needs.
            </p>

            <div className="arc-blog-next">
              <div>
                <span>Try it next</span>
                <strong>Read the sequence engine guide</strong>
              </div>
              <Link to="/docs/mermaid-sequences" aria-label="Read the sequence engine guide">
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}
