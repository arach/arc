// Hudson Content slot for /showcase: the player on the app canvas, with the
// generated JSX docked underneath it.

import { lazy, Suspense, useState } from 'react'
import { Braces, Check, Copy } from 'lucide-react'
import ArcDiagram from '../../components/ArcDiagram'
import SettingsRail from '../../components/chrome/SettingsRail'

import { useShowcase } from './ShowcaseContext'

// CodeMirror is only worth downloading once the markup pane is opened.
const MarkupPanel = lazy(() => import('../../components/chrome/MarkupPanel'))

export default function ShowcaseContent() {
  const s = useShowcase()
  const [copied, setCopied] = useState(false)
  const [showMarkup, setShowMarkup] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(s.snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  // Zoom is resolved once per mount, so remount when an input to it changes.
  const stageKey = `${s.doc.id}-${s.zoom}-${s.maxFit}-${s.fill ? 'fill' : `${s.width}x${s.height}`}`

  return (
    <div className="arc-shell-row">
      <SettingsRail>
        <button
          type="button"
          className={`arc-rail-btn${showMarkup ? ' is-active' : ''}`}
          title="Diagram markup"
          aria-label="Diagram markup"
          onClick={() => setShowMarkup(v => !v)}
        >
          <Braces strokeWidth={1.75} />
        </button>
      </SettingsRail>

      {showMarkup && (
        <Suspense fallback={null}>
          <MarkupPanel
            title={s.doc.data.id || s.doc.name}
            data={s.doc.data}
            onClose={() => setShowMarkup(false)}
          />
        </Suspense>
      )}
      <div className="arc-showcase-root arc-shell-main">
      <div className="arc-showcase-stage-scroll">
        {/* min-w-max keeps an oversized stage from being clipped by centering. */}
        <div className="arc-showcase-stage">
          <div
            style={s.fill ? { width: '100%', height: Math.max(320, s.height) } : { width: s.width, height: s.height }}
          >
            <ArcDiagram
              key={stageKey}
              className="w-full h-full"
              data={s.doc.data}
              theme={s.themeId}
              mode={s.mode}
              defaultZoom={s.zoom}
              maxFitZoom={s.maxFit}
              interactive={s.interactive}
              showControls={s.controls}
              showArcToggle={s.source}
              showLegend={s.legend}
              showMinimap={s.minimap}
              showFocusStory={s.focusStory}
              showAutoLayout={s.autoLayoutBtn}
              label={s.label ? undefined : ''}
              labelPosition={s.corner}
              frame={s.frame === 'theme' ? undefined : s.frame}
              hoverEffects={
                s.hover
                  ? { dim: s.dim, dimOpacity: s.dimOpacity, lift: s.lift, glow: s.glow, highlightEdges: s.edges }
                  : false
              }
              onNodeHover={s.setActiveNode}
            />
          </div>
        </div>
      </div>

      <div className="arc-showcase-snippet">
        <pre>{s.snippet}</pre>
        <button type="button" className="arc-editor-btn-ghost arc-showcase-copy" onClick={copy}>
          {copied ? <Check /> : <Copy />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        </div>
      </div>
    </div>
  )
}
