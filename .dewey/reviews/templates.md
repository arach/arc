# Templates Page Review

**File**: `/Users/arach/dev/arc/docs/examples.md`
**Reviewer**: Dewey Documentation Agent
**Date**: 2026-01-15

---

## Scores

| Criterion | Score | Notes |
|-----------|-------|-------|
| Grounding | 2/5 | No explanation of what templates are or their purpose |
| Completeness | 2/5 | Missing size/spacing documentation, no pattern guidance |
| Clarity | 3/5 | Code examples are readable but lack context |
| Examples | 4/5 | Three solid real-world examples provided |
| Agent-Friendliness | 2/5 | Hard for AI to understand when/how to apply templates |

**Overall Score**: 13/25

---

## Detailed Assessment

### Grounding (2/5)

**Issues Found**:
- Page title is "Examples" but is used as "Templates" in navigation
- No introductory paragraph explaining what templates are
- No explanation of when to use templates vs. building from scratch
- Missing purpose statement (e.g., "Templates are pre-built diagram configurations...")

**Expected Content**:
- Definition of what a template is in Arc context
- When to use templates
- How templates differ from custom diagrams

### Completeness (2/5)

**Issues Found**:
- Size values (`'s'`, `'m'`, `'l'`) used but never explained
- No documentation of actual pixel dimensions for sizes
- Spacing patterns not documented (e.g., 150-200px horizontal gaps in microservices example)
- No guidance on canvas sizing relative to node count
- Missing layout grid or alignment recommendations
- No mention of how to adapt templates for different use cases

**Missing Information**:
- Size dimensions: What are `s`, `m`, `l` in pixels?
- Recommended spacing between nodes
- Canvas width/height guidelines based on complexity
- Color pairing recommendations

### Clarity (3/5)

**Issues Found**:
- Code blocks are well-formatted TypeScript
- Node positions are readable but seemingly arbitrary
- No comments explaining design decisions
- Jump between examples with no transition text

**What Works**:
- Type annotations (`ArcDiagramData`) help understanding
- Consistent code structure across examples
- Real-world architecture names (Kafka, PostgreSQL, RabbitMQ)

### Examples (4/5)

**What Works**:
- Three distinct architecture patterns covered:
  1. Simple Three-Tier (beginner)
  2. Microservices (intermediate)
  3. Event-Driven (intermediate)
- Each example is complete and runnable
- Good variety of node sizes, colors, and connector styles
- Demonstrates different connector styles (HTTPS, gRPC, SQL, AMQP)

**Issues Found**:
- No "minimal" example for getting started
- No complex enterprise example
- Missing variations (e.g., vertical layouts, hub-and-spoke)

### Agent-Friendliness (2/5)

**Issues Found**:
- An AI cannot determine which template to recommend without context
- No metadata about template characteristics (complexity, use case)
- Hard to extract patterns programmatically
- No guidance on customizing templates

**Missing for AI Use**:
- Template metadata (node count, complexity level, industries)
- Pattern names/tags for matching user requests
- Explicit spacing rules an AI could follow
- Transformation guidance (how to add/remove nodes while preserving layout)

---

## Specific Issues

1. **Title Mismatch**: File is `examples.md` but serves as "Templates" page
2. **No Size Reference Table**: Users see `size: 'm'` but don't know dimensions
3. **Magic Numbers**: Positions like `x: 750, y: 275` appear without explanation
4. **No Layout Patterns**: Should document horizontal flow, hub-spoke, grid layouts

---

## Recommendations

### High Priority
1. Add introductory section explaining templates concept
2. Create a size reference table with pixel dimensions
3. Document standard spacing patterns (e.g., 150-200px horizontal gaps)
4. Rename file to `templates.md` for consistency

### Medium Priority
5. Add template metadata (complexity, node count, use case)
6. Include comments in code explaining layout decisions
7. Add a "minimal" starter template
8. Document canvas sizing guidelines

### Low Priority
9. Add visual previews alongside code
10. Create a template selection guide
11. Add transformation examples (how to extend templates)

---

## Status

**NEEDS_WORK**

The page provides valuable real-world examples but lacks the foundational documentation needed for users and AI agents to effectively select and apply templates. The disconnect between "Examples" title and "Templates" usage creates confusion. Size and spacing patterns need explicit documentation.
