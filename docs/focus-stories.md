---
title: Focus stories
description: Explain an architecture path when a reader explores a node.
section: Guides
order: 36
---

# Focus stories

Arc highlights a node and its direct connections on hover or selection. `focusTargets` can extend that behavior when the important unit is a path, boundary, or short operational story.

```tsx
const diagram = {
  // layout, nodes, nodeData, connectors, connectorStyles...
  focusTargets: {
    gateway: {
      mode: 'replace',
      nodes: ['gateway', 'api', 'queue', 'worker'],
      connectors: [
        { from: 'gateway', to: 'api' },
        { from: 'api', to: 'queue' },
        { from: 'queue', to: 'worker' },
      ],
      caption: 'Requests are acknowledged before asynchronous work begins.',
      steps: [
        { icon: 'Route', label: 'Route request' },
        { icon: 'ListPlus', label: 'Queue work' },
        { icon: 'Cpu', label: 'Process job' },
      ],
    },
  },
}

<ArcDiagram data={diagram} showFocusStory />
```

Use `mode: 'append'` or omit `mode` to keep the selected node's direct connections and add the declared path. Use `mode: 'replace'` when the declared path is the complete explanation.

Connector references are directional. `{ from: 'api', to: 'queue' }` does not match a connector that runs from `queue` to `api`.

The caption and steps are optional. They appear only when `showFocusStory` is enabled, but the declared nodes and connectors still control highlighting without the annotation.
