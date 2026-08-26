# Arc - Agent Context

> Visual diagram editor outputting declarative JSON/TypeScript configs

## TL;DR

- Diagrams are data (JSON/TS), not images
- Canonical schema: `src/types/diagram.ts`
- Node sizes: `xs` | `s` | `m` | `l` (not `large`/`normal`/`small`)
- Stack: React 19, Vite 7, TailwindCSS 4, Hudson shell
- State: `useReducer` + Context in `EditorProvider`
- Best doc: `CLAUDE.md` (repo root)
- MCP: `arc-mcp` bin on `@arach/arc` — see `docs/agent/mcp.agent.md`

## Which Package?

See `docs/agent/packages.agent.md`. Short version:

| Need | Package |
|------|---------|
| Render 2D diagram | `@arach/arc` or `@arach/arc-viewer` |
| Mermaid sequences | `@arach/arc-viewer` |
| Isometric | `@arach/arc-iso` |
| Visual studio | Clone repo → `bun run dev` → `/editor` |

## Key Concepts

| Concept | What It Is |
|---------|------------|
| **Nodes** | Boxes with icon, name, color, position (`nodes` + `nodeData`) |
| **Connectors** | Lines between nodes, styled by named `connectorStyles` |
| **Themes** | Diagram palettes: default, warm, cool, mono, engineering, workbench, tactical, command |
| **Chrome** | Shell skin (separate from diagram theme): console, graphite, amber, viridian, paper |
| **Groups** | Labeled frames; use `layoutHints` + `autoLayout` for placement |

## Quick Start

```tsx
import { ArcDiagram } from '@arach/arc'

<ArcDiagram data={diagramConfig} mode="light" theme="engineering" defaultZoom="fit" />
```

## File Locations

| What | Where |
|------|-------|
| Routes / apps | `src/App.tsx`, `src/apps/arc-editor/` |
| Editor shell (Hudson) | `src/apps/arc-editor/createArcApp.tsx` |
| Canvas + reducer | `src/components/editor/` |
| 2D player | `src/components/ArcDiagram.tsx` |
| Diagram schema | `src/types/diagram.ts` |
| Validation | `src/utils/diagramValidation.ts` |
| Example diagrams | `src/components/diagrams/*.diagram.ts` |
| Icons | `src/utils/iconRegistry.ts` |
| Sizes / colors | `src/utils/constants.ts` |

## Further Reading

| Topic | File |
|-------|------|
| Packages | `docs/agent/packages.agent.md` |
| Editor actions | `docs/agent/editor-actions.agent.md` |
| Visual verification | `docs/agent/verification.agent.md` |
| MCP status | `docs/agent/mcp.agent.md` |
| Diagram generation | `skills/arc-diagrams/SKILL.md` |
