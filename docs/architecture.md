---
title: Architecture
description: How the Arc editor is built
order: 5
---

# Architecture

## Major Modules

Arc is organized into several key modules:

| Module | Path | Purpose |
|--------|------|---------|
| Editor | `src/components/editor/` | Visual drag-and-drop editor |
| Player | `src/player/` | Lightweight renderer |
| Utils | `src/utils/` | Shared helpers |

## State Model

The editor uses `useReducer` + Context for state management:

```typescript
{
  diagram: { layout, nodes, nodeData, connectors, connectorStyles },
  editor: { selectedNodeId, selectedConnectorIndex, mode, pendingConnector, isDragging },
  meta: { filename, isDirty, lastSaved },
  history: { past, future }
}
```

## Data Flow

1. **User Action** → Dispatch action to reducer
2. **Reducer** → Updates state immutably, pushes to history
3. **Context** → Propagates new state to components
4. **Canvas** → Re-renders affected nodes/connectors

## Diagram Config

Diagrams are stored as JSON:

```json
{
  "layout": { "width": 700, "height": 340 },
  "nodes": { "nodeId": { "x": 25, "y": 15, "size": "large" } },
  "nodeData": { "nodeId": { "icon": "Monitor", "name": "...", "color": "violet" } },
  "connectors": [{ "from": "a", "to": "b", "fromAnchor": "right", "toAnchor": "left", "style": "http" }],
  "connectorStyles": { "http": { "color": "amber", "strokeWidth": 2, "label": "HTTP" } }
}
```

## Editor Modes

- **select** - Default mode. Click to select, drag to move nodes
- **addNode** - Click on canvas to place a new node
- **addConnector** - Click source anchor → click target anchor to connect
