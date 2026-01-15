# Dewey Dogfooding Feedback

Captured during Arc documentation setup (2026-01-14)

## First-Run Experience

### Pain Points

1. **pnpm script not set up** - Had to find and run CLI via `node ./dist/cli/index.js`
   - Expected: `pnpm dewey audit`
   - Reality: CLI binary not linked in monorepo context
   - Suggestion: Add a root-level script or document how to run locally

2. **Build required first** - Had to run `pnpm install && pnpm build` before CLI worked
   - TS compilation errors appeared when node_modules was missing
   - Suggestion: Better error message like "Run pnpm install first"

3. **Config type import incorrect** - `@dewey/cli` doesn't exist anymore
   ```ts
   /** @type {import('@dewey/cli').DeweyConfig} */  // Wrong
   /** @type {import('@arach/dewey').DeweyConfig} */ // Should be this
   ```

### Good Parts

- `dewey init` worked smoothly and created sensible stubs
- Audit feedback was clear and actionable
- Generate output (AGENTS.md, llms.txt, docs.json) is comprehensive
- Score system motivates completion (69 → 88 felt rewarding)

## Feature Suggestions

1. **Verbose audit mode** - Show what's missing in each file to reach 40/40
2. **Config validation** - Warn if `criticalContext` or `entryPoints` are empty
3. **Watch mode** - `dewey audit --watch` for live feedback while writing docs
4. **Merge existing docs** - Detect existing content and merge rather than overwrite

## Generated Output Feedback

### AGENTS.md
- Entry point table has empty "Purpose" column - should pull from comments or infer
- Good critical context section
- Navigation rules are helpful

### llms.txt
- **BUG**: Content is empty - sections are created but doc content not included
- Just has headers: `## Overview`, `## Quickstart`, `## Architecture` with nothing under them
- Should contain the full doc content for LLM context windows
- Format unclear - is this for RAG? What's the target consumer?

### docs.json
- Good structured format
- Could include file modification dates for cache invalidation

## Questions for Dewey

1. What's the intended relationship between CLAUDE.md and AGENTS.md?
2. Should dewey.config.ts be committed or gitignored?
3. How do criticalContext rules differ from entryPoints?
