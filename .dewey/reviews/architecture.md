# Architecture Documentation Review

**File:** `/Users/arach/dev/arc/docs/architecture.md`
**Reviewer:** Dewey Documentation Agent
**Date:** 2026-01-15

---

## Scores

| Criterion | Score | Notes |
|-----------|-------|-------|
| Grounding | 3/5 | Covers basics but misses major features |
| Completeness | 2/5 | Significant gaps in state model and patterns |
| Clarity | 4/5 | What exists is well-structured |
| Examples | 2/5 | Only one code snippet, no pattern examples |
| Agent-Friendliness | 2/5 | Insufficient detail for AI contribution |

**Overall: NEEDS_WORK**

---

## Detailed Analysis

### Grounding (3/5)

The documentation correctly identifies the core architecture pattern (useReducer + Context) and lists the three main modules. However:

**Issues Found:**
- Module table lists `src/player/` but documentation says nothing about what the player module does or how it differs from the editor
- No mention of the TypeScript stack (docs imply JSX but codebase is TypeScript)
- Missing mention of the `types/` directory which defines core interfaces

### Completeness (2/5)

The state model shown is **significantly outdated** compared to the actual implementation.

**Documented state:**
```typescript
{
  diagram: { layout, nodes, nodeData, connectors, connectorStyles },
  editor: { selectedNodeId, selectedConnectorIndex, mode, pendingConnector, isDragging },
  meta: { filename, isDirty, lastSaved },
  history: { past, future }
}
```

**Actual state (from editorReducer.ts):**
```typescript
{
  diagram: {
    layout, grid, nodes, nodeData, connectors, connectorStyles,
    groups,      // Missing from docs - grouping shapes
    images,      // Missing from docs - dropped images
    exportZone   // Missing from docs - partial export regions
  },
  editor: {
    selectedNodeIds,      // Docs says selectedNodeId (singular)
    selectedConnectorIndex,
    selectedGroupId,      // Missing from docs
    selectedImageId,      // Missing from docs
    mode,                 // Docs missing 'addGroup' mode
    pendingConnector,
    pendingGroup,         // Missing from docs
    isDragging,
    dragOffset,           // Missing from docs
    dragNodeOffsets,      // Missing from docs - multi-select drag
    template,             // Missing from docs
    zoom,                 // Missing from docs
    viewMode              // Missing from docs - '2d' | 'isometric'
  },
  meta: { filename, isDirty, lastSaved },
  history: { past, future }
}
```

**Missing Features Not Documented:**
- Multi-node selection (shift+click)
- Groups/shapes functionality
- Image drop support
- Export zones for partial export
- Template/theming system
- Zoom controls
- Isometric view mode
- Grid configuration

### Clarity (4/5)

The existing content is well-organized with clear sections and a good data flow explanation. The table format for modules works well.

**Minor Issues:**
- No visual diagram showing component hierarchy
- Data flow section could include a diagram

### Examples (2/5)

**Current examples:**
- State model snippet (outdated)
- Diagram config JSON (minimal)

**Missing Examples:**
- How to add a new action to the reducer
- How to create a new editor mode
- How to add a new selectable element type
- Action creator patterns from EditorProvider
- Component communication patterns

### Agent-Friendliness (2/5)

An AI agent would struggle to contribute effectively because:

1. **State model is wrong** - Agent would write code against non-existent fields
2. **No action type reference** - The reducer has 40+ action types not documented
3. **No file mapping** - Which file handles what functionality?
4. **Missing patterns** - No guidance on immutable update patterns used
5. **No hook documentation** - Six convenience hooks exist but aren't mentioned:
   - `useDiagram()`
   - `useEditorState()`
   - `useMeta()`
   - `useHistory()`
   - `useTemplate()`
   - `useViewMode()`

---

## Recommendations

### Critical Fixes

1. **Update state model** to reflect actual `initialState` from editorReducer.ts
2. **Document all editor modes**: `select`, `addNode`, `addConnector`, `addGroup`
3. **Add action type reference** - categorized list of all reducer actions

### High Priority

4. **Document the player module** - its purpose and relationship to editor
5. **Add convenience hooks section** with usage examples
6. **Correct file extensions** - project uses TypeScript (.tsx/.ts), not JSX

### Recommended Additions

7. **Component hierarchy diagram** showing how editor components nest
8. **Add new feature guide** - step-by-step for adding a new element type
9. **Action creator patterns** - show the memoized callback pattern from EditorProvider

### Example Addition Needed

```typescript
// Action creator pattern (from EditorProvider.tsx)
const actions = {
  addNode: useCallback((position, nodeData) => {
    dispatch({ type: 'node/add', position, nodeData })
  }, []),
  // ... other actions
}

// Convenience hooks for state slices
export function useDiagram() {
  const { state } = useEditor()
  return state.diagram
}
```

---

## Summary

The architecture documentation provides a reasonable starting point but has fallen significantly behind the actual implementation. The state model discrepancy is particularly problematic as it would lead AI agents to write incorrect code. The documentation needs updates to cover groups, images, export zones, multi-selection, templates, zoom, and the isometric view mode that have been added to the editor.
