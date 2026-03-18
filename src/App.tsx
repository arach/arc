import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DiagramEditor from './components/editor/DiagramEditor'
import LandingPage from './components/LandingPage'
import ArcDocs from './components/docs/ArcDocs'
import ArcDiagram from './components/ArcDiagram'
import IsometricDemo from './components/IsometricDemo'
import IsometricExamples from './components/IsometricExamples'
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
}

function parseHashData(): HashPayload | null {
  const hash = window.location.hash
  if (!hash.startsWith('#data=')) return null
  try {
    const encoded = hash.slice(6)
    const json = atob(encoded)
    const d = JSON.parse(json)

    const viewport = d._viewport
    const theme = d._theme
    const mode = d._mode
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
    const mode = hashPayload.mode || 'dark'

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
      },
    })

    const diagramMeta = { themeId: hashPayload.theme, colorMode: mode, viewport: hashPayload.viewport, sourceId: hashPayload.sourceId }
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
  return { sessionId: newId, initialData: null, originalDiagram: null, themeId: null, colorMode: 'dark' as const, diagramMeta: {}, needsRedirect: !urlSessionId }
}

function EditorPage() {
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>()

  // Resolve session synchronously on first render
  const [resolved] = useState(() => resolveEditorSession(urlSessionId))
  const [isDark, setIsDark] = useState(resolved.colorMode === 'dark')

  // Redirect to clean session URL if needed (hash import or fresh editor)
  useEffect(() => {
    if (resolved.needsRedirect) {
      // Use window.history directly to avoid React Router unmount/remount
      window.history.replaceState(null, '', `/editor/${resolved.sessionId}`)
    }
  }, [resolved.needsRedirect, resolved.sessionId])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return (
    <DiagramEditor
      isDark={isDark}
      onToggleTheme={() => setIsDark(!isDark)}
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
          interactive
          defaultZoom="fit"
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
        <Route path="/iso-demo" element={<IsometricDemo />} />
        <Route path="/iso-examples" element={<IsometricExamples />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
