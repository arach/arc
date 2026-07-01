# Color Themes

Themes remap Arc's six **logical node colors** to a coordinated palette. You set
`theme` and `mode` on the diagram — the node `color` values never change, so one
diagram renders in every theme.

```tsx
<ArcDiagram data={diagram} theme="cool" mode="light" />
```

## Logical colors

Every node uses one of six logical colors. The active theme decides how each renders:

| Color | Typical meaning |
|-------|-----------------|
| `violet` | Primary / app surface |
| `emerald` | Data / success |
| `blue` | Services |
| `amber` | Warnings |
| `sky` | External / cloud |
| `zinc` | Neutral / infra |

Use 2–3 colors per diagram for cohesion, applied semantically (e.g. `emerald` for
data, `amber` for warnings) or aesthetically.

## Built-in themes

Each theme ships **light and dark** modes:

| Theme | Character |
|-------|-----------|
| `default` | Balanced, brand-neutral |
| `warm` | Amber / rose |
| `cool` | Blue / teal |
| `mono` | Grayscale, maximum restraint |
| `engineering` | Systematic enterprise blue on a graph grid |
| `workbench` | Dark slate with intent colors |
| `tactical` | Near-black with signature amber |

## Applying a theme

```tsx
// Same data, two looks
<ArcDiagram data={diagram} theme="default" mode="light" />
<ArcDiagram data={diagram} theme="tactical" mode="dark" />
```

In the editor, the theme and color mode are saved with the diagram and travel with
every export, so the rendered output matches what you designed.
