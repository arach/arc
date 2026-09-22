# Arc Skills

> Pre-built skills for AI coding assistants working with Arc

## Available Skills

### arc-diagrams

Create architecture diagrams using Arc's JSON format. This is the skill that ships in
this repo at `skills/arc-diagrams/SKILL.md`.

**Trigger**: When the user asks to "create an architecture diagram", "draw a system
diagram", "visualize the architecture", or "make a diagram of" something

**Capabilities**:
- Generate ArcDiagramData configs from natural language descriptions
- Position nodes on a clean grid with valid sizes and anchors
- Apply the 8 logical colors and named connector styles
- Output the config as JSON or as a typed TypeScript export for React projects

**Context to provide**:
```
Arc diagram format: JSON with layout, nodes, nodeData, connectors, connectorStyles
Valid colors: violet, emerald, blue, amber, sky, zinc, rose, orange
Valid sizes: xs, s, m, l
Valid anchors: left, right, top, bottom, topLeft, topRight, bottomLeft, bottomRight
Icons: curated Lucide set (see src/utils/iconRegistry.ts)
```

---

## Editor Development Context

When working on the Arc editor source code itself, provide this context:

```
Arc editor structure:
- Entry: src/main.tsx -> src/App.tsx
- Editor: src/components/editor/DiagramEditor.tsx
- State: EditorProvider.tsx + editorReducer.ts (useReducer pattern)
- Canvas: DiagramCanvas.tsx (pointer events)
- Nodes: EditableNode.tsx (drag with pointer capture)
- Connectors: ConnectorLayer.tsx (SVG paths)
- Inspector: InspectorPanel.tsx
- Icons: src/utils/iconRegistry.ts
- Constants: src/utils/constants.ts (COLORS, NODE_SIZES)

Commands: bun run dev | bun run build | bun run lint
Stack: React 19, Vite 7, TailwindCSS 4, Lucide icons
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
- Sizes: xs, s, m, l
- Anchors: left, right, top, bottom, topLeft, topRight, bottomLeft, bottomRight
- Icons: curated Lucide icon set (see src/utils/iconRegistry.ts)

Key files:
- Editor: src/components/editor/
- State: EditorProvider.tsx + editorReducer.ts
- Utils: src/utils/constants.ts, src/utils/iconRegistry.ts
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

Use @arach/arc for React, @arach/arc-iso for isometric rendering.
```

### Generic LLM

Copy the contents of `docs/llm.txt` into your conversation context.

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
Check these files: EditorProvider.tsx, editorReducer.ts, [RELEVANT_FILE]
The state shape is: { diagram, editor, meta, history }
```
