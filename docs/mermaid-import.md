---
title: Mermaid Import and Publication Rendering
description: Requirements for turning canonical Mermaid source into deterministic Arc diagrams and blog-ready SVG assets
order: 7
---

# Native Mermaid formats and Arc rendering

## Status

This document defines Mermaid as a native Arc source format. Arc is not a themed wrapper around Mermaid.js and Mermaid is not flattened into generic architecture boxes. Arc parses supported Mermaid families into typed semantic documents, preserves the original source, and renders each family with a purpose-built Arc renderer.

`ArcDiagramData` remains Arc's architecture-diagram format. It is not the universal intermediate representation for every Mermaid family. A sequence diagram has participants, lifelines, messages, notes, and fragments; preserving those concepts is a product requirement, not optional presentation polish.

The first native acceptance fixture is OpenScout's “one message, two cost boundaries” sequence. It contains an actor, participants, messages and replies, notes spanning participant ranges, and an `alt` / `else` fragment. The existing OpenScout flowchart remains a compatibility fixture for the architecture projection.

## Product outcome

A documentation author should be able to open a reviewed `.mmd` file in Arc, see an Arc-native rendering without silent semantic loss, adjust theme and presentation, and export a crisp responsive SVG. The source must stay editable as Mermaid. The result must remain readable at a 680–1200 px blog width and when scaled down on mobile.

The OpenScout figure must communicate four facts at a glance:

1. Menu-to-broker transport and broker-to-Menu SSE are local coordination.
2. Model cost begins when the broker wakes Scoutbot or another harness.
3. Scoutbot can answer from broker state or delegate owned repository work with `ask`.
4. A project agent receives its role, tool schemas, project instructions, Scout skill, and reply context before it works in the repository.

## Source-of-truth contract

- The `.mmd` file is canonical. Generated Arc data, SVG, and PNG captures are derivatives.
- Import is deterministic: the same source, options, and Arc version produce byte-equivalent diagram data.
- Import never rewrites the Mermaid source in place.
- Unknown or lossy syntax must appear in `warnings` or `unsupported`; Arc must not silently pretend it was preserved.
- Comments and Mermaid initialization directives may precede the diagram declaration and must not prevent type detection.
- Line endings are normalized before parsing.
- Stable Mermaid node ids remain stable Arc node ids after sanitization. Id collisions after sanitization are errors, not last-write-wins behavior.

## Architecture

Arc exposes two separate layers:

1. `parseMermaid(source)` returns an `ArcMermaidDocument` discriminated union plus structured diagnostics.
2. `<ArcMermaid />` renders that semantic document with the renderer registered for its family.

```ts
type ArcMermaidDocument =
  | ArcFlowchartDocument
  | ArcSequenceDocument
  | ArcStateDocument

interface ArcMermaidParseResult {
  document: ArcMermaidDocument | null
  diagnostics: MermaidDiagnostic[]
  source: string
}

interface ArcMermaidProps {
  source?: string
  document?: ArcMermaidDocument
  mode?: 'light' | 'dark'
  theme?: ThemeId
  interactive?: boolean
  className?: string
  /** Presentation overrides for sequence (and later family) design primitives */
  presentation?: SequencePresentationOptions
  /** Native player shell: fit/zoom, expand, highlight, step-through */
  player?: NativePlayerOptions
}
```

The document model is semantic rather than renderer-specific. It contains source order and stable ids, but not measured pixel coordinates. Family renderers own layout and may expose additive presentation options. Parse results never contain React nodes or executable Mermaid configuration.

`importMermaid()` remains as a compatibility adapter for consumers that explicitly want an `ArcDiagramData` architecture projection. The adapter may be lossy and must report that loss. New native surfaces use `parseMermaid()` and `<ArcMermaid />`. Sequence diagrams must never be forced through `ArcDiagramData` as an intermediate representation.

Renderer selection lives in one registry keyed by the Mermaid declaration. Adding a family requires a parser, semantic type, renderer, fixture, diagnostics policy, and accessibility/export tests. It must not grow a conditional chain across unrelated UI components.

### Sequence design primitives (customizable)

Every visual primitive in the sequence renderer is a first-class, overrideable design token — not hard-coded presentation. Defaults ship as a coherent Arc theme; consumers can replace any primitive without forking the renderer.

Domain-specific note colors are opt-in presentation semantics, never inferred by the generic engine. Consumers may provide `sequence.noteAccent(event)` to map authored note metadata or reviewed source conventions to `local`, `model`, or `default`; unclassified notes remain neutral.

Primitives include at least:

| Primitive | Controls |
|-----------|----------|
| Participant / actor chrome | shape treatment, icon slot, label typography, rail spacing |
| Lifelines | stroke, dash, emphasis vs quiet guide |
| Messages | solid/dashed stroke, arrowhead open/filled, label placement, row pitch |
| Notes | callout shape, fill/border, span alignment |
| Fragments (`alt` / `else` / …) | region fill, label chip, lane divider, nest indentation |
| Semantic color roles | local/control-plane vs metered/model vs identity accents |
| Spacing & measure | participant gap, event row height, max label width, padding |

v1 may expose a single `presentation` options object with sensible defaults; the shape must stay extensible so later primitives (activation bars, loops, etc.) plug in without a breaking rewrite.

### Native player contract

The live sequence surface is a player, not a static dump. The first implementation should be coherent and extensible: ship the contract surface even when some behaviors are minimal stubs.

Required player capabilities:

| Capability | Contract |
|------------|----------|
| **Fit / zoom** | Fit-to-container and stepped zoom (reuse Arc zoom conventions where practical); narrow viewports prefer fit + zoom over microscopic labels |
| **Expand / fullscreen** | Expand the diagram into a larger shell (dialog or fullscreen) without leaving the host page |
| **Hover / keyboard highlight** | Participant or message focus emphasizes related lifelines and events; static SVG export must not depend on interaction |
| **Ordered step-through / playback** | Hooks to step events in authored order (and optional play/pause); controllable via props/imperative handle so hosts can drive narration |

Export remains a separate deterministic path: player interactivity never leaks into published SVG semantics.

## Supported v1 grammar

### Diagram families

- `flowchart` and `graph`
- `sequenceDiagram`
- `stateDiagram-v2` and `stateDiagram`

All other declarations return an empty diagram plus an explicit unsupported diagram-type result.

### Flowcharts

The importer must preserve:

- standalone node declarations;
- node declarations embedded in edges;
- quoted and unquoted labels;
- solid and dotted edges;
- pipe and inline edge labels;
- the declared node and edge order;
- `<br>`, `<br/>`, and `<br />` as structured label breaks rather than literal text;
- leading `%%` comments and `%%{...}%%` directives.

The importer may auto-layout the result, but it must report when a top-level or subgraph `direction` directive is not honored.

### Native sequence diagrams

The first native sequence slice preserves:

- `actor` and `participant` declarations, aliases, source order, and distinct visual roles;
- solid and dashed messages, open and filled arrowheads, message labels, and return direction;
- `Note left of`, `Note right of`, and `Note over` one or more participants;
- `alt`, `else`, and matching `end` fragments, including their labels and nesting depth;
- authored order of all events;
- line breaks as structured text; and
- diagnostics with source ranges for syntax or features Arc does not yet support.

Activation, `loop`, `opt`, `par`, `critical`, `break`, `rect`, and autonumbering may follow incrementally, but the parser must model them as explicit unsupported constructs rather than silently discarding their bodies.

### Native flowchart and state diagrams

Flowchart and state parsing should follow the same typed-document architecture. Until their native renderers land, the existing architecture projection remains available and its losses remain explicit. This staged migration must not force sequence diagrams back through `ArcDiagramData`.

## Group and styling semantics

Subgraphs are meaningful in publication diagrams; they are not decorative comments. Arc's current `ArcDiagramData` has no first-class group/container or annotation layer, so the importer must not claim group fidelity today.

The incremental contract is:

- v1 identifies `subgraph` blocks and returns one de-duplicated `subgraph` unsupported capability.
- v1 records `classDef`, `class`, `style`, `linkStyle`, and `click` as unsupported styling or interaction directives.
- The publication renderer may supply a reviewed Arc-native presentation layer for group backgrounds, boundary labels, callouts, and brand styling while keeping the Mermaid node/edge topology canonical.
- A future group-capable schema should represent containers separately from nodes, keep membership stable, support nested groups, and participate in layout without converting group labels into fake nodes.
- Mermaid theme/style directives never bypass the Arc theme system. When mapping is added, it must be explicit, safe, and deterministic.

## Label mapping

Arc nodes have `name`, `subtitle`, and `description`. Mermaid label breaks map in order:

1. first segment → `name`;
2. second segment → `subtitle`;
3. remaining segments → `description`, joined with a single readable separator.

The importer strips only the supported line-break tags. Other HTML stays escaped or is reported; it must never become executable markup in a React or SVG consumer.

## Sequence visual language

The native sequence renderer should feel recognizably Arc while remaining immediately legible to people who know sequence diagrams:

- participants form a stable left-to-right rail with actor and system treatments that are visually related but distinct;
- lifelines are quiet, continuous guides and never compete with message text;
- every message occupies its own ordered row; labels sit on the message path without colliding with adjacent rows or lifelines;
- replies use a quieter dashed treatment while keeping adequate contrast;
- notes read as contextual callouts and span the participant range expressed by the source;
- fragments are rounded, lightly tinted regions with a clear `alt` label and a separated `else` lane;
- local control-plane activity uses Arc's cool/green family, while model-inference work uses its warm/amber family; the colors reinforce notes and regions rather than rewriting source semantics;
- hover or keyboard focus on a participant emphasizes its lifeline and related messages without making the static export depend on interaction;
- long labels wrap within a measured maximum width and grow the event row instead of clipping; and
- light and dark modes use the existing Arc theme tokens.

All of the above are customizable design primitives (see [Sequence design primitives](#sequence-design-primitives-customizable)); theme defaults must remain coherent out of the box.

The first renderer may use HTML and SVG together in the live component. SVG export must be deterministic and visually equivalent. The player shell (fit/zoom, expand, highlight, step-through) wraps the renderer; see [Native player contract](#native-player-contract).

## General layout and visual requirements

- Default import targets a supplied width and height; output may grow vertically when the graph cannot fit without overlap.
- Nodes must not overlap at the OpenScout blog target of 960 × 560.
- Edge labels must not sit beneath nodes or outside the view box.
- Semantic regions require visually distinct containers or callouts, not just different node colors.
- Local transport should use the cool/green family; metered model work should use the warm/amber family; the broker may retain Arc's violet identity.
- Text contrast must meet WCAG AA for ordinary text against the rendered background.
- SVG output must have a view box, accessible title and description, no external font or script dependency, and no rasterized text.
- Generated publication assets must be visually inspected at desktop width and at approximately 390 px CSS width.

## Native API and compatibility adapter

```ts
import { ArcMermaid, parseMermaid } from '@arach/arc-viewer'

const result = parseMermaid(source)

result.document     // typed native Mermaid document, or null on fatal parse failure
result.diagnostics  // structured errors, warnings, and unsupported capabilities
result.source       // normalized source retained for editing

<ArcMermaid source={source} mode="dark" theme="default" />
```

Legacy projection remains explicit:

```ts
import { importMermaid } from '@arach/arc-viewer'

const result = importMermaid(source, {
  width: 960,
  height: 560,
  defaultSize: 'l',
})

result.diagram      // ArcDiagramData
result.warnings     // source-specific, non-fatal losses
result.unsupported  // de-duplicated capability names
```

The existing `importMermaid()` return shape remains stable. New native APIs are additive. Consumers must be able to fail a build when a diagnostic is not in their reviewed allowlist.

## First acceptance fixture: Scout interaction sequence

Canonical Arc fixture:

`fixtures/mermaid/scout-interaction.sequence.mmd`

The fixture must render all six participants, three notes, thirteen messages, and one two-lane `alt` fragment in authored order. The direct-answer lane ends at the broker. The delegated-work lane continues through the project agent and tools before replying to the Menu.

At desktop width, the whole interaction should fit without horizontal scrolling. At approximately 390 px CSS width, Arc may provide a fitted overview plus zoom/expand rather than making every label microscopic. The exported SVG must include an accessible title and description.

## OpenScout publication integration

Canonical source:

`landing/openscout.app/content/blog/how-agents-learn-to-speak-scout.mmd`

Published derivative:

`landing/openscout.app/public/blog/how-agents-learn-to-speak-scout.svg`

The blog Markdown embeds the stable `/blog/how-agents-learn-to-speak-scout.svg` URL. The site does not need a Mermaid runtime. A publication check should import the canonical source, assert the expected seven node ids and ten connectors, compare diagnostics with the reviewed allowlist, validate the SVG as XML, and build the landing site.

For this fixture, the reviewed v1 losses are subgraph containers, direction directives, and Mermaid styling directives. The checked-in SVG supplies the publication presentation, while Arc remains responsible for validating topology and structured labels.

## Acceptance criteria

### Native sequence milestone

- `parseMermaid()` returns a typed sequence document for the Scout fixture without degrading it into generic nodes and connectors (never via `ArcDiagramData`).
- Actor and participant distinctions, notes, message direction, dashed replies, and the `alt` / `else` fragment survive parsing and rendering.
- `<ArcMermaid />` selects the sequence renderer through the registry and supports Arc light/dark themes.
- Sequence design primitives are customizable through a presentation options surface with coherent defaults.
- Native player contract covers fit/zoom, expand/fullscreen, hover or keyboard highlight, and ordered step-through/playback hooks (extensible; v1 may stub playback UI while keeping the hooks).
- The renderer is deterministic, has no Mermaid.js runtime dependency, and does not execute Mermaid directives or HTML.
- The Scout fixture has focused parser tests and visual coverage at desktop and narrow widths.
- The fixture can be opened in a standalone Arc viewer URL and exported as accessible SVG.

### Compatibility milestone

- A leading `%%` comment no longer causes “unrecognized diagram type.”
- The OpenScout fixture imports `Operator`, `Menu`, `Broker`, `SSE`, `Scoutbot`, `ProjectAgent`, and `RepoTools` with ten connectors.
- `<br/>` does not appear literally in imported node names.
- Standalone `Operator["Operator"]` is recognized without a warning.
- Unsupported capabilities are de-duplicated and stable.
- Focused tests cover leading comments, structured labels, standalone nodes, edge count, and reviewed diagnostics.
- `@arach/arc-viewer` build and typecheck pass.
- The published SVG is responsive, accessible, deterministic, and visually inspected in the real OpenScout article.

## Explicit non-goals

- Full Mermaid grammar compatibility.
- Executing Mermaid JavaScript or arbitrary HTML.
- Treating Mermaid styling as trusted CSS.
- Replacing the Arc editor's native JSON/TypeScript format.
- Reconstructing external Mermaid source from Arc data with byte-for-byte fidelity.
- Full Mermaid grammar compatibility in the first milestone.
- Byte-for-byte visual parity with Mermaid.js.
- Using `ArcDiagramData` as a catch-all AST for semantically different diagram families.
- Executing click handlers, initialization scripts, arbitrary HTML, or Mermaid theme CSS.
