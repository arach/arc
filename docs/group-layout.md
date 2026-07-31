---
title: Declarative group layout
description: Keep architecture nodes aligned inside explicit system boundaries.
section: Guides
order: 35
---

# Declarative group layout

Arc can arrange nodes inside the group boundaries already stored in a diagram. The group owns the frame. `layoutHints` describes membership and placement without replacing explicit node coordinates in the source format.

```tsx
const diagram = {
  layout: { width: 900, height: 480 },
  groups: [
    {
      id: 'runtime',
      x: 80,
      y: 70,
      width: 740,
      height: 320,
      type: 'rect',
      color: 'violet',
      label: 'Runtime',
    },
  ],
  layoutHints: {
    nodes: {
      gateway: { group: 'runtime', layer: 0 },
      api: { group: 'runtime', layer: 1, order: 1 },
      worker: { group: 'runtime', layer: 1, order: 2 },
      database: { group: 'runtime', layer: 2 },
    },
    groups: {
      runtime: {
        direction: 'horizontal',
        padding: 24,
        layerGap: 32,
        itemGap: 20,
        align: 'center',
        justify: 'space-between',
      },
    },
  },
  // nodes, nodeData, connectors, connectorStyles...
}

const arranged = autoLayout(diagram)
```

`horizontal` places layers from left to right. `vertical` places layers from top to bottom. `order` controls nodes that share a layer. With `autoLayout`, nodes without a valid group membership keep their explicit coordinates. With `createAutoLayout`, Arc first places every node on the global canvas and then applies group-local layout, so ungrouped nodes also receive useful generated positions.

Group frames keep their declared origin and minimum dimensions. If a frame is too small for its nodes, padding, and gaps, Arc expands its width or height to keep every member inside the boundary and grows the diagram canvas to match.
