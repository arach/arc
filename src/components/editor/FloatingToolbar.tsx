import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import {
  Plus, Link2, MousePointer2, Move,
  Undo2, Redo2, Trash2,
  Square, Circle, Crop, GripVertical, Wand2,
  type LucideIcon,
} from 'lucide-react'
import { useEditor, useEditorState, useHistory, useDiagram } from './EditorProvider'
import { NODE_SIZES } from '../../utils/constants'
import { autoLayout } from '../../utils/autoLayout'

interface ToolButtonProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}

function ToolButton({ icon: Icon, label, onClick, active = false, disabled = false }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`arc-editor-tool-btn${active ? ' is-active' : ''}`}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
    </button>
  )
}

function Divider() {
  return <div className="arc-editor-tool-divider" />
}

export default function FloatingToolbar() {
  const { actions } = useEditor()
  const editor = useEditorState()
  const history = useHistory()
  const diagram = useDiagram()

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  // Bumped on resize so the clamp below re-runs against the new canvas.
  const [bounds, setBounds] = useState(0)

  useEffect(() => {
    const onResize = () => setBounds(n => n + 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Pull the toolbar back inside the canvas. Dragged past an edge there is no
  // way to grab it again, and a shrinking window can strand it just as easily.
  useLayoutEffect(() => {
    const el = wrapRef.current
    const parent = el?.offsetParent as HTMLElement | null
    if (!el || !parent) return
    const margin = 8
    const rect = el.getBoundingClientRect()
    const box = parent.getBoundingClientRect()
    // Left/top win when the toolbar is larger than the space it sits in.
    const dx = rect.left < box.left + margin
      ? box.left + margin - rect.left
      : Math.min(0, Math.max(box.right - margin - rect.right, box.left + margin - rect.left))
    const dy = rect.top < box.top + margin
      ? box.top + margin - rect.top
      : Math.min(0, Math.max(box.bottom - margin - rect.bottom, box.top + margin - rect.top))
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
      setPosition(p => ({ x: p.x + dx, y: p.y + dy }))
    }
  }, [position, bounds])

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    }
  }, [position])

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setPosition({
      x: dragRef.current.startPosX + dx,
      y: dragRef.current.startPosY + dy,
    })
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    dragRef.current = null
  }, [])

  const resetPosition = useCallback(() => setPosition({ x: 0, y: 0 }), [])

  // The grip is focusable, so it has to answer to the keyboard too.
  const handleGripKey = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 24 : 6
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const move = moves[e.key]
    if (move) {
      e.preventDefault()
      setPosition(p => ({ x: p.x + move[0], y: p.y + move[1] }))
      return
    }
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      resetPosition()
    }
  }, [resetPosition])

  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0
  const hasSelection = editor.selectedNodeIds?.length > 0 ||
    editor.selectedConnectorIndex !== null ||
    editor.selectedGroupId !== null ||
    editor.selectedImageId !== null
  const hasExportZone = diagram.exportZone !== null

  const handleDelete = () => {
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
  }

  const handleToggleExportZone = () => {
    // If nodes are selected, set export zone to fit selection
    if (editor.selectedNodeIds?.length > 0) {
      const padding = 40
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

      for (const nodeId of editor.selectedNodeIds) {
        const node = diagram.nodes[nodeId]
        if (!node) continue
        const size = NODE_SIZES[node.size] || NODE_SIZES.m
        const nodeWidth = size.width
        const nodeHeight = size.height

        minX = Math.min(minX, node.x)
        minY = Math.min(minY, node.y)
        maxX = Math.max(maxX, node.x + nodeWidth)
        maxY = Math.max(maxY, node.y + nodeHeight)
      }

      if (minX !== Infinity) {
        actions.setExportZone({
          x: Math.max(0, Math.round(minX - padding)),
          y: Math.max(0, Math.round(minY - padding)),
          width: Math.round(maxX - minX + padding * 2),
          height: Math.round(maxY - minY + padding * 2),
        })
      }
    } else if (hasExportZone) {
      actions.clearExportZone()
    } else {
      const { width, height } = diagram.layout
      const zoneWidth = Math.min(800, width * 0.8)
      const zoneHeight = Math.min(600, height * 0.8)
      actions.setExportZone({
        x: Math.round((width - zoneWidth) / 2),
        y: Math.round((height - zoneHeight) / 2),
        width: Math.round(zoneWidth),
        height: Math.round(zoneHeight),
      })
    }
    actions.setMode('select')
  }

  return (
    <div
      ref={wrapRef}
      data-arc-float
      className="arc-editor-toolbar-dock"
      style={{
        transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)`,
      }}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerLeave={handleDragEnd}
    >
      <div
        className={`arc-editor-toolbar${isDragging ? ' is-dragging' : ''}`}
        role="toolbar"
        aria-label="Diagram editing tools"
      >
        <div
          className="arc-editor-drag-handle"
          onPointerDown={handleDragStart}
          onDoubleClick={resetPosition}
          onKeyDown={handleGripKey}
          role="button"
          aria-label="Move toolbar — drag, or arrow keys to nudge; double-click to recentre"
          title="Drag to move · double-click to recentre"
          tabIndex={0}
        >
          <GripVertical className="w-4 h-4" strokeWidth={1.75} />
        </div>

        <Divider />

        {/* Selection tools */}
        <ToolButton
          icon={MousePointer2}
          label="Select (V)"
          onClick={() => actions.setMode('select')}
          active={editor.mode === 'select'}
        />
        <ToolButton
          icon={Move}
          label="Pan (H / Space)"
          onClick={() => actions.setMode('pan')}
          active={editor.mode === 'pan'}
        />

        <Divider />

        {/* Creation tools */}
        <ToolButton
          icon={Plus}
          label="Add node (N)"
          onClick={() => actions.setMode('addNode')}
          active={editor.mode === 'addNode'}
        />
        <ToolButton
          icon={Link2}
          label="Add connector (C)"
          onClick={() => actions.setMode('addConnector')}
          active={editor.mode === 'addConnector'}
        />
        <ToolButton
          icon={Square}
          label="Rectangle group (R)"
          onClick={() => actions.setMode('addRect')}
          active={editor.mode === 'addRect'}
        />
        <ToolButton
          icon={Circle}
          label="Circle group (O)"
          onClick={() => actions.setMode('addCircle')}
          active={editor.mode === 'addCircle'}
        />

        <Divider />

        {/* Auto-layout */}
        <ToolButton
          icon={Wand2}
          label="Auto-layout (A)"
          onClick={() => {
            const diagramData = {
              layout: diagram.layout,
              nodes: diagram.nodes,
              nodeData: diagram.nodeData,
              connectors: diagram.connectors,
              connectorStyles: diagram.connectorStyles,
            }
            const laid = autoLayout(diagramData as any)
            actions.loadDiagram({
              ...diagram,
              layout: laid.layout,
              nodes: laid.nodes as any,
              connectors: laid.connectors as any,
            }, undefined)
          }}
        />

        <Divider />

        {/* Export zone */}
        <ToolButton
          icon={Crop}
          label={
            editor.selectedNodeIds?.length > 0
              ? "Crop to selection"
              : hasExportZone
                ? "Clear export zone"
                : "Set export zone"
          }
          onClick={handleToggleExportZone}
          active={hasExportZone}
        />

        <Divider />

        {/* History */}
        <ToolButton
          icon={Undo2}
          label="Undo (⌘Z)"
          onClick={actions.undo}
          disabled={!canUndo}
        />
        <ToolButton
          icon={Redo2}
          label="Redo (⌘⇧Z)"
          onClick={actions.redo}
          disabled={!canRedo}
        />

        <Divider />

        {/* Delete */}
        <ToolButton
          icon={Trash2}
          label="Delete"
          onClick={handleDelete}
          disabled={!hasSelection}
        />
      </div>
    </div>
  )
}
