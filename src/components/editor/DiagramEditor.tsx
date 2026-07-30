// @ts-nocheck
import { useState, useCallback, useEffect } from 'react'
import { EditorProvider, useEditor, useDiagram, useEditorState, useMeta, useThemeId } from './EditorProvider'
import { saveDiagramSession, loadDiagramSession } from '../../utils/sessionStorage'
import { useMeta as usePageMeta } from '../../hooks/useMeta'
import TopBar from './TopBar'
import FloatingToolbar from './FloatingToolbar'
import DiagramCanvas from './DiagramCanvas'
import PropertiesPanel from './PropertiesPanel'
import ShareSheet from '../dialogs/ShareSheet'
import ErrorBoundary from '../ErrorBoundary'
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts'
import { saveDiagram, loadDiagram } from '../../utils/fileOperations'
import ArcDiagram from '../ArcDiagram'
import StyleSourcePane, { TEMPLATE_THEME_DEFAULT_ID, type StyleSourceSelection } from './StyleSourcePane'

type EditorSurfaceView = 'canvas' | 'render' | 'source' | 'styles'

// Sample diagram to start with - matches Talkie docs styling
const sampleDiagram = {
  layout: { width: 1600, height: 900 },
  grid: { enabled: true, size: 24, color: '#71717a', opacity: 0.1, type: 'dots' },
  nodes: {
    talkie: { x: 50, y: 45, size: 'l' },
    talkieLive: { x: 50, y: 155, size: 'm' },
    talkieEngine: { x: 50, y: 255, size: 'm' },
    talkieServer: { x: 360, y: 55, size: 'm' },
    iCloud: { x: 380, y: 255, size: 'm' },
    iPhone: { x: 600, y: 55, size: 'm' },
    watch: { x: 620, y: 155, size: 's' },
  },
  nodeData: {
    talkie: {
      icon: 'Monitor',
      name: 'Talkie',
      subtitle: 'Swift/SwiftUI',
      description: 'UI, Workflows, Data, Orchestration',
      color: 'violet',
    },
    talkieLive: {
      icon: 'Mic',
      name: 'TalkieLive',
      subtitle: 'Swift',
      description: 'Ears & Hands',
      color: 'emerald',
    },
    talkieEngine: {
      icon: 'Cpu',
      name: 'TalkieEngine',
      subtitle: 'Swift',
      description: 'Local Brain',
      color: 'blue',
    },
    talkieServer: {
      icon: 'Server',
      name: 'TalkieServer',
      subtitle: 'TypeScript',
      description: 'iOS Bridge',
      color: 'amber',
    },
    iCloud: {
      icon: 'Cloud',
      name: 'iCloud',
      subtitle: 'CloudKit',
      description: 'Memo Sync',
      color: 'sky',
    },
    iPhone: {
      icon: 'Smartphone',
      name: 'iPhone',
      subtitle: 'iOS',
      description: 'Voice Capture',
      color: 'zinc',
    },
    watch: {
      icon: 'Watch',
      name: 'Watch',
      subtitle: 'watchOS',
      color: 'zinc',
    },
  },
  connectors: [
    { from: 'talkie', to: 'talkieLive', fromAnchor: 'bottom', toAnchor: 'top', style: 'xpc' },
    { from: 'talkieLive', to: 'talkieEngine', fromAnchor: 'bottom', toAnchor: 'top', style: 'audio' },
    { from: 'talkie', to: 'talkieServer', fromAnchor: 'right', toAnchor: 'left', style: 'http' },
    { from: 'talkieServer', to: 'iPhone', fromAnchor: 'right', toAnchor: 'left', style: 'tailscale' },
    { from: 'iPhone', to: 'watch', fromAnchor: 'bottom', toAnchor: 'top', style: 'peer' },
    { from: 'talkie', to: 'iCloud', fromAnchor: 'bottomRight', toAnchor: 'left', style: 'cloudkit', curve: 'natural' },
    { from: 'iPhone', to: 'iCloud', fromAnchor: 'bottomLeft', toAnchor: 'right', style: 'cloudkit', curve: 'natural' },
  ],
  connectorStyles: {
    xpc: { color: 'sky', strokeWidth: 2, label: '', dashed: true },
    http: { color: 'amber', strokeWidth: 2, label: 'HTTP', dashed: true },
    tailscale: { color: 'sky', strokeWidth: 2, label: 'Tailscale', dashed: true },
    cloudkit: { color: 'sky', strokeWidth: 2, label: '', dashed: true },
    audio: { color: 'sky', strokeWidth: 2, label: '', dashed: true },
    peer: { color: 'sky', strokeWidth: 2, label: '', dashed: true },
  },
}

function formatDiagramSource(diagram: any) {
  return JSON.stringify(diagram, null, 2)
}

function parseDiagramSource(sourceText: string) {
  const parsed = JSON.parse(sourceText)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Diagram source must be a JSON object.')
  }

  const requiredKeys = ['layout', 'nodes', 'nodeData', 'connectors', 'connectorStyles']
  const missing = requiredKeys.filter((key) => !(key in parsed))
  if (missing.length > 0) {
    throw new Error(`Missing required keys: ${missing.join(', ')}`)
  }

  return parsed
}

async function saveDiagramToDevFile(filePath: string, diagram: any) {
  const response = await fetch(`/__arc/dev/file?path=${encodeURIComponent(filePath)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(diagram),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new Error(errorBody?.error || `Failed to save source file (${response.status})`)
  }
}

function PlayerSurface({
  diagram,
  isDark,
  themeId,
  label,
}: {
  diagram: any
  isDark: boolean
  themeId: string | null
  label: string
}) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800">
      <ArcDiagram
        data={diagram}
        mode={isDark ? 'dark' : 'light'}
        theme={(themeId || 'default') as any}
        nodeChrome={diagram.layoutHints || diagram.focusTargets ? 'technical' : 'default'}
        interactive
        defaultZoom="fit"
        maxFitZoom={0.92}
        label={label}
        showArcToggle={false}
        showFocusStory
        hoverEffects={{
          dim: true,
          dimOpacity: 0.12,
          glow: true,
          lift: true,
          highlightEdges: true,
        }}
        className="w-full h-full"
      />
    </div>
  )
}

function SourceEditorPane({
  diagram,
  label,
  sourcePath,
  onApply,
  onSave,
  isDark,
  themeId,
}: {
  diagram: any
  label: string
  sourcePath?: string
  onApply: (nextDiagram: any) => void
  onSave: () => void
  isDark: boolean
  themeId: string | null
}) {
  const [sourceText, setSourceText] = useState(() => formatDiagramSource(diagram))
  const [isDirty, setIsDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isDirty) {
      setSourceText(formatDiagramSource(diagram))
      setError(null)
    }
  }, [diagram, isDirty])

  const handleApply = useCallback(() => {
    try {
      const parsed = parseDiagramSource(sourceText)
      onApply(parsed)
      setSourceText(formatDiagramSource(parsed))
      setIsDirty(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid diagram source')
    }
  }, [onApply, sourceText])

  const handleFormat = useCallback(() => {
    try {
      const parsed = parseDiagramSource(sourceText)
      setSourceText(formatDiagramSource(parsed))
      setError(null)
      setIsDirty(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid diagram source')
    }
  }, [sourceText])

  const handleReset = useCallback(() => {
    setSourceText(formatDiagramSource(diagram))
    setIsDirty(false)
    setError(null)
  }, [diagram])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(sourceText).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    }).catch(() => {})
  }, [sourceText])

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-[44%] min-w-[360px] border-r border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/70 flex flex-col">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Diagram Source</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Edit the actual diagram JSON and preview it with the player renderer.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleFormat} className="px-2.5 py-1.5 text-xs rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">Format</button>
              <button onClick={handleReset} className="px-2.5 py-1.5 text-xs rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">Reset</button>
              <button onClick={handleCopy} className="px-2.5 py-1.5 text-xs rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">{copied ? 'Copied' : 'Copy'}</button>
              <button onClick={handleApply} className="px-2.5 py-1.5 text-xs rounded-md bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">Apply</button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate" title={sourcePath || label}>
              {sourcePath || label}
            </div>
            <button onClick={onSave} className="px-2.5 py-1.5 text-xs rounded-md border border-sky-300/40 text-sky-700 hover:bg-sky-50 dark:border-sky-500/40 dark:text-sky-300 dark:hover:bg-sky-950/40">
              {sourcePath ? 'Save To File' : 'Save Export'}
            </button>
          </div>
          {error && (
            <div className="mt-3 text-xs text-rose-600 dark:text-rose-400">{error}</div>
          )}
        </div>

        <textarea
          value={sourceText}
          onChange={(event) => {
            setSourceText(event.target.value)
            setIsDirty(true)
          }}
          spellCheck={false}
          className="flex-1 w-full resize-none border-0 bg-transparent px-4 py-4 font-mono text-[12px] leading-6 text-zinc-800 outline-none dark:text-zinc-200"
        />
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        <PlayerSurface diagram={diagram} isDark={isDark} themeId={themeId} label={label} />
      </div>
    </div>
  )
}

function EditorContent({ isDark, onToggleTheme, sessionId = null }: { isDark: boolean; onToggleTheme: () => void; sessionId?: string | null }) {
  const { actions, state } = useEditor()
  const diagram = useDiagram()
  const editor = useEditorState()
  const meta = useMeta()
  const themeId = useThemeId()
  const diagramMeta = (meta.diagramMeta || {}) as Record<string, any>
  const [showShare, setShowShare] = useState(false)
  const [viewportBounds, setViewportBounds] = useState(null)
  const [surfaceView, setSurfaceView] = useState<EditorSurfaceView>('canvas')
  const [styleSelection, setStyleSelection] = useState<StyleSourceSelection>(() => ({
    kind: themeId ? 'theme' : 'template',
    id: themeId || editor.template || TEMPLATE_THEME_DEFAULT_ID,
  }))
  const sourceFile = typeof diagramMeta.file === 'string' ? diagramMeta.file : undefined
  const surfaceLabel = diagramMeta.diagramId || diagramMeta.sourceId || meta.filename || 'diagram.arc'

  // Preserve originalDiagram from initial session (for player rendering)
  const [originalDiagram] = useState(() => {
    if (!sessionId) return null
    const existing = loadDiagramSession(sessionId)
    return existing?.originalDiagram || null
  })

  // Auto-save to localStorage when sessionId is present
  useEffect(() => {
    if (!sessionId) return
    const timeout = setTimeout(() => {
      saveDiagramSession(sessionId, {
        diagram: state.diagram,
        originalDiagram,
        themeId: state.editor.themeId,
        colorMode: state.editor.colorMode as 'light' | 'dark',
        diagramMeta: state.meta.diagramMeta || {},
      })
    }, 1000)
    return () => clearTimeout(timeout)
  }, [sessionId, state.diagram, state.editor.themeId, state.editor.colorMode, state.meta.diagramMeta, originalDiagram])

  // Set page-specific meta tags
  usePageMeta({
    title: 'Arc Editor | Visual Diagram Builder',
    description: 'Drag-and-drop diagram builder with real-time preview and JSON export.',
    image: '/og-editor.png',
    url: '/editor',
  })

  const handleNew = useCallback(() => {
    if (meta.isDirty && !window.confirm('Discard unsaved changes?')) return
    actions.newDiagram()
  }, [meta.isDirty, actions])

  const handleOpen = useCallback(async () => {
    if (meta.isDirty && !window.confirm('Discard unsaved changes?')) return
    const result = await loadDiagram() as { diagram: any; filename: string; meta?: any } | null
    if (result) {
      // Extract _meta from diagram if present
      const { _meta, ...diagramData } = result.diagram
      const diagramMeta = _meta || result.meta || {}
      actions.loadDiagram(diagramData, result.filename, diagramMeta)
    }
  }, [meta.isDirty, actions])

  const handleSave = useCallback(async () => {
    if (sourceFile) {
      await saveDiagramToDevFile(sourceFile, diagram)
      actions.markSaved(sourceFile)
      return
    }

    // Include diagram metadata when saving to file
    const diagramWithMeta = {
      ...diagram,
      _meta: diagramMeta,
    }
    const filename = await saveDiagram(diagramWithMeta, meta.filename || 'diagram.json')
    if (filename) {
      actions.markSaved(filename)
    }
  }, [diagram, meta.filename, diagramMeta, actions, sourceFile])

  const handleApplySource = useCallback((nextDiagram: any) => {
    actions.loadDiagram(nextDiagram, meta.filename || sourceFile || null, diagramMeta)
  }, [actions, meta.filename, diagramMeta, sourceFile])

  const handleOpenStyles = useCallback((selection: StyleSourceSelection) => {
    setStyleSelection(selection)
    setSurfaceView('styles')
  }, [])

  const handleExport = useCallback(() => {
    setShowShare(true)
  }, [])

  const handleDelete = useCallback(() => {
    if (editor.selectedNodeIds?.length > 0) {
      // Delete all selected nodes
      for (const nodeId of editor.selectedNodeIds) {
        actions.removeNode(nodeId)
      }
    } else if (editor.selectedConnectorIndex !== null) {
      actions.removeConnector(editor.selectedConnectorIndex)
    } else if (editor.selectedGroupId !== null) {
      actions.removeGroup(editor.selectedGroupId)
    }
  }, [editor.selectedNodeIds, editor.selectedConnectorIndex, editor.selectedGroupId, actions])

  const handleEscape = useCallback(() => {
    if (editor.pendingConnector) {
      actions.clearPendingConnector()
    } else if (editor.mode !== 'select') {
      actions.setMode('select')
    } else {
      actions.clearSelection()
    }
  }, [editor.mode, editor.pendingConnector, actions])

  useKeyboardShortcuts({
    onDelete: handleDelete,
    onUndo: actions.undo,
    onRedo: actions.redo,
    onSave: handleSave,
    onNew: handleNew,
    onEscape: handleEscape,
    onSetMode: actions.setMode,
  })

  return (
    <div className={`flex flex-col h-screen ${themeId ? '' : 'bg-zinc-100 dark:bg-zinc-950'}`}
      style={themeId ? {
        background: isDark ? '#0a0a0f' : '#f0f2f5',
      } : undefined}
    >
      {/* Top bar */}
      <TopBar
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onShare={handleExport}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        view={surfaceView}
        onViewChange={setSurfaceView}
        onOpenStyles={handleOpenStyles}
      />

      {/* Main editor area */}
      <div className="flex-1 overflow-hidden">
        {surfaceView === 'canvas' ? (
          <div className="h-full flex overflow-hidden">
            {/* Canvas area */}
            <div className="flex-1 relative p-4 overflow-hidden">
              <div className={`w-full h-full rounded-xl overflow-hidden shadow-sm ${themeId ? '' : 'border border-zinc-200 dark:border-zinc-800'}`}
                style={themeId ? {
                  border: isDark ? '1px solid rgba(100,116,139,0.2)' : '1px solid rgba(148,163,184,0.3)',
                } : undefined}
              >
                <ErrorBoundary>
                  <DiagramCanvas
                    onViewportChange={setViewportBounds}
                    embedConfig={{ enableViewModeToggle: true }}
                    themeOverride={themeId || undefined}
                    isDark={isDark}
                  />
                </ErrorBoundary>
              </div>
              {/* Floating toolbar */}
              <FloatingToolbar />
            </div>

            {/* Properties panel */}
            <PropertiesPanel />
          </div>
        ) : surfaceView === 'render' ? (
          <div className="h-full p-4">
            <PlayerSurface diagram={diagram} isDark={isDark} themeId={themeId} label={surfaceLabel} />
          </div>
        ) : surfaceView === 'source' ? (
          <SourceEditorPane
            diagram={diagram}
            label={surfaceLabel}
            sourcePath={sourceFile}
            onApply={handleApplySource}
            onSave={handleSave}
            isDark={isDark}
            themeId={themeId}
          />
        ) : (
          <StyleSourcePane
            selection={styleSelection}
            onSelectionChange={setStyleSelection}
          />
        )}
      </div>

      {/* Share sheet */}
      {showShare && (
        <ShareSheet
          diagram={diagram}
          viewportBounds={viewportBounds}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}

export default function DiagramEditor({ isDark, onToggleTheme, initialData = null, themeId = null, colorMode, sessionId = null, initialDiagramMeta }: {
  isDark: boolean
  onToggleTheme: () => void
  initialData?: any
  themeId?: string | null
  colorMode?: 'light' | 'dark'
  sessionId?: string | null
  initialDiagramMeta?: Record<string, any>
}) {
  return (
    <EditorProvider
      initialDiagram={initialData || sampleDiagram}
      initialDiagramMeta={initialDiagramMeta}
      initialThemeId={themeId}
      initialColorMode={colorMode || (isDark ? 'dark' : 'light')}
    >
      <EditorContent isDark={isDark} onToggleTheme={onToggleTheme} sessionId={sessionId} />
    </EditorProvider>
  )
}
