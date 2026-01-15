---
title: Architecture
description: How the Arc editor is built - state management, modules, and data flow
order: 3
---

# Arc Architecture Overview

Arc is organized around a single diagram model and a small set of modules that read, edit, and
export that model. The goal is to keep editor behavior, state management, and export logic
separate so outputs stay stable even as the UI evolves.

## Major Modules

- `src/components/editor/`: The editor shell (top bar, canvas, panels, layers).
- `src/components/properties/`: Forms for editing node, connector, group, and grid settings.
- `src/components/dialogs/`: Export and share dialogs.
- `src/hooks/`: Keyboard shortcuts and canvas transform helpers.
- `src/utils/`: Diagram helpers, templates, export utilities, and file operations.
- `src/types/`: TypeScript types for diagram + editor state.

## State Model

State lives in a reducer + context pair (`EditorProvider`, `editorReducer`). The state shape is
split into four slices:

- `diagram`: layout, nodes, nodeData, connectors, connectorStyles, groups, images, exportZone
- `editor`: selection, mode, pending actions, template, zoom
- `meta`: filename, dirty state, last saved
- `history`: undo/redo stacks (capped for performance)

The reducer records history on meaningful changes and drives all interactions (add/remove nodes,
update connectors, change templates, etc.).

## Data Flow

1. **Input**: The editor dispatches actions from UI events.
2. **Reducer**: `editorReducer` updates the diagram and tracks history.
3. **Canvas**: `DiagramCanvas` renders nodes, connectors, groups, and images.
4. **Properties**: The panel writes updates back to the reducer.
5. **Export**: `exportUtils` and `fileOperations` serialize the model for external use.

## Diagram Config

Exported diagrams are declarative and designed to be embedded elsewhere:

```ts
{
  layout: { width: 1200, height: 700 },
  nodes: { api: { x: 80, y: 120, size: 'm' } },
  nodeData: { api: { icon: 'Server', name: 'API', color: 'emerald' } },
  connectors: [
    { from: 'web', to: 'api', fromAnchor: 'right', toAnchor: 'left', style: 'http' }
  ],
  connectorStyles: { http: { color: 'amber', strokeWidth: 2, label: 'HTTP' } }
}
```

Keep configs in version control so architecture updates travel with the product.
