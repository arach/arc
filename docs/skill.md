# Arc Skills

> Pre-built skills for AI coding assistants working with Arc

## Available Skills

### arc-diagrams

Create and modify Arc architecture diagrams.

**Location**: `skills/arc-diagrams/SKILL.md`

**Trigger**: When user asks to create, edit, or work with architecture diagrams

**Capabilities**:
- Generate `ArcDiagramData` from natural language descriptions
- Add/remove/modify nodes and connectors
- Apply themes and styling
- Use `autoLayout` to avoid hand-positioning
- Convert between JSON and TypeScript formats

**Context to provide**:
```
Arc diagram format: JSON with layout, nodes, nodeData, connectors, connectorStyles
Canonical schema: src/types/diagram.ts
Valid colors: violet, emerald, blue, amber, sky, zinc, rose, orange
Valid sizes: xs, s, m, l  (NOT large/normal/small)
Valid anchors: left, right, top, bottom, topLeft, topRight, bottomLeft, bottomRight
Icons: Lucide icon names as strings (Server, Database, Monitor, Cloud, etc.)
Example: src/components/diagrams/architecture.diagram.ts
```

---

### arc-editor-dev

Develop and debug the Arc editor codebase.

**Trigger**: When working on Arc editor source code

**Context to provide**:
```
Read CLAUDE.md first (repo root).

Arc Editor Structure:
- Routes: src/App.tsx
- Shell: src/apps/arc-editor/ (Hudson wrapper)
- Canvas: src/components/editor/ (DiagramCanvas, editorReducer.ts)
- State: EditorProvider.tsx + editorReducer.ts (useReducer)
- Schema: src/types/diagram.ts
- Validation: src/utils/diagramValidation.ts
- Icons: src/utils/iconRegistry.ts
- Sizes: src/utils/constants.ts (NODE_SIZES: xs/s/m/l)

Commands: bun run dev | bun run build | bun run lint | bun run typecheck
Stack: React 19, Vite 7, TailwindCSS 4, Hudson shell, Lucide icons

Reducer actions: docs/agent/editor-actions.agent.md
Visual verification: docs/agent/verification.agent.md
```

---

### arc-export

Export Arc diagrams to various formats.

**Trigger**: When user wants to export or integrate Arc diagrams

**Capabilities**:
- Export to TypeScript with proper types
- Generate React component code
- Render ASCII via `renderAscii()` or `bin/arc-ascii.mjs`
- Prepare diagrams for documentation sites

**Example output** (TypeScript):
```typescript
import type { ArcDiagramData } from '@arach/arc'

export const systemArchitecture: ArcDiagramData = {
  layout: { width: 700, height: 400 },
  nodes: { /* x, y, size: 'm' */ },
  nodeData: { /* icon: 'Server', name, color */ },
  connectors: [ /* ... */ ],
  connectorStyles: { /* ... */ }
}
```

---

## Installing Skills

### Claude Code / Cursor

Point agents at:
- `CLAUDE.md` — full contributor context
- `docs/llm.txt` — dense briefing
- `skills/arc-diagrams/SKILL.md` — diagram generation

### Generic LLM

Copy `docs/llm.txt` or fetch `/llms.txt` from a running dev server.

---

## Prompt Templates

See `docs/prompts/`:
- `create-diagram.md` — generate from description
- `add-node.md` — modify existing diagram
- `export-diagram.md` — export workflows
- `debug-editor.md` — editor debugging
- `modify-styling.md` — themes and styling

---

## MCP

Available via the `arc-mcp` bin on `@arach/arc`. See `docs/agent/mcp.agent.md`.
