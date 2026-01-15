# Arc Skills

> Pre-built skills for AI coding assistants working with Arc

## Available Skills

### arc-diagram

Create and modify Arc architecture diagrams.

**Trigger**: When user asks to create, edit, or work with architecture diagrams

**Capabilities**:
- Generate ArcDiagramData from natural language descriptions
- Add/remove/modify nodes and connectors
- Apply themes and styling
- Convert between JSON and TypeScript formats

**Context to provide**:
```
Arc diagram format: JSON with layout, nodes, nodeData, connectors, connectorStyles
Valid colors: violet, emerald, blue, amber, sky, zinc, rose, orange
Valid sizes: s, m, l
Valid anchors: left, right, top, bottom, topLeft, topRight, bottomLeft, bottomRight
Icons: Any Lucide icon name (Server, Database, Monitor, Cloud, etc.)
```

---

### arc-editor-dev

Develop and debug the Arc editor codebase.

**Trigger**: When working on Arc editor source code

**Context to provide**:
```
Arc Editor Structure:
- Entry: src/main.jsx → App.jsx
- Editor: src/components/editor/DiagramEditor.jsx
- State: EditorProvider.jsx + editorReducer.js (useReducer pattern)
- Canvas: DiagramCanvas.jsx (pointer events)
- Nodes: EditableNode.jsx (drag with pointer capture)
- Connectors: ConnectorLayer.jsx (SVG paths)
- Icons: src/utils/iconRegistry.js
- Constants: src/utils/constants.js (COLORS, NODE_SIZES)

Commands: pnpm dev | pnpm build | pnpm lint
Stack: React 19, Vite 7, TailwindCSS 4, Lucide icons
```

---

### arc-export

Export Arc diagrams to various formats.

**Trigger**: When user wants to export or integrate Arc diagrams

**Capabilities**:
- Export to TypeScript with proper types
- Generate React component code
- Create vanilla JS integration code
- Prepare diagrams for documentation sites

**Example output** (TypeScript):
```typescript
import type { ArcDiagramData } from '@arach/arc'

export const systemArchitecture: ArcDiagramData = {
  layout: { width: 700, height: 400 },
  nodes: { /* ... */ },
  nodeData: { /* ... */ },
  connectors: [ /* ... */ ],
  connectorStyles: { /* ... */ }
}
```

---

## Installing Skills

### Claude Code

Add to your project's `CLAUDE.md`:

```markdown
## Arc Diagram Context

When working with Arc diagrams:
- Format: JSON with layout, nodes, nodeData, connectors, connectorStyles
- Colors: violet, emerald, blue, amber, sky, zinc, rose, orange
- Sizes: s, m, l
- Anchors: left, right, top, bottom, topLeft, topRight, bottomLeft, bottomRight
- Icons: Lucide icon names (Server, Database, Monitor, etc.)

Key files:
- Editor: src/components/editor/
- State: EditorProvider.jsx + editorReducer.js
- Utils: src/utils/constants.js, iconRegistry.js
```

### Cursor / Windsurf

Add to `.cursorrules` or project instructions:

```
Arc is a visual diagram editor. Diagrams are JSON configs with:
- layout: { width, height }
- nodes: positions by ID
- nodeData: icon, name, color by ID
- connectors: from/to with anchors
- connectorStyles: color, strokeWidth, label

Use @arach/arc for React, @arach/arc-player for vanilla JS.
```

### Generic LLM

Copy the contents of `/llm.txt` into your conversation context.

---

## Prompt Templates

### Create Diagram
```
Create an Arc diagram showing [SYSTEM DESCRIPTION].
Include nodes for [COMPONENTS] connected via [RELATIONSHIPS].
Use the Arc JSON format with proper types.
```

### Modify Diagram
```
Update this Arc diagram: [PASTE CONFIG]
Changes: [DESCRIBE CHANGES]
Return the complete updated config.
```

### Debug Editor
```
Debug Arc editor issue: [PROBLEM]
Check these files: EditorProvider.jsx, editorReducer.js, [RELEVANT_FILE]
The state shape is: { diagram, editor, meta, history }
```
