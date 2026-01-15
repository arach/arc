# Debug Arc Editor

## Prompt Template

```
Debug this issue in the Arc editor:

Issue: [DESCRIBE THE PROBLEM]
Expected: [WHAT SHOULD HAPPEN]
Actual: [WHAT'S HAPPENING]

Relevant context:
- Browser: [Chrome/Firefox/Safari]
- Action: [What user did when issue occurred]
```

## Common Issues

### Drag not working
```
Debug: Nodes won't drag in Arc editor

Check:
1. EditableNode.jsx pointer event handlers
2. EditorProvider isDragging state
3. Pointer capture in onPointerDown
```

### Connectors not rendering
```
Debug: Connectors invisible or misaligned

Check:
1. ConnectorLayer.jsx SVG paths
2. diagramHelpers.js getAnchorPosition
3. Node anchor point calculations
```

### State not updating
```
Debug: Changes not reflecting in editor

Check:
1. editorReducer.js action handlers
2. EditorProvider dispatch
3. History state management
```

## Key Debug Files

| Issue Area | Primary File |
|------------|--------------|
| Drag/drop | `src/components/editor/EditableNode.jsx` |
| Connectors | `src/components/editor/ConnectorLayer.jsx` |
| State | `src/components/editor/editorReducer.js` |
| Icons | `src/utils/iconRegistry.js` |
| Colors | `src/utils/constants.js` |
