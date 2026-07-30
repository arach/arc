// @ts-nocheck
'use client';

import { useCallback } from 'react';
import type { CommandOption } from 'hudsonkit';
import { useEditor, useEditorState, useMeta, useHistory } from '../components/editor/EditorProvider';
import { saveDiagram, loadDiagram } from '../utils/fileOperations';
import { autoLayout } from '../utils/autoLayout';

export function useArcCommands(): CommandOption[] {
  const { actions, state } = useEditor();
  const editor = useEditorState();
  const meta = useMeta();

  const handleNew = useCallback(() => {
    if (meta.isDirty && !window.confirm('Discard unsaved changes?')) return;
    actions.newDiagram();
  }, [meta.isDirty, actions]);

  const handleOpen = useCallback(async () => {
    if (meta.isDirty && !window.confirm('Discard unsaved changes?')) return;
    const result = await loadDiagram() as { diagram: any; filename: string; meta?: any } | null;
    if (result) {
      const { _meta, ...diagramData } = result.diagram;
      actions.loadDiagram(diagramData, result.filename, _meta || result.meta || {});
    }
  }, [meta.isDirty, actions]);

  const handleSave = useCallback(async () => {
    const diagramMeta = (meta.diagramMeta || {}) as Record<string, any>;
    const diagramWithMeta = { ...state.diagram, _meta: diagramMeta };
    const filename = await saveDiagram(diagramWithMeta, meta.filename || 'diagram.json');
    if (filename) actions.markSaved(filename);
  }, [state.diagram, meta, actions]);

  const handleDelete = useCallback(() => {
    if (editor.selectedNodeIds?.length > 0) {
      for (const nodeId of editor.selectedNodeIds) actions.removeNode(nodeId);
    } else if (editor.selectedConnectorIndex !== null) {
      actions.removeConnector(editor.selectedConnectorIndex);
    } else if (editor.selectedGroupId !== null) {
      actions.removeGroup(editor.selectedGroupId);
    }
  }, [editor.selectedNodeIds, editor.selectedConnectorIndex, editor.selectedGroupId, actions]);

  const handleAutoLayout = useCallback(() => {
    const result = autoLayout(state.diagram);
    if (result) actions.loadDiagram(result, meta.filename || null, meta.diagramMeta || {});
  }, [state.diagram, meta, actions]);

  return [
    { id: 'arc:new', label: 'New Diagram', action: handleNew, shortcut: 'Cmd+N' },
    { id: 'arc:open', label: 'Open Diagram...', action: handleOpen, shortcut: 'Cmd+O' },
    { id: 'arc:save', label: 'Save Diagram', action: handleSave, shortcut: 'Cmd+S' },
    { id: 'arc:undo', label: 'Undo', action: actions.undo, shortcut: 'Cmd+Z' },
    { id: 'arc:redo', label: 'Redo', action: actions.redo, shortcut: 'Cmd+Shift+Z' },
    { id: 'arc:delete', label: 'Delete Selected', action: handleDelete, shortcut: 'Backspace' },
    { id: 'arc:select-mode', label: 'Select Mode', action: () => actions.setMode('select'), shortcut: 'V' },
    { id: 'arc:connect-mode', label: 'Connect Mode', action: () => actions.setMode('connect'), shortcut: 'C' },
    { id: 'arc:pan-mode', label: 'Pan Mode', action: () => actions.setMode('pan'), shortcut: 'H' },
    { id: 'arc:auto-layout', label: 'Auto Layout', action: handleAutoLayout },
    { id: 'arc:zoom-in', label: 'Zoom In', action: actions.zoomIn, shortcut: 'Cmd+=' },
    { id: 'arc:zoom-out', label: 'Zoom Out', action: actions.zoomOut, shortcut: 'Cmd+-' },
    { id: 'arc:zoom-reset', label: 'Reset Zoom', action: actions.resetZoom, shortcut: 'Cmd+0' },
    { id: 'arc:clear-selection', label: 'Clear Selection', action: actions.clearSelection, shortcut: 'Escape' },
  ];
}

export function useArcStatus() {
  const meta = useMeta();
  const editor = useEditorState();
  const history = useHistory();
  const nodeCount = Object.keys(meta.diagramMeta || {}).length > 0 ? 'EDITING' : 'READY';

  if (meta.isDirty) return { label: 'MODIFIED', color: 'amber' as const };
  return { label: nodeCount, color: 'emerald' as const };
}
