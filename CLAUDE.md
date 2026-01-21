# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Arc** is a visual diagram editor for creating architecture diagrams. It provides a drag-and-drop interface for designing system architectures that can be exported to Talkie landing pages.

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **TailwindCSS 4** - Utility-first styling
- **Lucide React** - SVG icon library
- **TypeScript** - Full type support

## Build Commands

```bash
pnpm dev      # Start dev server with HMR
pnpm build    # Production build to dist/
pnpm preview  # Preview production build
pnpm lint     # Run ESLint
```

## Architecture

### Project Structure

```
src/
├── main.jsx                        # React DOM entry point
├── App.jsx                         # Root with theme toggle
├── index.css                       # Tailwind imports
├── components/
│   ├── ArchitectureDiagram.jsx     # Legacy static renderer (kept for reference)
│   ├── editor/
│   │   ├── DiagramEditor.jsx       # Main editor layout
│   │   ├── EditorProvider.jsx      # Context + state management
│   │   ├── editorReducer.js        # useReducer logic
│   │   ├── Toolbar.jsx             # File/mode/history controls
│   │   ├── DiagramCanvas.jsx       # Interactive canvas with drag-and-drop
│   │   ├── EditableNode.jsx        # Draggable node component
│   │   ├── ConnectorLayer.jsx      # SVG connectors
│   │   ├── AnchorPoints.jsx        # Connection point indicators
│   │   └── PropertiesPanel.jsx     # Right sidebar for editing
│   ├── properties/
│   │   ├── NodeProperties.jsx      # Node editing form
│   │   ├── ConnectorProperties.jsx # Connector editing form
│   │   ├── IconPicker.jsx          # Icon selection grid
│   │   └── ColorPicker.jsx         # Color swatches
│   └── dialogs/
│       └── ExportDialog.jsx        # Export preview + copy
├── utils/
│   ├── constants.js                # Colors, sizes, anchors
│   ├── diagramHelpers.js           # Position/path calculations
│   ├── iconRegistry.js             # Icon name ↔ component mapping
│   └── fileOperations.js           # Save/load/export functions
└── hooks/
    └── useKeyboardShortcuts.js     # Keyboard handler
```

### State Management

Uses `useReducer` + Context for diagram state:

```javascript
{
  diagram: { layout, nodes, nodeData, connectors, connectorStyles },
  editor: { selectedNodeId, selectedConnectorIndex, mode, pendingConnector, isDragging },
  meta: { filename, isDirty, lastSaved },
  history: { past, future }
}
```

### Editor Modes

- **select** - Default mode. Click to select, drag to move nodes
- **addNode** - Click on canvas to place a new node
- **addConnector** - Click source anchor → click target anchor to connect

## Using the Editor

### Toolbar
- **New/Open/Save** - File operations (uses File System Access API)
- **Export** - Generate handoff format for Talkie
- **Select/+Node/+Line** - Mode selection
- **Undo/Redo** - History navigation
- **Delete** - Remove selected item

### Canvas
- **Drag nodes** to reposition
- **Click node** to select and edit properties
- **Click connector** to select and edit properties

### Properties Panel
- Edit name, subtitle, description
- Change icon (from Lucide set)
- Change color theme
- Change size (large/normal/small)
- Edit connector anchors and styles

### Keyboard Shortcuts
- `Delete/Backspace` - Delete selected
- `Escape` - Clear selection / cancel mode
- `Cmd+Z` - Undo
- `Cmd+Shift+Z` - Redo
- `Cmd+S` - Save
- `Cmd+N` - New diagram

### Zoom Controls
- **Scroll wheel** - Pan the canvas
- **Cmd/Ctrl + scroll** - Zoom in/out (focal point zoom)
- **Click percentage** - Type a custom zoom level
- **Double-click percentage** - Reset to initial zoom
- **+/- buttons** - Step through zoom levels (5% increments)
- **Fit button** - Auto-fit diagram to viewport

## Zoom Configuration

The `DiagramCanvas` component accepts a `zoomConfig` prop for customizing zoom behavior:

```typescript
interface ZoomConfig {
  defaultZoom?: number | 'fit'  // Initial zoom level, or 'fit' to auto-calculate
  zoomLevels?: number[]         // Custom zoom level steps (overrides zoomStep)
  zoomStep?: number             // Zoom increment per step (default: 0.05 = 5%)
}
```

### Usage Examples

```tsx
// Auto-fit to container (capped at 100%)
<DiagramCanvas zoomConfig={{ defaultZoom: 'fit' }} />

// Custom starting zoom
<DiagramCanvas zoomConfig={{ defaultZoom: 0.7 }} />

// 10% increments instead of 5%
<DiagramCanvas zoomConfig={{ zoomStep: 0.10 }} />

// Explicit zoom levels
<DiagramCanvas zoomConfig={{ zoomLevels: [0.5, 0.75, 1, 1.5, 2] }} />
```

### Zoom Defaults
- **Range:** 25% to 200%
- **Step:** 5% increments
- **Initial:** 100% (or calculated if `defaultZoom: 'fit'`)

## Diagram Config Format

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

## Handoff to Talkie Docs

Arc diagrams are consumed by the Talkie landing pages at `~/dev/TALKIE`.

**Export workflow:**
1. Click "Export" in toolbar
2. Copy the generated config
3. Paste into Talkie's ArchitectureDiagram.jsx

See `handoff.md` for the full export format spec.

## Development Notes

- Icons are stored as strings and resolved via `iconRegistry.js`
- Drag uses native pointer events with pointer capture
- SVG layer is `pointer-events-none` except for connectors
- History is capped at 50 states for undo/redo
