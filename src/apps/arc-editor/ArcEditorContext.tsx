import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useTheme } from 'hudsonkit/theme'
import {
  EditorProvider,
  useEditor,
  useDiagram,
  useEditorState,
  useMeta,
} from '../../components/editor/EditorProvider'
import ShareSheet from '../../components/dialogs/ShareSheet'
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts'
import { useMeta as usePageMeta } from '../../hooks/useMeta'
import { saveDiagramSession, loadDiagramSession } from '../../utils/sessionStorage'
import { saveDiagram, loadDiagram } from '../../utils/fileOperations'

export interface ArcEditorInit {
  initialData?: any
  themeId?: string | null
  colorMode?: 'light' | 'dark'
  sessionId?: string | null
  initialDiagramMeta?: Record<string, any>
}

interface ArcEditorContextValue {
  sessionId: string | null
  openShare: () => void
  handleNew: () => void
  handleOpen: () => Promise<void>
  handleSave: () => Promise<void>
}

const ArcEditorContext = createContext<ArcEditorContextValue | null>(null)

export function useArcEditor() {
  const ctx = useContext(ArcEditorContext)
  if (!ctx) {
    throw new Error('useArcEditor must be used inside ArcEditorProvider')
  }
  return ctx
}

function ArcEditorThemeSync() {
  const { resolvedTheme } = useTheme()
  const { actions } = useEditor()
  const editor = useEditorState()

  useEffect(() => {
    if (!resolvedTheme) return
    const mode = resolvedTheme === 'dark' ? 'dark' : 'light'
    if (editor.colorMode !== mode) {
      actions.setColorMode(mode)
    }
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [resolvedTheme, editor.colorMode, actions])

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return null
}

function ArcEditorSession({
  sessionId,
  children,
}: {
  sessionId: string | null
  children: ReactNode
}) {
  const { actions, state } = useEditor()
  const diagram = useDiagram()
  const editor = useEditorState()
  const meta = useMeta()
  const [showShare, setShowShare] = useState(false)
  const [viewportBounds, setViewportBounds] = useState(null)

  const [originalDiagram] = useState(() => {
    if (!sessionId) return null
    const existing = loadDiagramSession(sessionId)
    return existing?.originalDiagram || null
  })

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
  }, [
    sessionId,
    state.diagram,
    state.editor.themeId,
    state.editor.colorMode,
    state.meta.diagramMeta,
    originalDiagram,
  ])

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
      const { _meta, ...diagramData } = result.diagram
      const diagramMeta = _meta || result.meta || {}
      actions.loadDiagram(diagramData, result.filename)
      if (diagramMeta.themeId) actions.setTheme(diagramMeta.themeId)
      if (diagramMeta.colorMode) actions.setColorMode(diagramMeta.colorMode)
      if (Object.keys(diagramMeta).length > 0) actions.setDiagramMeta(diagramMeta)
    }
  }, [meta.isDirty, actions])

  const handleSave = useCallback(async () => {
    const diagramWithMeta = {
      ...diagram,
      _meta: meta.diagramMeta || {},
    }
    const filename = await saveDiagram(diagramWithMeta, meta.filename || 'diagram.json')
    if (filename) {
      actions.markSaved(filename)
    }
  }, [diagram, meta.filename, meta.diagramMeta, actions])

  const handleDelete = useCallback(() => {
    if (editor.selectedNodeIds?.length > 0) {
      for (const nodeId of editor.selectedNodeIds) {
        actions.removeNode(nodeId)
      }
    } else if (editor.selectedConnectorIndex !== null) {
      actions.removeConnector(editor.selectedConnectorIndex)
    } else if (editor.selectedGroupId !== null) {
      actions.removeGroup(editor.selectedGroupId)
    } else if (editor.selectedImageId !== null) {
      actions.removeImage(editor.selectedImageId)
    }
  }, [
    editor.selectedNodeIds,
    editor.selectedConnectorIndex,
    editor.selectedGroupId,
    editor.selectedImageId,
    actions,
  ])

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

  const value = useMemo<ArcEditorContextValue>(() => ({
    sessionId,
    openShare: () => setShowShare(true),
    handleNew,
    handleOpen,
    handleSave,
  }), [sessionId, handleNew, handleOpen, handleSave])

  return (
    <ArcEditorContext.Provider value={value}>
      <ArcEditorViewportContext.Provider value={{ viewportBounds, setViewportBounds }}>
        {children}
        {showShare && (
          <ShareSheet
            diagram={diagram}
            viewportBounds={viewportBounds}
            onClose={() => setShowShare(false)}
          />
        )}
      </ArcEditorViewportContext.Provider>
    </ArcEditorContext.Provider>
  )
}

interface ArcEditorViewportContextValue {
  viewportBounds: any
  setViewportBounds: (bounds: any) => void
}

const ArcEditorViewportContext = createContext<ArcEditorViewportContextValue>({
  viewportBounds: null,
  setViewportBounds: () => {},
})

export function useArcEditorViewport() {
  return useContext(ArcEditorViewportContext)
}

export function ArcEditorProvider({
  children,
  init,
  initialDiagram,
}: {
  children: ReactNode
  init: ArcEditorInit
  initialDiagram: any
}) {
  return (
    <EditorProvider
      initialDiagram={initialDiagram}
      initialDiagramMeta={init.initialDiagramMeta}
      initialThemeId={init.themeId}
      initialColorMode={init.colorMode || 'dark'}
    >
      <ArcEditorThemeSync />
      <ArcEditorSession sessionId={init.sessionId ?? null}>
        {children}
      </ArcEditorSession>
    </EditorProvider>
  )
}