---
title: Guided views
description: Turn a diagram into an ordered walkthrough with a chapter rail and deep links.
section: Guides
order: 37
---

# Guided views

`focusTargets` explain a node when a reader explores. `views` is the other direction: the author drives. A `views` array turns the diagram into a document — an ordered set of named chapters the reader steps through in a bottom rail, each framing its own region and highlighting its own path.

```tsx
const diagram = {
  // layout, nodes, nodeData, connectors, connectorStyles...
  views: [
    {
      id: 'overview',
      title: 'Overview',
      nodes: ['gateway', 'api', 'db'],
      caption: 'The whole request path in three hops.',
    },
    {
      id: 'write-path',
      title: 'Write path',
      node: 'api',
      mode: 'replace',
      nodes: ['api', 'queue', 'worker'],
      connectors: [
        { from: 'api', to: 'queue' },
        { from: 'queue', to: 'worker' },
      ],
      steps: [
        { icon: 'ListPlus', label: 'Enqueue job' },
        { icon: 'Cpu', label: 'Process' },
      ],
    },
  ],
}

<ArcDiagram data={diagram} showViews />
```

A view resolves to a highlight set through `resolveViewFocus`:

- `node` anchors the view — it behaves like selecting that node, including its `focusTargets` story.
- Declaring `nodes`, `connectors`, or `mode` on the view **overrides** the anchor's story for that chapter.
- A view without `node` highlights exactly the declared `nodes`/`connectors`.
- `mode: 'append'` adds the anchor's direct neighbors; `'replace'` draws only the declared set.

Connector references are the same directional `FocusConnectorRef` used by `focusTargets` — `{ from: 'api', to: 'queue' }` is directional, and `{ id: 'edge-id' }` pins a specific edge across reorderings and parallel connectors.

While a view is active the camera frames the highlighted nodes, the caption and steps render in the story panel, and the rail shows `i / N` with previous and next. Clicking a node exits the chapter and locks that node's own focus state.

## Deep links and controlled state

The standalone player reads `?view=<id>`:

```
/player/<session>?view=write-path
```

`onViewChange` fires when the rail selects or exits a view; pass `view` back to keep the id in the URL (which is exactly what `/player/*` does). `defaultViewId` sets the initial chapter when uncontrolled.

The `editor_handoff` MCP tool accepts a `view` argument and returns a `playerUrl` pre-pointed at that chapter (open the `editorUrl` once first — the player renders the persisted session).

## Authoring notes

- Keep `id` stable — it is the deep-link key and appears in URLs.
- Order is document order: write views the way you'd tell the story.
- `validateDiagram` flags dangling view references (`semantic/view-missing-node`, `semantic/view-missing-connector`), duplicate ids (`semantic/duplicate-view-id`), and malformed entries (`shape/invalid-view`).
- Views are data — they round-trip through save files, hash handoffs, `arc check`, and the generated JSON Schema like everything else.
