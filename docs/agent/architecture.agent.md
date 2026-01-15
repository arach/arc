# Architecture - Agent Context

## Project Structure

```
src/
├── main.jsx                    # Entry point
├── App.jsx                     # Root component
├── components/
│   ├── editor/
│   │   ├── DiagramEditor.jsx   # Main editor layout
│   │   ├── EditorProvider.jsx  # State context + reducer
│   │   ├── editorReducer.js    # State logic
│   │   ├── Toolbar.jsx         # File/mode controls
│   │   ├── DiagramCanvas.jsx   # Interactive canvas
│   │   ├── EditableNode.jsx    # Draggable nodes
│   │   ├── ConnectorLayer.jsx  # SVG connectors
│   │   ├── AnchorPoints.jsx    # Connection points
│   │   └── PropertiesPanel.jsx # Right sidebar
│   ├── properties/
│   │   ├── NodeProperties.jsx
│   │   ├── ConnectorProperties.jsx
│   │   ├── IconPicker.jsx
│   │   └── ColorPicker.jsx
│   └── dialogs/
│       └── ExportDialog.jsx
├── utils/
│   ├── constants.js            # Colors, sizes, anchors
│   ├── diagramHelpers.js       # Position/path calcs
│   ├── iconRegistry.js         # Icon name → component
│   └── fileOperations.js       # Save/load/export
└── hooks/
    └── useKeyboardShortcuts.js
```

## State Shape

```typescript
{
  diagram: {
    layout: { width, height },
    nodes: Record<string, { x, y, size }>,
    nodeData: Record<string, { icon, name, color, ... }>,
    connectors: Array<{ from, to, fromAnchor, toAnchor, style }>,
    connectorStyles: Record<string, { color, strokeWidth, label, ... }>
  },
  editor: {
    selectedNodeId: string | null,
    selectedConnectorIndex: number | null,
    mode: 'select' | 'addNode' | 'addConnector',
    pendingConnector: { from, fromAnchor } | null,
    isDragging: boolean
  },
  meta: {
    filename: string | null,
    isDirty: boolean,
    lastSaved: Date | null
  },
  history: {
    past: DiagramState[],
    future: DiagramState[]
  }
}
```

## Data Flow

```
User Action → dispatch(action) → editorReducer → new state → Context → re-render
```

## Key Files to Modify

| Task | File(s) |
|------|---------|
| Add icon | `src/utils/iconRegistry.js` |
| Add color | `src/utils/constants.js` → `COLORS` |
| Change node size | `src/utils/constants.js` → `NODE_SIZES` |
| Edit drag behavior | `src/components/editor/EditableNode.jsx` |
| Edit connector paths | `src/components/editor/ConnectorLayer.jsx` |
| Add toolbar action | `src/components/editor/Toolbar.jsx` |
| New export format | `src/utils/fileOperations.js` |

## Editor Modes

| Mode | Behavior |
|------|----------|
| `select` | Click to select, drag to move |
| `addNode` | Click canvas to place node |
| `addConnector` | Click source anchor, then target anchor |

## Commands

```bash
pnpm dev      # Dev server with HMR
pnpm build    # Production build
pnpm lint     # ESLint check
pnpm preview  # Preview production build
```
