# Arc Introduction

Arc is a visual editor for building architecture diagrams that stay in code. You design on a
canvas, then export a clean, declarative model that can be stored in Git and rendered anywhere.
The goal is to keep architecture diagrams living alongside the system they describe.

## Quickstart

```bash
bun install
bun run dev
```

- The Vite dev server runs on port `5188`.
- Use `bun run build` to generate production output in `dist/`.
- Use `bun run lint` and `bun run typecheck` before sharing changes.

## Core Ideas

- **Diagram model**: One JSON/TypeScript object stores layout, nodes, node metadata, connectors,
  and connector styles.
- **Editor-first**: The UI is optimized for fast node placement, selection, and property editing.
- **Declarative exports**: Exports are meant to be diffed, reviewed, and reused by docs tooling.
- **Templates + themes**: Built-in templates give you consistent palettes and sizing rules.
- **Assets**: Groups and background images make complex diagrams easier to read.

## Typical Workflow

1. Open the editor and start from a template.
2. Place nodes, connectors, groups, and annotations.
3. Export the diagram as JSON/TypeScript (or SVG/PNG for slides).
4. Commit the config next to the product code or docs.

Next: read `docs/architecture.md` for a deeper look at how the editor, state model, and exporters
fit together.
