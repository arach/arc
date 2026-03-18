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

function EditorContent({ isDark, onToggleTheme, sessionId = null }: { isDark: boolean; onToggleTheme: () => void; sessionId?: string | null }) {
  const { actions, state } = useEditor()
  const diagram = useDiagram()
  const editor = useEditorState()
  const meta = useMeta()
  const themeId = useThemeId()
  const [showShare, setShowShare] = useState(false)
  const [viewportBounds, setViewportBounds] = useState(null)

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
      actions.loadDiagram(diagramData, result.filename)
      if (diagramMeta.themeId) actions.setTheme(diagramMeta.themeId)
      if (diagramMeta.colorMode) actions.setColorMode(diagramMeta.colorMode)
      if (Object.keys(diagramMeta).length > 0) actions.setDiagramMeta(diagramMeta)
    }
  }, [meta.isDirty, actions])

  const handleSave = useCallback(async () => {
    // Include diagram metadata when saving to file
    const diagramWithMeta = {
      ...diagram,
      _meta: meta.diagramMeta || {},
    }
    const filename = await saveDiagram(diagramWithMeta, meta.filename || 'diagram.json')
    if (filename) {
      actions.markSaved(filename)
    }
  }, [diagram, meta.filename, meta.diagramMeta, actions])

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
      />

      {/* Main editor area */}
      <div className="flex-1 flex overflow-hidden">
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
