---
title: Overview
description: Arc is a visual diagram editor for creating architecture diagrams that are readable, versionable, and ready for docs.
order: 1
---

## What is Arc?

Arc is a diagram editor that bridges the gap between visual design tools and code. Instead of exporting opaque image files, Arc outputs clean, declarative configurations that can be version-controlled, reviewed in PRs, and rendered anywhere.

Think of it as Figma for architecture diagrams—but the output is TypeScript or JSON that lives alongside your codebase.

---

## Key Concepts

Arc is built around a few core ideas that make diagrams maintainable and portable.

### Declarative Format

Diagrams are data structures. Nodes, connectors, and styles are all defined in a typed schema. This means you can generate diagrams programmatically, diff them in git, and validate them with TypeScript.

### Templates

Structural presets that define box shapes, line styles, and layout behaviors. Templates control the visual language of your diagrams—rounded vs sharp corners, solid vs dashed lines, horizontal vs vertical layouts.

### Themes

Color palettes that can be applied to any template. Switch between light and dark modes, or match your brand colors, without changing the diagram structure. Built-in themes include default, warm, cool, and mono.

---

## Why Arc?

Architecture diagrams typically live in design tools, disconnected from the code they describe. Arc keeps diagrams as declarative configs that:

- **Version with your code** - Diffs show exactly what changed
- **Render anywhere** - Use the lightweight player or export to SVG/PNG
- **Stay consistent** - Templates enforce color palettes and sizing rules

---

## Packages

Arc exports two npm packages:

| Package | Description |
|---------|-------------|
| `@arach/arc` | Core player/renderer component |
| `@arach/arc-player` | Lightweight embeddable player |

---

## Next Steps

- **[Quickstart](/docs/quickstart)** - Get up and running in 5 minutes
- **[Diagram Format](/docs/diagram-format)** - Learn the data structure
- **[Templates](/docs/templates)** - Explore structural presets
- **[Themes](/docs/themes)** - Customize colors and styles
