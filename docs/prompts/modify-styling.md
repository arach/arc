# Modify Diagram Styling

## Prompt Template

```
Update the styling of this Arc diagram:

[PASTE DIAGRAM CONFIG]

Changes:
- Theme: [default|warm|cool|mono]
- Mode: [light|dark]
- [SPECIFIC CHANGES: e.g., "make the API connector dashed"]
```

## Example

```
Update the styling of this Arc diagram:

{ ... existing config ... }

Changes:
- Make the database connector dashed
- Change the auth service node to rose color
- Add labels to all connectors
```

## Valid Style Values

| Property | Options |
|----------|---------|
| Node colors | violet, emerald, blue, amber, sky, zinc, rose, orange |
| Node sizes | s, m, l |
| Connector strokeWidth | 1, 2, 3, 4 |
| Connector dashed | true, false |
| labelAlign | left, center, right |
