# AI Prompt Improvement Plan

## Goal
Improve all 8 documentation page prompts to match the quality of the Diagram Format page, which serves as our gold standard.

## Gold Standard (Diagram Format)
- **Info**: One technical sentence with key concepts
- **Params**: Man-page style with `{VAR}` badges and examples
- **Starter Template**: Pre-filled with variables, handles multiple use cases
- **Examples**: Good/bad configs with WHY explanations, actual valid values
- **Expected Output**: Validation checklist for the AI

## Pages to Improve

### 1. Overview
- **Status**: ⏳ Pending
- **Purpose**: Create diagrams from descriptions
- **Needs**: Better examples, more specific starter template

### 2. Quickstart
- **Status**: ⏳ Pending
- **Purpose**: Set up Arc in a project
- **Needs**: Installation examples, code snippets

### 3. Diagram Format
- **Status**: ✅ Complete (Gold Standard)
- **Purpose**: Modify/debug/understand configs

### 4. Architecture
- **Status**: ⏳ Pending
- **Purpose**: Editor codebase development
- **Needs**: File structure examples, code patterns

### 5. Templates
- **Status**: ⏳ Pending
- **Purpose**: Structural styling
- **Needs**: Size/layout examples with WHY

### 6. Themes
- **Status**: ⏳ Pending
- **Purpose**: Color palettes
- **Needs**: Palette examples, color theory guidance

### 7. Agents
- **Status**: ⏳ Pending
- **Purpose**: AI agent briefing
- **Needs**: Full context reference, llm.txt integration

### 8. Skills
- **Status**: ⏳ Pending
- **Purpose**: Pre-built skills
- **Needs**: Task-specific templates

## Review Cycle (Per Page)
1. **Draft**: Sub-agent creates improved prompt config
2. **Apply**: Update ArcDocs.tsx
3. **Screenshot**: Puppeteer captures the result
4. **Review**: Sub-agent evaluates the screenshot
5. **Iterate**: Make improvements if needed
6. **Complete**: Mark done, move to next

## Progress Log

### Session: 2026-01-15

#### Overview
- [x] Draft - Added layout patterns (flow vs hub-spoke), two-pattern examples with WHY comments
- [x] Apply - Updated ArcDocs.tsx
- [x] Screenshot - docs/screenshots/prompt-overview.png
- [x] Review - Sub-agent score: 19/20 PASS
- [x] Complete

#### Quickstart
- [x] Draft - Added framework/package manager params, installation examples, Next.js notes
- [x] Apply - Updated ArcDocs.tsx
- [x] Screenshot - docs/screenshots/prompt-quickstart.png
- [x] Review - Sub-agent score: 20/20 PASS
- [x] Complete

#### Architecture
- [x] Draft - Added state shape, action patterns, drag pattern, file structure
- [x] Apply - Updated ArcDocs.tsx
- [x] Screenshot - docs/screenshots/prompt-architecture.png
- [x] Review - Sub-agent score: 20/20 PASS
- [x] Complete

#### Templates
- [x] Draft - Added size hierarchy (xs/s/m/l -> 60/80/120/160px), spacing patterns
- [x] Apply - Updated ArcDocs.tsx
- [x] Screenshot - docs/screenshots/prompt-templates.png
- [x] Review - Sub-agent score: 18/20 PASS
- [x] Complete

#### Themes
- [x] Draft - Added semantic color guide, aesthetic palettes (warm/cool/monochrome)
- [x] Apply - Updated ArcDocs.tsx
- [x] Screenshot - docs/screenshots/prompt-themes.png
- [x] Review - Sub-agent score: 18/20 PASS
- [x] Complete

#### Agents
- [x] Draft - Self-contained briefing with inline schema, valid values, example output
- [x] Apply - Updated ArcDocs.tsx
- [x] Screenshot - docs/screenshots/prompt-agents.png
- [x] Review - Sub-agent score: ~18/20 PASS
- [x] Complete

#### Skills
- [x] Draft - Four skills (CREATE, MODIFY, DEBUG, EXPORT) with full templates
- [x] Apply - Updated ArcDocs.tsx
- [x] Screenshot - docs/screenshots/prompt-skills.png
- [x] Review - Sub-agent score: 17/20 -> Fixed info box
- [x] Complete

### Summary

All 8 pages now have gold-standard prompt configs:
- **Diagram Format** (gold standard) - Already complete
- **Overview** - 19/20 - Layout patterns with examples
- **Quickstart** - 20/20 - Full setup workflow
- **Architecture** - 20/20 - State/action/drag patterns
- **Templates** - 18/20 - Size hierarchy with pixel values
- **Themes** - 18/20 - Semantic color guide
- **Agents** - 18/20 - Self-contained AI briefing
- **Skills** - 17/20 -> Fixed - Task-specific skill library

Average score: 18.6/20 (93%)
