import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DiagramEditor from './components/editor/DiagramEditor'
import LandingPage from './components/LandingPage'
import ArcDocs from './components/docs/ArcDocs'
import ArcDiagram from './components/ArcDiagram'
import IsometricDemo from './components/IsometricDemo'
import IsometricExamples from './components/IsometricExamples'
import { GoogleAnalytics } from './components/GoogleAnalytics'
import NativeMermaidSequencesPost from './components/blog/NativeMermaidSequencesPost'
import { generateSessionId, deriveSessionId, saveDiagramSession, loadDiagramSession } from './utils/sessionStorage'
import { registerDiagramReference } from './utils/diagramRegistry'
import './landing.css'

interface HashPayload {
  diagram: any
  originalDiagram?: any  // Clean diagram data (no editor offsets) for player
  viewport?: { width: number; height: number }
  theme?: string
  mode?: 'light' | 'dark'
  sourceId?: string // diagram ID from source (e.g. "OPERATE.CONTROL.001")
}

interface EditorImportRequest {
  kind: 'file' | 'src'
  value: string
  sessionId: string
  themeId: string | null
  colorMode: 'light' | 'dark'
  viewport?: { width: number; height: number } | null
  requestedId?: string | null
}

interface ResolvedEditorSession {
  sessionId: string
  initialData: any
  originalDiagram: any
  themeId: string | null
  colorMode: 'light' | 'dark'
  diagramMeta: Record<string, any>
  needsRedirect: boolean
  importRequest: EditorImportRequest | null
  importError: string | null
}

function parseViewport(searchParams: URLSearchParams) {
  const raw = searchParams.get('viewport')
  if (!raw) return null
  const [w, h] = raw.split('x').map(Number)
  return w && h ? { width: w, height: h } : null
}

function buildImportedDiagramPayload(rawDiagram: any, overrides: Partial<HashPayload> = {}): HashPayload {
  const sanitized = { ...rawDiagram }
  delete sanitized._viewport
  delete sanitized._theme
  delete sanitized._mode

  const viewport = overrides.viewport ?? rawDiagram._viewport
  const theme = overrides.theme ?? rawDiagram._theme
  const mode = overrides.mode ?? rawDiagram._mode
  const sourceId = overrides.sourceId ?? rawDiagram.id
  if (sourceId) {
    sanitized.id = sourceId
  }

  // Canvas is slightly larger than content to give room for the viewport frame
  const diagramLayout = sanitized.layout || { width: 800, height: 400 }
  const padding = viewport ? 80 : 100
  const layout = {
    width: Math.max(diagramLayout.width, viewport?.width || 0) + padding,
    height: Math.max(diagramLayout.height, viewport?.height || 0) + padding,
  }

  const offset = viewport ? 40 : 0
  const nodes = sanitized.nodes || {}
  const offsetNodes: Record<string, any> = {}
  for (const [id, node] of Object.entries(nodes)) {
    const n = node as any
    offsetNodes[id] = { ...n, x: n.x + offset, y: n.y + offset }
  }

  const viewportGroup = viewport ? [{
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

  const pad = 40
  const paddedNodes: Record<string, any> = {}
  for (const [id, node] of Object.entries(nodes)) {
    const n = node as any
    paddedNodes[id] = { ...n, x: n.x + pad, y: n.y + pad }
  }

  return {
    diagram: {
      ...sanitized,
      layout,
      grid: sanitized.grid || { enabled: true, size: 24, color: '#71717a', opacity: 0.1, type: 'dots' },
      nodes: offsetNodes,
      groups: [...(sanitized.groups || []), ...viewportGroup],
    },
    originalDiagram: {
      ...sanitized,
      layout: { width: diagramLayout.width + pad * 2, height: diagramLayout.height + pad * 2 },
      nodes: paddedNodes,
    },
    viewport,
    theme,
    mode,
    sourceId,
  }
}

function parseHashData(): HashPayload | null {
  const hash = window.location.hash
  if (!hash.startsWith('#data=')) return null
  try {
    const encoded = hash.slice(6)
    const json = atob(encoded)
    const d = JSON.parse(json)
    return buildImportedDiagramPayload(d)
  } catch (e) {
    console.warn('Failed to load diagram from URL hash:', e)
    return null
  }
}

function parseEditorImportRequest(urlSessionId?: string): EditorImportRequest | null {
  const search = new URLSearchParams(window.location.search)
  const file = search.get('file')
  const src = search.get('src')
  if (!file && !src) return null

  const kind = file ? 'file' : 'src'
  const value = file || src || ''
  const requestedId = search.get('id')
  const sessionId = urlSessionId || (requestedId ? deriveSessionId(requestedId) : generateSessionId())
  const mode = (search.get('mode') as 'light' | 'dark' | null) || 'dark'

  return {
    kind,
    value,
    sessionId,
    themeId: search.get('theme'),
    colorMode: mode,
    viewport: parseViewport(search),
    requestedId,
  }
}

function resolveDiagramId(rawDiagram: any, requestedId?: string | null) {
  const diagramId = requestedId || rawDiagram?.id
  if (typeof diagramId !== 'string' || diagramId.trim().length === 0) {
    throw new Error('Reference-backed editor flows require a unique diagram id. Add `id` to the diagram or pass `?id=`.')
  }
  return diagramId.trim()
}

async function loadImportRequest(importRequest: EditorImportRequest) {
  const requestUrl = importRequest.kind === 'file'
    ? `/__arc/dev/file?path=${encodeURIComponent(importRequest.value)}`
    : importRequest.value
  const response = await fetch(requestUrl)
  if (!response.ok) {
    throw new Error(`Import failed with ${response.status}`)
  }
  return response.json()
}

/** Resolve initial editor state synchronously from hash or localStorage */
function resolveEditorSession(urlSessionId?: string): ResolvedEditorSession {
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
        diagramId: hashPayload.sourceId,
        themeId: hashPayload.theme,
        colorMode: mode,
        viewport: hashPayload.viewport,
        sourceId: hashPayload.sourceId,
      },
    })

    const diagramMeta = {
      diagramId: hashPayload.sourceId,
      themeId: hashPayload.theme,
      colorMode: mode,
      viewport: hashPayload.viewport,
      sourceId: hashPayload.sourceId,
    }
    return {
      sessionId: id,
      initialData: hashPayload.diagram,
      originalDiagram: hashPayload.originalDiagram,
      themeId: hashPayload.theme || null,
      colorMode: mode,
      diagramMeta,
      needsRedirect: true,
      importRequest: null,
      importError: null,
    }
  }

  // Priority 2: Dev import via file path or remote src
  const importRequest = parseEditorImportRequest(urlSessionId)
  if (importRequest) {
    return {
      sessionId: importRequest.sessionId,
      initialData: null,
      originalDiagram: null,
      themeId: importRequest.themeId,
      colorMode: importRequest.colorMode,
      diagramMeta: {
        themeId: importRequest.themeId,
        colorMode: importRequest.colorMode,
        viewport: importRequest.viewport,
        sourceId: importRequest.requestedId,
        diagramId: importRequest.requestedId,
        [importRequest.kind]: importRequest.value,
      },
      needsRedirect: false,
      importRequest,
      importError: null,
    }
  }

  // Priority 3: URL session ID — restore from localStorage
  if (urlSessionId) {
    const session = loadDiagramSession(urlSessionId)
    if (session) {
      return {
        sessionId: urlSessionId,
        initialData: session.diagram,
        originalDiagram: session.originalDiagram,
        themeId: session.themeId,
        colorMode: session.colorMode,
        diagramMeta: session.diagramMeta,
        needsRedirect: false,
        importRequest: null,
        importError: null,
      }
    }
  }

  // Priority 4: Fresh editor
  const newId = generateSessionId()
  return {
    sessionId: newId,
    initialData: null,
    originalDiagram: null,
    themeId: null,
    colorMode: 'dark' as const,
    diagramMeta: {},
    needsRedirect: !urlSessionId,
    importRequest: null,
    importError: null,
  }
}

function EditorPage() {
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>()

  // Resolve session synchronously on first render
  const [resolved] = useState(() => resolveEditorSession(urlSessionId))
  const [editorState, setEditorState] = useState(resolved)
  const [isDark, setIsDark] = useState(resolved.colorMode === 'dark')

  useEffect(() => {
    let cancelled = false
    if (!editorState.importRequest) return

    ;(async () => {
      try {
        const imported = await loadImportRequest(editorState.importRequest!)
        const diagramId = resolveDiagramId(imported, editorState.importRequest?.requestedId)
        registerDiagramReference(diagramId, {
          kind: editorState.importRequest!.kind,
          value: editorState.importRequest!.value,
        })
        const payload = buildImportedDiagramPayload(imported, {
          viewport: editorState.importRequest?.viewport || undefined,
          theme: editorState.importRequest?.themeId || undefined,
          mode: editorState.importRequest?.colorMode,
          sourceId: diagramId,
        })
        const sessionId = deriveSessionId(diagramId)
        const mode = payload.mode || 'dark'
        const themeId = payload.theme || null
        const diagramMeta = {
          diagramId,
          themeId,
          colorMode: mode,
          viewport: payload.viewport,
          sourceId: diagramId,
          [editorState.importRequest!.kind]: editorState.importRequest!.value,
        }

        saveDiagramSession(sessionId, {
          diagram: payload.diagram,
          originalDiagram: payload.originalDiagram,
          themeId,
          colorMode: mode,
          diagramMeta,
        })

        if (cancelled) return
        setEditorState({
          sessionId,
          initialData: payload.diagram,
          originalDiagram: payload.originalDiagram,
          themeId,
          colorMode: mode,
          diagramMeta,
          needsRedirect: true,
          importRequest: null,
          importError: null,
        })
        setIsDark(mode === 'dark')
      } catch (error) {
        if (cancelled) return
        setEditorState((current) => ({
          ...current,
          importRequest: null,
          importError: error instanceof Error ? error.message : 'Failed to import diagram',
        }))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [editorState.importRequest, editorState.sessionId])

  // Redirect to clean session URL if needed (hash import or fresh editor)
  useEffect(() => {
    if (editorState.needsRedirect) {
      // Use window.history directly to avoid React Router unmount/remount
      window.history.replaceState(null, '', `/editor/${editorState.sessionId}`)
    }
  }, [editorState.needsRedirect, editorState.sessionId])

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

  if (editorState.importRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <p className="text-sm text-zinc-400">Loading diagram from {editorState.importRequest.kind}…</p>
        </div>
      </div>
    )
  }

  if (editorState.importError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <p className="text-sm text-zinc-400">{editorState.importError}</p>
        </div>
      </div>
    )
  }

  return (
    <DiagramEditor
      isDark={isDark}
      onToggleTheme={() => setIsDark(!isDark)}
      initialData={editorState.initialData}
      themeId={editorState.themeId}
      colorMode={editorState.colorMode}
      sessionId={editorState.sessionId}
      initialDiagramMeta={editorState.diagramMeta}
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

export function ArcRoutes() {
  return (
    <>
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
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ArcRoutes />
    </BrowserRouter>
  )
}

export default App
