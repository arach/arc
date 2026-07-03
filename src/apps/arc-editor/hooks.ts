import { createElement } from 'react'
import type { CommandOption, StatusColor } from 'hudsonkit'
import {
  File,
  FolderOpen,
  Save,
  Share,
  MousePointer2,
  Move,
  Plus,
  Link2,
  Undo2,
  Redo2,
  Trash2,
} from 'lucide-react'
import { useEditor, useDiagram, useEditorState, useMeta } from '../../components/editor/EditorProvider'
import { useArcEditor } from './ArcEditorContext'
import { ArcEditorNavActions, ArcEditorNavCenter } from './ArcEditorChrome'

const MODE_LABELS: Record<string, string> = {
  select: 'Select',
  pan: 'Pan',
  addNode: 'Add node',
  addConnector: 'Add connector',
  addRect: 'Add rectangle',
  addCircle: 'Add circle',
}

export function useArcEditorCommands(): CommandOption[] {
  const { actions } = useEditor()
  const editor = useEditorState()
  const { handleNew, handleOpen, handleSave, openShare } = useArcEditor()

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

  return [
    {
      id: 'arc:new',
      label: 'New diagram',
      icon: createElement(File, { size: 14 }),
      shortcut: '⌘N',
      action: handleNew,
    },
    {
      id: 'arc:open',
      label: 'Open diagram',
      icon: createElement(FolderOpen, { size: 14 }),
      action: () => { void handleOpen() },
    },
    {
      id: 'arc:save',
      label: 'Save diagram',
      icon: createElement(Save, { size: 14 }),
      shortcut: '⌘S',
      action: () => { void handleSave() },
    },
    {
      id: 'arc:share',
      label: 'Share diagram',
      icon: createElement(Share, { size: 14 }),
      action: openShare,
    },
    {
      id: 'arc:mode-select',
      label: 'Select mode',
      icon: createElement(MousePointer2, { size: 14 }),
      shortcut: 'V',
      action: () => actions.setMode('select'),
    },
    {
      id: 'arc:mode-pan',
      label: 'Pan mode',
      icon: createElement(Move, { size: 14 }),
      shortcut: 'H',
      action: () => actions.setMode('pan'),
    },
    {
      id: 'arc:mode-add-node',
      label: 'Add node',
      icon: createElement(Plus, { size: 14 }),
      shortcut: 'N',
      action: () => actions.setMode('addNode'),
    },
    {
      id: 'arc:mode-add-connector',
      label: 'Add connector',
      icon: createElement(Link2, { size: 14 }),
      shortcut: 'C',
      action: () => actions.setMode('addConnector'),
    },
    {
      id: 'arc:undo',
      label: 'Undo',
      icon: createElement(Undo2, { size: 14 }),
      shortcut: '⌘Z',
      action: actions.undo,
    },
    {
      id: 'arc:redo',
      label: 'Redo',
      icon: createElement(Redo2, { size: 14 }),
      shortcut: '⌘⇧Z',
      action: actions.redo,
    },
    {
      id: 'arc:delete',
      label: 'Delete selection',
      icon: createElement(Trash2, { size: 14 }),
      action: handleDelete,
    },
  ]
}

export function useArcEditorStatus(): { label: string; color: StatusColor } {
  const diagram = useDiagram()
  const meta = useMeta()
  const editor = useEditorState()
  const nodeCount = Object.keys(diagram.nodes || {}).length

  if (meta.isDirty) {
    return { label: `${nodeCount} nodes · edited`, color: 'neutral' }
  }

  const modeLabel = MODE_LABELS[editor.mode] || editor.mode
  return { label: `${nodeCount} nodes · ${modeLabel.toLowerCase()}`, color: 'neutral' }
}

export function useArcEditorStatusRight() {
  const editor = useEditorState()
  const modeLabel = MODE_LABELS[editor.mode] || editor.mode
  return createElement('span', { className: 'arc-editor-status-mode' }, modeLabel)
}

export function useArcEditorNavCenter() {
  return createElement(ArcEditorNavCenter)
}

export function useArcEditorNavActions() {
  return createElement(ArcEditorNavActions)
}

export function useArcEditorLayoutMode(): 'panel' {
  return 'panel'
}