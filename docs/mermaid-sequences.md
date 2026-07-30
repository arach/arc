---
title: Mermaid sequence engine
description: Render Mermaid sequence source as a native, interactive Arc sequence.
---

# Mermaid sequence engine

Arc treats sequence diagrams as interaction over time, not as architecture boxes with arrows. Mermaid text stays the source of truth. Arc parses it into a typed sequence document, lays it out, and renders it with replaceable SVG parts and Arc theme tokens.

The result is a native Arc surface. Mermaid.js is not required at runtime.

## The model

```text
Mermaid sequenceDiagram source
  → parseMermaid()
  → ArcSequenceDocument
  → SequenceRenderer
  → ArcMermaidPlayer
```

Sequence is a separate engine alongside Arc's 2D and isometric renderers. It does not project participants and messages through `ArcDiagramData`, because lifelines, ordered messages, notes, and fragments carry different semantics.

## React API

```tsx
import {
  ArcMermaidPlayer,
  classifyNoteAccent,
} from '@arach/arc-viewer'
import source from './interaction.sequence.mmd?raw'

export function InteractionModel() {
  return (
    <ArcMermaidPlayer
      source={source}
      mode="light"
      title="Interaction model"
      description="How a request moves through the system."
      sequence={{
        width: 1040,
        maxLabelWidth: 168,
        noteAccent: (event) => classifyNoteAccent(event.text),
      }}
    />
  )
}
```

Use `ArcMermaid` when you only need the renderer. Use `ArcMermaidPlayer` for zoom, fullscreen, and authored-order message playback. You can also call `parseMermaid(source)` directly when you need the typed document or diagnostics.

`classifyNoteAccent` is an optional Scout-story helper. It maps note language to local or model accents for this demo; Arc does not infer cost boundaries automatically.

## Sequence v1 support

The current native grammar focuses on the interaction primitives needed by the Scout model:

- actors and participants
- solid and dashed messages
- notes
- `alt`, `else`, and `end` fragments
- light and dark Arc themes
- message step-through and participant focus

Unsupported syntax produces parser diagnostics. Arc does not silently redraw an unknown sequence construct as a generic flowchart.

## Current boundaries

Sequence v1 is not a drop-in replacement for every Mermaid diagram. Native flowchart and state renderers are not part of this release, activation bars are not yet drawn, and the main Arc editor does not open `.mmd` files. The player control labeled Fit currently resets the diagram to 100%; measured fit-to-container remains future work.

For the implementation contract and future grammar work, see [`docs/mermaid-import.md`](./mermaid-import.md).
