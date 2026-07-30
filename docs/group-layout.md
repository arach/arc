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

`horizontal` places layers from left to right. `vertical` places layers from top to bottom. `order` controls nodes that share a layer. Nodes without a valid group membership keep their explicit coordinates.

Group frames have fixed dimensions. Choose a frame large enough for its nodes, padding, and gaps. Arc does not silently resize architecture boundaries because those coordinates may be part of a larger drawing.
