---
title: Overview
description: Diagrams as Code - Visual editor for architecture diagrams that live in your codebase
order: 1
---

# Arc Overview

Arc is a visual editor for building architecture diagrams that stay in code. You design on a canvas, then export a clean, declarative model that can be stored in Git and rendered anywhere.

## Why Arc?

Architecture diagrams typically live in design tools, disconnected from the code they describe. Arc keeps diagrams as declarative configs that:

- **Version with your code** - Diffs show exactly what changed
- **Render anywhere** - Use the lightweight player or export to SVG/PNG
- **Stay consistent** - Templates enforce color palettes and sizing rules

## Key Features

- **Visual Editor** - Drag-and-drop nodes, connectors, groups, and images
- **Declarative Exports** - JSON/TypeScript configs designed for version control
- **Templates** - Built-in themes and sizing presets
- **Isometric View** - Toggle 3D projection for visual impact
- **Multiple Export Formats** - JSON, TypeScript, SVG, PNG, clipboard embed

## Packages

Arc ships as two npm packages:

| Package | Size | Use Case |
|---------|------|----------|
| `@arach/arc` | ~75KB | Full editor + player components |
| `@arach/arc-player` | ~7KB | Lightweight renderer only |

## Quick Links

- [Quickstart](./quickstart.md) - Get started in 5 minutes
- [Architecture](./architecture.md) - How the editor is built
