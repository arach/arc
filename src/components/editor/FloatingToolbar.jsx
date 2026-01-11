import React from 'react'
import {
  Plus, Link2, MousePointer2, Move,
  Undo2, Redo2, Trash2,
  Square, Circle, Crop,
} from 'lucide-react'
import { useEditor, useEditorState, useHistory, useDiagram } from './EditorProvider'
import { NODE_SIZES } from '../../utils/constants'

function ToolButton({ icon: Icon, label, onClick, active, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`
        p-2 rounded-lg transition-all
        ${active
          ? 'bg-blue-500 text-white shadow-sm'
          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
        }
        ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
      `}
    >
      <Icon className="w-4 h-4" strokeWidth={2} />
    </button>
  )
}

function Divider() {
  return <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-600 mx-0.5" />
}

export default function FloatingToolbar() {
  const { actions } = useEditor()
  const editor = useEditorState()
  const history = useHistory()
  const diagram = useDiagram()

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
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700">
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
