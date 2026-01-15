# Diagram Format Review (api.md)

**Page**: `/docs/api.md`
**Reviewer**: Dewey Documentation Agent
**Date**: 2026-01-15

---

## Scores

| Criterion | Score | Notes |
|-----------|-------|-------|
| Grounding | 4/5 | Schema purpose explained, but lacks context on when/why to use each field |
| Completeness | 2/5 | Multiple schema mismatches with actual implementation |
| Clarity | 4/5 | TypeScript interfaces are clear and well-formatted |
| Examples | 3/5 | Basic example in examples.md, but api.md has none inline |
| Agent-Friendliness | 2/5 | Incorrect values would cause AI-generated configs to fail |

**Overall**: **NEEDS_WORK**

---

## Issues Found

### Critical: Schema Mismatches

1. **Node Size Values**
   - Documentation: `'s' | 'm' | 'l'`
   - Actual (`constants.ts`): `'xs' | 's' | 'm' | 'l'`
   - Missing `xs` size option

2. **Color Values**
   - Documentation: `'violet' | 'emerald' | 'blue' | 'amber' | 'sky' | 'zinc' | 'rose' | 'orange'`
   - Actual (`constants.ts`): `'emerald' | 'amber' | 'zinc' | 'sky' | 'violet' | 'blue'`
   - `rose` and `orange` are NOT valid colors in the implementation

3. **Anchor Positions**
   - Documentation: `'left' | 'right' | 'top' | 'bottom' | 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'`
   - Actual (`constants.ts`): `['top', 'right', 'bottom', 'left', 'bottomRight', 'bottomLeft']`
   - `topLeft` and `topRight` are NOT valid anchors

### Moderate: Missing Information

4. **Node Size Dimensions**
   - Documentation says "small, medium, large" but doesn't specify pixel dimensions
   - Actual dimensions exist in constants.ts:
     - `xs`: 80x36
     - `s`: 95x42
     - `m`: 145x68
     - `l`: 210x85

5. **Default Layout**
   - Documentation doesn't mention the default canvas size
   - Actual default: 1600x900 pixels

6. **Grid Configuration**
   - Not documented at all
   - Actual schema includes `GridConfig` with `enabled`, `size`, `color`, `opacity`, `type`

### Minor: Inconsistencies

7. **CLAUDE.md vs api.md**
   - CLAUDE.md shows size values as `"large"/"normal"/"small"`
   - api.md shows `'s' | 'm' | 'l'`
   - These don't match each other or the implementation

8. **examples.md uses colors not in constants.ts**
   - Examples use `rose` and `orange` colors (microservices example)
   - These colors are in the documentation but not in `COLOR_OPTIONS`

---

## Recommendations

### Immediate Fixes

1. **Sync size enum** - Update to `'xs' | 's' | 'm' | 'l'` with dimensions
2. **Sync color enum** - Remove `rose` and `orange`, or add them to implementation
3. **Sync anchor enum** - Remove `topLeft` and `topRight`
4. **Add inline examples** - The api.md page has no inline examples; add at least one minimal working config

### Enhancements

5. **Document defaults** - Add a "Defaults" section listing:
   - Default layout (1600x900)
   - Default grid config
   - Default connector styles

6. **Add validation rules** - Document constraints:
   - strokeWidth: 1-4 recommended
   - x/y: must be within layout bounds
   - node IDs must be unique
   - connector `from`/`to` must reference valid node IDs

7. **Add complete minimal example**

```typescript
// Minimal valid diagram
const diagram: ArcDiagramData = {
  layout: { width: 400, height: 200 },
  nodes: {
    a: { x: 50, y: 75, size: 'm' },
    b: { x: 250, y: 75, size: 'm' },
  },
  nodeData: {
    a: { icon: 'Server', name: 'Source', color: 'violet' },
    b: { icon: 'Database', name: 'Target', color: 'blue' },
  },
  connectors: [
    { from: 'a', to: 'b', fromAnchor: 'right', toAnchor: 'left', style: 'default' }
  ],
  connectorStyles: {
    default: { color: 'violet', strokeWidth: 2 }
  }
}
```

---

## Impact Assessment

An AI agent using this documentation would likely produce **invalid configs** due to:
- Using `rose` or `orange` colors (examples show these)
- Using `topLeft` or `topRight` anchors
- Not knowing about `xs` size option

**Severity**: High - documentation does not match implementation.

---

## Status: NEEDS_WORK

The documentation structure is good, but the enum values are out of sync with the codebase. Fixing the schema mismatches is critical for agent-friendliness.
