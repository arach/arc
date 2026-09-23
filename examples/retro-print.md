# Retro print material

Set `material: 'retro-print'` on an isometric `DiagramConfig`. Both React (`ArcDiagramIsometric`) and `renderToString` support it. The default remains `standard`.

```ts
const config: DiagramConfig = {
  ...existingConfig,
  material: 'retro-print',
}
```

This selects shared mineral ink colors, a warm paper background, deterministic SVG stipple on node faces, and unshadowed node labels. Semantic color names still work: rose is terracotta, slate is blue-gray, cyan is petrol, emerald is sage. Explicit floor colors and node opacity remain caller-owned. Use opaque nodes for the printed treatment; transparency washes out both ink and grain.

Run `bun examples/retro-preview.ts` to export light SVG comparisons into `/tmp`. The effect is vector-based and requires no raster textures or random runtime state. Light and dark canvases are supported; node inks and dark label text stay consistent in both modes.

For the Lattices Action consumer, set `material: 'retro-print'` in `createArchitectureConfig` after upgrading to an Arc build containing this change. Its existing dependency is older and cannot render this option. This local change does not publish an npm version or update the deployed website.
