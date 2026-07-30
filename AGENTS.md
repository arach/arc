# AGENTS.md

This file provides guidance to Codex when working with this repository.

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
  diagram: { layout, nodes, nodeData, connectors, connectorStyles, groups, images },
  editor: { selectedNodeIds, selectedConnectorIndex, mode, pendingConnector, isDragging, themeId, colorMode },
  meta: { filename, isDirty, lastSaved, diagramMeta },
  history: { past, future }
}
```

### Theme System

Four themes (`default`, `warm`, `cool`, `mono`) defined in `src/utils/themes.ts`. Each has light/dark palettes that remap logical colors (violet, emerald, etc.) to different Tailwind classes and hex stroke values.

- `useResolvedTheme()` hook returns the current theme palette
- `EditableNode` and `ConnectorLayer` resolve colors through the theme palette
- Theme ID and color mode are persisted in editor state and saved with diagrams

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

## Node Hover Interactivity

Nodes respond to hover and click with visual feedback — enabled by default:

- **Hovered node** lifts up 2px with a colored glow shadow
- **Other nodes** dim to 45% opacity
- **Connected connectors** get a thicker stroke and bolder labels
- **Unconnected connectors** dim to 25% opacity
- **Click-to-lock** — click a node to lock the highlight state (works on touch devices), click again or click background to release
- All transitions animate at 200ms ease-out

### `hoverEffects` Prop

```tsx
// All effects (default)
<ArcDiagram data={diagram} hoverEffects={true} />

// No hover effects
<ArcDiagram data={diagram} hoverEffects={false} />

// Granular control
<ArcDiagram data={diagram} hoverEffects={{
  dim: true,            // dim unrelated nodes/connectors (default: true)
  dimOpacity: 0.45,     // 0–1 for dimmed nodes, connectors get ~56% of this (default: 0.45)
  lift: true,           // translateY(-2px) on hover (default: true)
  glow: true,           // colored shadow on hover (default: true)
  highlightEdges: true, // thicken connected edges (default: true)
}} />

// Highlight without dimming (good for dense diagrams)
<ArcDiagram data={diagram} hoverEffects={{ dim: false }} />

// Subtle dim, no lift
<ArcDiagram data={diagram} hoverEffects={{ dimOpacity: 0.7, lift: false }} />
```

### `onNodeHover` Callback

```tsx
<ArcDiagram
  data={diagram}
  onNodeHover={(nodeId) => {
    // nodeId is the hovered/clicked node's key, or null on release
    console.log('Active:', nodeId)
  }}
/>
```

### `maxFitZoom` Prop

When using `defaultZoom="fit"`, caps the calculated zoom level:

```tsx
// Fit to container but never exceed 85%
<ArcDiagram data={diagram} defaultZoom="fit" maxFitZoom={0.85} />
```

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

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/editor` | New diagram (generates session ID) |
| `/editor/:sessionId` | Edit diagram with auto-save to localStorage |
| `/player/*` | Read-only rendering with full theme fidelity |
| `/capture/:sessionId` | PNG screenshot endpoint (Puppeteer middleware) |
| `/docs` | Documentation |

## Session Persistence

Diagrams are auto-saved to `localStorage` keyed by session ID (`arc-session-{id}`). Utilities in `src/utils/sessionStorage.ts`.

**Edit button flow:** Embedded `ArcDiagram` → click Edit → `#data=<base64>` hash → editor parses, saves to localStorage, redirects to `/editor/{id}`.

**Diagram file format:** When saving to file, `_meta` is included:
```json
{
  "layout": { ... },
  "nodes": { ... },
  "_meta": { "themeId": "cool", "colorMode": "light", "viewport": { "width": 800, "height": 400 } }
}
```

## Screenshot API (Dev Only)

The `/capture/:sessionId` endpoint (Vite middleware in `plugins/captureMiddleware.js`) returns a PNG:

```bash
# Capture with hash data
curl "http://localhost:5188/capture/my-diagram?hash=<base64>" > out.png

# Capture existing session
curl "http://localhost:5188/capture/my-diagram" > out.png

# Custom size
curl "http://localhost:5188/capture/my-diagram?width=1200&height=600" > out.png
```

There is also `scripts/preview.mjs` for CLI-based iteration.

## Handoff to Talkie Docs

Arc diagrams are consumed by the Talkie landing pages at `~/dev/TALKIE`.

**Export workflow:**
1. Click "Export" in toolbar
2. Copy the generated config
3. Paste into Talkie's ArchitectureDiagram.jsx

See `handoff.md` for the full export format spec.

## Development Notes

- Icons are stored as strings and resolved via `iconRegistry.ts`
- Drag uses native pointer events with pointer capture
- SVG layer is `pointer-events-none` except for connectors
- History is capped at 50 states for undo/redo
- Theme colors flow through `useResolvedTheme()` → `EditableNode` / `ConnectorLayer`
- Capture middleware keeps a Puppeteer browser alive for 60s between requests
