# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Arc** is diagrams as code: typed, diffable config rendered as clean, themeable architecture diagrams. This repo contains the Arc editor (visual editor app), the `ArcDiagram` renderer, the isometric renderer, and the arc.jdi.sh site.

Workspace packages: `@arach/arc` (root, renderer + editor components), `@arach/arc-editor` (`packages/arc-editor`, editor app), `@arach/arc-iso` (`packages/iso`, isometric renderer), `@arach/arc-viewer` (`packages/viewer`, native React renderers including Mermaid).

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **TailwindCSS 4** - Utility-first styling
- **Lucide React** - SVG icon library
- **TypeScript** - Full type support
- **Bun** - Package manager and script runner

## Build Commands

```bash
bun run dev        # Start dev server with HMR (port 5188)
bun run build      # Production build to dist/
bun run preview    # Preview production build
bun run lint       # Run ESLint
bun run typecheck  # Type-check without emitting
bun run build:lib  # Build the publishable library to lib/
```

## Architecture

### Project Structure

```
src/
├── main.tsx                        # React DOM entry point
├── App.tsx                         # Root component + routes
├── index.ts                        # Public package API
├── index.css                       # Tailwind imports
├── apps/
│   └── arc-editor/                 # Editor app shell (context, chrome)
├── components/
│   ├── editor/
│   │   ├── DiagramEditor.tsx       # Main editor layout
│   │   ├── EditorProvider.tsx      # Context + state management
│   │   ├── editorReducer.ts        # useReducer logic
│   │   ├── TopBar.tsx              # File/mode/history controls
│   │   ├── FloatingToolbar.tsx     # Canvas tool palette
│   │   ├── DiagramCanvas.tsx       # Interactive canvas with drag-and-drop
│   │   ├── EditableNode.tsx        # Draggable node component
│   │   ├── ConnectorLayer.tsx      # SVG connectors
│   │   ├── AnchorPoints.tsx        # Connection point indicators
│   │   ├── InspectorPanel.tsx      # Right sidebar for editing
│   │   ├── GroupLayer.tsx          # Group shapes
│   │   ├── ImageLayer.tsx          # Image nodes
│   │   ├── MiniMap.tsx             # Canvas overview
│   │   ├── TemplateSelector.tsx    # Style template picker
│   │   ├── ViewModeToggle.tsx      # 2D / isometric switch
│   │   └── ZoomControls.tsx        # Zoom UI
│   ├── properties/
│   │   ├── NodeProperties.tsx      # Node editing form
│   │   ├── ConnectorProperties.tsx # Connector editing form
│   │   ├── ConnectorStylesPanel.tsx# Connector style editor
│   │   ├── GroupProperties.tsx     # Group editing form
│   │   ├── ImageProperties.tsx     # Image editing form
│   │   ├── GridSettings.tsx        # Canvas grid settings
│   │   ├── IconPicker.tsx          # Icon selection grid
│   │   └── ColorPicker.tsx         # Color swatches
│   ├── dialogs/
│   │   ├── ExportDialog.tsx        # Export preview + copy
│   │   └── ShareSheet.tsx          # Share/embed dialog
│   └── diagrams/                   # Static diagram data (site pages)
├── utils/
│   ├── constants.ts                # Colors, sizes, anchors
│   ├── themes.ts                   # Theme definitions
│   ├── templates.ts                # Canvas style templates
│   ├── diagramHelpers.ts           # Position/path calculations
│   ├── iconRegistry.ts             # Icon name ↔ component mapping
│   ├── fileOperations.ts           # Save/load/export functions
│   ├── sessionStorage.ts           # localStorage session persistence
│   ├── autoLayout.ts               # Automatic layout
│   ├── yamlConfig.ts               # YAML config parse/serialize
│   └── asciiRenderer.ts            # ASCII diagram output
└── hooks/
    ├── useKeyboardShortcuts.ts     # Keyboard handler
    ├── useCanvasTransform.ts       # Pan/zoom transform
    └── useMeta.ts                  # Page metadata
```

### State Management

Uses `useReducer` + Context for diagram state:

```javascript
{
  diagram: { layout, nodes, nodeData, connectors, connectorStyles, groups, images },
  editor: { selectedNodeIds, selectedConnectorIndex, selectedGroupId, selectedImageId,
            mode, pendingConnector, pendingGroup, isDragging, template, zoom, viewMode,
            themeId, colorMode },
  meta: { filename, isDirty, lastSaved, diagramMeta },
  history: { past, future }
}
```

### Theme System

Eight themes (`default`, `warm`, `cool`, `mono`, `engineering`, `workbench`, `tactical`, `command`) defined in `src/utils/themes.ts`. Each has light/dark palettes that remap the eight logical node colors (violet, emerald, blue, amber, sky, zinc, rose, orange) to different Tailwind classes and hex stroke values.

- `useResolvedTheme()` hook returns the current theme palette
- `EditableNode` and `ConnectorLayer` resolve colors through the theme palette
- Theme ID and color mode are persisted in editor state and saved with diagrams
- The editor session default theme is `command`

### Editor Modes

- **select** - Default mode. Click to select, drag to move nodes
- **pan** - Drag to pan the canvas
- **addNode** - Click on canvas to place a new node
- **addConnector** - Click source anchor → click target anchor to connect
- **addGroup** - Drag to draw a group shape

## Using the Editor

### Top Bar
- **New/Open/Save** - File operations (uses File System Access API)
- **Export** - Copy the diagram config for `ArcDiagram`
- **Undo/Redo** - History navigation
- **Delete** - Remove selected item

### Canvas
- **Drag nodes** to reposition
- **Click node** to select and edit properties
- **Click connector** to select and edit properties

### Inspector Panel
- Edit name, subtitle, description
- Change icon (from the curated Lucide set in `iconRegistry.ts`)
- Change node color
- Change size (`xs` / `s` / `m` / `l`)
- Edit connector anchors and styles

### Keyboard Shortcuts
- `Delete/Backspace` - Delete selected
- `Escape` - Clear selection / cancel mode
- `Cmd+Z` - Undo
- `Cmd+Shift+Z` - Redo
- `Cmd+S` - Save
- `Cmd+N` - New diagram
- `V` / `H` / `N` / `C` - Select / pan / add-node / add-connector modes

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

Nodes respond to hover and click with visual feedback, enabled by default:

- **Hovered node** lifts up 2px with a colored glow shadow
- **Other nodes** dim to 45% opacity
- **Connected connectors** get a thicker stroke and bolder labels
- **Unconnected connectors** dim to 25% opacity
- **Click-to-lock**: click a node to lock the highlight state (works on touch devices), click again or click background to release
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
  dimOpacity: 0.45,     // 0-1 for dimmed nodes, connectors get ~56% of this (default: 0.45)
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

Diagrams are stored as JSON (the `ArcDiagramData` type):

```json
{
  "layout": { "width": 700, "height": 340 },
  "nodes": { "nodeId": { "x": 25, "y": 15, "size": "m" } },
  "nodeData": { "nodeId": { "icon": "Monitor", "name": "...", "color": "violet" } },
  "connectors": [{ "from": "a", "to": "b", "fromAnchor": "right", "toAnchor": "left", "style": "http" }],
  "connectorStyles": { "http": { "color": "amber", "strokeWidth": 2, "label": "HTTP" } }
}
```

Node sizes are `xs | s | m | l`. Anchors: left, right, top, bottom, bottomLeft, bottomRight, topLeft, topRight.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/editor` | New diagram (generates session ID) |
| `/editor/:sessionId` | Edit diagram with auto-save to localStorage |
| `/player/*` | Read-only rendering with full theme fidelity |
| `/docs` | Documentation index |
| `/docs/:page` | Individual documentation pages |
| `/blog/native-mermaid-sequences` | Blog post |
| `/iso-demo`, `/iso-examples`, `/iso-interactive` | Isometric renderer demos |
| `/inspiration` | Example diagrams |
| `/capture/:sessionId` | PNG screenshot endpoint (dev only, Puppeteer middleware) |

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

## Exporting Diagrams

The Export dialog generates the diagram config for use with the `ArcDiagram` renderer's `data` prop:

1. Click **Export** in the top bar
2. Copy the generated config
3. Pass it to `<ArcDiagram data={...} />`

See `docs/exports.md` for the full export format reference (JSON, YAML, SVG, PNG, ASCII).

## Development Notes

- Icons are stored as strings and resolved via `iconRegistry.ts`
- Drag uses native pointer events with pointer capture
- SVG layer is `pointer-events-none` except for connectors
- History is capped at 50 states for undo/redo
- Theme colors flow through `useResolvedTheme()` → `EditableNode` / `ConnectorLayer`
- Capture middleware keeps a Puppeteer browser alive for 60s between requests
