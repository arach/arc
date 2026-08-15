import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DiagramEditor from './components/editor/DiagramEditor'
import LandingPage from './components/LandingPage'
import ArcDocs from './components/docs/ArcDocs'
import ArcDiagram from './components/ArcDiagram'
import IsometricDemo from './components/IsometricDemo'
import IsometricExamples from './components/IsometricExamples'
import PlayerShowcase from './components/PlayerShowcase'
import NativeMermaidSequencesPost from './components/blog/NativeMermaidSequencesPost'
import architectureDiagram from './components/diagrams/architecture.diagram'
import type { ThemeId } from './utils/themes'
import { GoogleAnalytics } from './components/GoogleAnalytics'
import { generateSessionId, deriveSessionId, saveDiagramSession, loadDiagramSession } from './utils/sessionStorage'
import './landing.css'

interface HashPayload {
  diagram: any
  originalDiagram?: any  // Clean diagram data (no editor offsets) for player
  viewport?: { width: number; height: number }
  theme?: string
  mode?: 'light' | 'dark'
  sourceId?: string // diagram ID from source (e.g. "OPERATE.CONTROL.001")
  isoStyle?: string // 'solid' | 'blueprint' | 'cyanotype'
  viewMode?: string // '2d' | 'isometric'
}

function parseHashData(): HashPayload | null {
  const hash = window.location.hash
  if (!hash.startsWith('#data=')) return null
  try {
    const encoded = hash.slice(6)
    const json = atob(encoded)
    const d = JSON.parse(json)

    // Diagram files carry display choices under _meta; the embed handoff sends
    // them as underscore keys. Accept either, with the explicit key winning.
    const fileMeta = d._meta || {}
    const viewport = d._viewport ?? fileMeta.viewport
    const theme = d._theme ?? fileMeta.themeId
    const mode = d._mode ?? fileMeta.colorMode
    const isoStyle = d._isoStyle ?? fileMeta.isoStyle
    const viewMode = d._viewMode ?? fileMeta.viewMode
    const sourceId = d.id // diagram ID from the source site

    // Canvas is slightly larger than content to give room for the viewport frame
    const diagramLayout = d.layout || { width: 800, height: 400 }
    const padding = viewport ? 80 : 100  // Just enough for the frame + breathing room
    const layout = {
      width: Math.max(diagramLayout.width, viewport?.width || 0) + padding,
      height: Math.max(diagramLayout.height, viewport?.height || 0) + padding,
    }

    // Offset to place nodes inside a viewport frame
    const offset = viewport ? 40 : 0
    const nodes = d.nodes || {}
    const offsetNodes: Record<string, any> = {}
    for (const [id, node] of Object.entries(nodes)) {
      const n = node as any
      offsetNodes[id] = { ...n, x: n.x + offset, y: n.y + offset }
    }

    // Add a viewport frame as a dashed group rectangle
    const groups = viewport ? [{
      id: '_viewport',
      x: offset,
      y: offset,
      width: viewport.width,
      height: viewport.height,
      type: 'rect' as const,
      color: 'blue' as const,
      label: `Viewport ${viewport.width}×${viewport.height}`,
      dashed: true,
    }] : []

    // Original diagram (clean, no offsets) — for player rendering
    // Add padding to layout so edge nodes (especially xs with text labels) aren't clipped
    const pad = 40
    const paddedNodes: Record<string, any> = {}
    for (const [id, node] of Object.entries(d.nodes || {})) {
      const n = node as any
      paddedNodes[id] = { ...n, x: n.x + pad, y: n.y + pad }
    }
    const originalDiagram = {
      layout: { width: diagramLayout.width + pad * 2, height: diagramLayout.height + pad * 2 },
      nodes: paddedNodes,
      nodeData: d.nodeData || {},
      connectors: d.connectors || [],
      connectorStyles: d.connectorStyles || {},
    }

    return {
      diagram: {
        layout,
        grid: { enabled: true, size: 24, color: '#71717a', opacity: 0.1, type: 'dots' },
        nodes: offsetNodes,
        nodeData: d.nodeData || {},
        connectors: d.connectors || [],
        connectorStyles: d.connectorStyles || {},
        groups,
      },
      originalDiagram,
      viewport,
      theme,
      mode,
      sourceId,
      isoStyle,
      viewMode,
    }
  } catch (e) {
    console.warn('Failed to load diagram from URL hash:', e)
    return null
  }
}

/** Resolve initial editor state synchronously from hash or localStorage */
function resolveEditorSession(urlSessionId?: string) {
  // Priority 1: Hash data (incoming from edit button)
  const hashPayload = parseHashData()
  if (hashPayload) {
    const id = hashPayload.sourceId
      ? deriveSessionId(hashPayload.sourceId)
      : generateSessionId()
    const mode = hashPayload.mode || 'light'

    // Persist immediately so refresh works
    saveDiagramSession(id, {
      diagram: hashPayload.diagram,
      originalDiagram: hashPayload.originalDiagram,
      themeId: hashPayload.theme || null,
      colorMode: mode,
      diagramMeta: {
        themeId: hashPayload.theme,
        colorMode: mode,
        viewport: hashPayload.viewport,
        sourceId: hashPayload.sourceId,
        isoStyle: hashPayload.isoStyle,
        viewMode: hashPayload.viewMode,
      },
    })

    const diagramMeta = {
      themeId: hashPayload.theme,
      colorMode: mode,
      viewport: hashPayload.viewport,
      sourceId: hashPayload.sourceId,
      isoStyle: hashPayload.isoStyle,
      viewMode: hashPayload.viewMode,
    }
    return { sessionId: id, initialData: hashPayload.diagram, originalDiagram: hashPayload.originalDiagram, themeId: hashPayload.theme || null, colorMode: mode, diagramMeta, needsRedirect: true }
  }

  // Priority 2: URL session ID — restore from localStorage
  if (urlSessionId) {
    const session = loadDiagramSession(urlSessionId)
    if (session) {
      return { sessionId: urlSessionId, initialData: session.diagram, originalDiagram: session.originalDiagram, themeId: session.themeId, colorMode: session.colorMode, diagramMeta: session.diagramMeta, needsRedirect: false }
    }
  }

  // Priority 3: Fresh editor
  const newId = generateSessionId()
  return { sessionId: newId, initialData: null, originalDiagram: null, themeId: 'command', colorMode: 'dark' as const, diagramMeta: { themeId: 'command', colorMode: 'dark' }, needsRedirect: !urlSessionId }
}

function EditorPage() {
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>()

  // Resolve session synchronously on first render
  const [resolved] = useState(() => resolveEditorSession(urlSessionId))

  // Redirect to clean session URL if needed (hash import or fresh editor)
  useEffect(() => {
    if (resolved.needsRedirect) {
      // Use window.history directly to avoid React Router unmount/remount
      window.history.replaceState(null, '', `/editor/${resolved.sessionId}`)
    }
  }, [resolved.needsRedirect, resolved.sessionId])

  return (
    <DiagramEditor
      initialData={resolved.initialData}
      themeId={resolved.themeId}
      colorMode={resolved.colorMode}
      sessionId={resolved.sessionId}
      initialDiagramMeta={resolved.diagramMeta}
    />
  )
}

/** Parse URL query params for theme/mode/viewport overrides */
function useUrlOverrides() {
  const [searchParams] = useSearchParams()
  return {
    theme: searchParams.get('theme'),
    mode: searchParams.get('mode') as 'light' | 'dark' | null,
    viewport: searchParams.get('viewport') ? (() => {
      const [w, h] = searchParams.get('viewport')!.split('x').map(Number)
      return w && h ? { width: w, height: h } : null
    })() : null,
    // ?chrome=false strips the Source toggle + zoom controls for clean captures
    chrome: searchParams.get('chrome') !== 'false',
  }
}

/** Standalone player route: renders a diagram read-only with full theme fidelity */
function PlayerPage() {
  const { '*': diagramPath } = useParams()
  const urlOverrides = useUrlOverrides()
  const [session, setSession] = useState<ReturnType<typeof loadDiagramSession>>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!diagramPath) {
      setError('No diagram path specified')
      return
    }

    const sessionId = deriveSessionId(diagramPath)
    const loaded = loadDiagramSession(sessionId)
    if (loaded) {
      setSession(loaded)
    } else {
      setError(`Diagram "${diagramPath}" not found. Edit it first to create a local session.`)
    }
  }, [diagramPath])

  // Poll localStorage for changes (enables agent iteration: write → auto-refresh)
  useEffect(() => {
    if (!diagramPath) return
    const sessionId = deriveSessionId(diagramPath)
    const interval = setInterval(() => {
      const current = loadDiagramSession(sessionId)
      if (current) {
        setSession(prev => {
          if (prev && current.updatedAt !== prev.updatedAt) return current
          if (!prev) return current
          return prev
        })
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [diagramPath])

  // URL params override session values
  const colorMode = urlOverrides.mode || session?.colorMode || 'dark'
  const themeId = urlOverrides.theme || session?.themeId
  const viewport = urlOverrides.viewport || session?.diagramMeta?.viewport

  useEffect(() => {
    if (colorMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    return () => document.documentElement.classList.remove('dark')
  }, [colorMode])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <p className="text-zinc-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-500">Loading...</div>
      </div>
    )
  }

  // Use original diagram (clean, no editor offsets) for player rendering
  const playerData = session.originalDiagram || session.diagram

  return (
    <div className="min-h-screen flex items-center justify-center p-12">
      <div style={viewport ? { width: viewport.width, height: viewport.height } : undefined} className={viewport ? '' : 'w-full max-w-4xl'}>
        <ArcDiagram
          data={playerData}
          mode={colorMode}
          theme={themeId as any}
          interactive={urlOverrides.chrome}
          defaultZoom="fit"
          showArcToggle={urlOverrides.chrome}
          showControls={urlOverrides.chrome}
        />
      </div>
    </div>
  )
}

function LandingPageWrapper() {
  const navigate = useNavigate()

  // Ensure dark mode is removed on landing page
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  return <LandingPage onLaunchEditor={() => navigate('/editor')} />
}

function DocsWrapper() {
  const { page } = useParams<{ page?: string }>()

  // Ensure dark mode is removed on docs
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  return <ArcDocs pageId={page || 'index'} />
}

const EXPLORATIONS: { id: ThemeId; label: string; sub: string }[] = [
  { id: 'command', label: 'Command', sub: 'crosshair grid · chamfer glass · cyan accent bar · connector glow' },
  { id: 'engineering', label: 'Engineering', sub: 'graph grid · framed corners · square tiles · uppercase mono' },
  { id: 'workbench', label: 'Workbench', sub: 'dot grid · hairline edge · soft corners · sentence case' },
  { id: 'tactical', label: 'Tactical', sub: 'crosshair grid · corner brackets · hard edges · uppercase' },
]

const FRAMES: { id: 'hairline' | 'inset' | 'brackets' | 'ticks' | 'cropmarks'; label: string }[] = [
  { id: 'hairline', label: 'Hairline' },
  { id: 'inset', label: 'Inset frame' },
  { id: 'brackets', label: 'Corner brackets' },
  { id: 'ticks', label: 'Ruler ticks' },
  { id: 'cropmarks', label: 'Crop marks' },
]

function InspirationPage() {
  useEffect(() => { document.documentElement.classList.remove('dark') }, [])
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', padding: '40px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 0 6px' }}>Diagram style explorations</h1>
        <p style={{ color: '#9aa0a6', fontSize: 14, margin: '0 0 36px' }}>
          One shared color scheme, three drafting grammars. The nodes and palette stay the same — what changes is the grid system, the edge treatment, the type, and the geometry. Pan/zoom is live.
        </p>
        {EXPLORATIONS.map((b) => (
          <section key={b.id} style={{ marginBottom: 44 }}>
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ color: '#e6e6e6', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>{b.label}</h2>
              <div style={{ color: '#6b7178', fontSize: 12, marginTop: 2 }}>{b.sub} · <code style={{ color: '#9aa0a6' }}>theme="{b.id}"</code></div>
            </div>
            <div style={{ height: 460 }}>
              <ArcDiagram data={architectureDiagram} mode="dark" theme={b.id} interactive defaultZoom="fit" showControls showMinimap />
            </div>
          </section>
        ))}

        <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '24px 0 6px' }}>Edge treatments</h2>
        <p style={{ color: '#9aa0a6', fontSize: 13, margin: '0 0 20px' }}>
          Same diagram, exploring the frame at the boundary. Each is inset with a consistent margin (no competing container border) — corners are just one option.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 44 }}>
          {FRAMES.map((f) => (
            <div key={f.id}>
              <div style={{ color: '#6b7178', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                {f.label} · <code style={{ color: '#9aa0a6' }}>frame="{f.id}"</code>
              </div>
              <div style={{ height: 280 }}>
                <ArcDiagram data={architectureDiagram} mode="dark" theme="workbench" frame={f.id} interactive={false} defaultZoom="fit" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <GoogleAnalytics />
      <Routes>
        <Route path="/" element={<LandingPageWrapper />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:sessionId" element={<EditorPage />} />
        <Route path="/player/*" element={<PlayerPage />} />
        <Route path="/docs" element={<DocsWrapper />} />
        <Route path="/docs/:page" element={<DocsWrapper />} />
        <Route path="/blog/native-mermaid-sequences" element={<NativeMermaidSequencesPost />} />
        <Route path="/iso-demo" element={<IsometricDemo />} />
        <Route path="/iso-examples" element={<IsometricExamples />} />
        <Route path="/showcase" element={<PlayerShowcase />} />
        <Route path="/inspiration" element={<InspirationPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
