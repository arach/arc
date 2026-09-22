# Architecture - Agent Context

## Project Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root component + routes
├── components/
│   ├── editor/
│   │   ├── DiagramEditor.tsx   # Main editor layout
│   │   ├── EditorProvider.tsx  # State context + reducer
│   │   ├── editorReducer.ts    # State logic
│   │   ├── TopBar.tsx          # File/mode controls
│   │   ├── DiagramCanvas.tsx   # Interactive canvas
│   │   ├── EditableNode.tsx    # Draggable nodes
│   │   ├── ConnectorLayer.tsx  # SVG connectors
│   │   ├── AnchorPoints.tsx    # Connection points
│   │   └── InspectorPanel.tsx  # Right sidebar
│   ├── properties/
│   │   ├── NodeProperties.tsx
│   │   ├── ConnectorProperties.tsx
│   │   ├── IconPicker.tsx
│   │   └── ColorPicker.tsx
│   └── dialogs/
│       └── ExportDialog.tsx
├── utils/
│   ├── constants.ts            # Colors, sizes, anchors
│   ├── diagramHelpers.ts       # Position/path calcs
│   ├── iconRegistry.ts         # Icon name → component
│   └── fileOperations.ts       # Save/load/export
└── hooks/
    └── useKeyboardShortcuts.ts
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
| Add icon | `src/utils/iconRegistry.ts` |
| Add color | `src/utils/constants.ts` → `COLORS` |
| Change node size | `src/utils/constants.ts` → `NODE_SIZES` |
| Edit drag behavior | `src/components/editor/EditableNode.tsx` |
| Edit connector paths | `src/components/editor/ConnectorLayer.tsx` |
| Add toolbar action | `src/components/editor/TopBar.tsx` |
| New export format | `src/utils/fileOperations.ts` |

## Editor Modes

| Mode | Behavior |
|------|----------|
| `select` | Click to select, drag to move |
| `addNode` | Click canvas to place node |
| `addConnector` | Click source anchor, then target anchor |

## Commands

```bash
bun run dev       # Dev server with HMR (port 5188)
bun run build     # Production build
bun run lint      # ESLint check
bun run preview   # Preview production build
```
