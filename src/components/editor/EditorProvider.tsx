import { createContext, useContext, useReducer, useCallback } from 'react'
import { editorReducer, initialState } from './editorReducer'

const EditorContext = createContext(null)

export function EditorProvider({ children, initialDiagram }) {
  const [state, dispatch] = useReducer(
    editorReducer,
    initialDiagram ? { ...initialState, diagram: initialDiagram } : initialState
  )

  // Action creators for cleaner component code
  const actions = {
    // Node operations
    addNode: useCallback((position, nodeData) => {
      dispatch({ type: 'node/add', position, nodeData })
    }, []),

    removeNode: useCallback((nodeId) => {
      dispatch({ type: 'node/remove', nodeId })
    }, []),

    moveNode: useCallback((nodeId, x, y) => {
      dispatch({ type: 'node/move', nodeId, x, y })
    }, []),

    moveNodes: useCallback((moves) => {
      dispatch({ type: 'nodes/move', moves })
    }, []),

    updateNode: useCallback((nodeId, updates) => {
      dispatch({ type: 'node/update', nodeId, updates })
    }, []),

    resizeNode: useCallback((nodeId, size, width, height) => {
      dispatch({ type: 'node/resize', nodeId, size, width, height })
    }, []),

    updateNodePosition: useCallback((nodeId: string, updates: Record<string, any>) => {
      dispatch({ type: 'node/updatePosition', nodeId, updates })
    }, []),

    // Connector operations
    addConnector: useCallback((from, to, fromAnchor, toAnchor, style) => {
      dispatch({ type: 'connector/add', from, to, fromAnchor, toAnchor, style })
    }, []),

    removeConnector: useCallback((index) => {
      dispatch({ type: 'connector/remove', index })
    }, []),

    updateConnector: useCallback((index, updates) => {
      dispatch({ type: 'connector/update', index, updates })
    }, []),

    // Group operations
    addGroup: useCallback((group) => {
      dispatch({ type: 'group/add', group })
    }, []),

    updateGroup: useCallback((groupId, updates) => {
      dispatch({ type: 'group/update', groupId, updates })
    }, []),

    removeGroup: useCallback((groupId) => {
      dispatch({ type: 'group/remove', groupId })
    }, []),

    // Image operations
    addImage: useCallback((image) => {
      dispatch({ type: 'image/add', image })
    }, []),

    updateImage: useCallback((imageId, updates) => {
      dispatch({ type: 'image/update', imageId, updates })
    }, []),

    removeImage: useCallback((imageId) => {
      dispatch({ type: 'image/remove', imageId })
    }, []),

    // Export zone
    setExportZone: useCallback((zone) => {
      dispatch({ type: 'exportZone/set', zone })
    }, []),

    clearExportZone: useCallback(() => {
      dispatch({ type: 'exportZone/clear' })
    }, []),

    // Selection
    selectNode: useCallback((nodeId, addToSelection = false) => {
      dispatch({ type: 'select/node', nodeId, addToSelection })
    }, []),

    selectNodes: useCallback((nodeIds) => {
      dispatch({ type: 'select/nodes', nodeIds })
    }, []),

    selectConnector: useCallback((index) => {
      dispatch({ type: 'select/connector', index })
    }, []),

    selectGroup: useCallback((groupId) => {
      dispatch({ type: 'select/group', groupId })
    }, []),

    selectImage: useCallback((imageId) => {
      dispatch({ type: 'select/image', imageId })
    }, []),

    clearSelection: useCallback(() => {
      dispatch({ type: 'select/clear' })
    }, []),

    // Editor mode
    setMode: useCallback((mode) => {
      dispatch({ type: 'mode/set', mode })
    }, []),

    setPendingConnector: useCallback((pendingConnector) => {
      dispatch({ type: 'pending/set', pendingConnector })
    }, []),

    clearPendingConnector: useCallback(() => {
      dispatch({ type: 'pending/clear' })
    }, []),

    // Drag
    startDrag: useCallback((nodeId, offset, nodeOffsets, selectedIds) => {
      dispatch({ type: 'drag/start', nodeId, offset, nodeOffsets, selectedIds })
    }, []),

    endDrag: useCallback(() => {
      dispatch({ type: 'drag/end' })
    }, []),

    // File operations
    loadDiagram: useCallback((diagram, filename) => {
      dispatch({ type: 'diagram/load', diagram, filename })
    }, []),

    newDiagram: useCallback(() => {
      dispatch({ type: 'diagram/new' })
    }, []),

    markSaved: useCallback((filename) => {
      dispatch({ type: 'diagram/saved', filename })
    }, []),

    // History
    undo: useCallback(() => {
      dispatch({ type: 'undo' })
    }, []),

    redo: useCallback(() => {
      dispatch({ type: 'redo' })
    }, []),

    // Layout
    updateLayout: useCallback((updates) => {
      dispatch({ type: 'layout/update', updates })
    }, []),

    expandLayout: useCallback((width, height) => {
      dispatch({ type: 'layout/expand', width, height })
    }, []),

    // Template
    setTemplate: useCallback((templateId) => {
      dispatch({ type: 'template/set', templateId })
    }, []),

    // Zoom
    setZoom: useCallback((zoom) => {
      dispatch({ type: 'zoom/set', zoom })
    }, []),
    zoomIn: useCallback(() => {
      dispatch({ type: 'zoom/set', zoom: state.editor.zoom * 1.25 })
    }, [state.editor.zoom]),
    zoomOut: useCallback(() => {
      dispatch({ type: 'zoom/set', zoom: state.editor.zoom / 1.25 })
    }, [state.editor.zoom]),
    resetZoom: useCallback(() => {
      dispatch({ type: 'zoom/set', zoom: 1 })
    }, []),

    // View mode
    setViewMode: useCallback((viewMode: '2d' | 'isometric') => {
      dispatch({ type: 'viewMode/set', viewMode })
    }, []),
  }

  return (
    <EditorContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider')
  }
  return context
}

// Convenience hooks for specific parts of state
export function useDiagram() {
  const { state } = useEditor()
  return state.diagram
}

export function useEditorState() {
  const { state } = useEditor()
  return state.editor
}

export function useMeta() {
  const { state } = useEditor()
  return state.meta
}

export function useHistory() {
  const { state } = useEditor()
  return state.history
}

export function useTemplate() {
  const { state } = useEditor()
  return state.editor.template
}

export function useViewMode() {
  const { state } = useEditor()
  return state.editor.viewMode
}
