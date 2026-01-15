# Dewey Extraction Plan

This document outlines what components and patterns should be moved from Arc into the Dewey framework for reuse across all documentation sites.

## Components to Extract to Dewey

### 1. CopyButtons (`@arach/dewey`)

**Location**: `ext/dewey/packages/docs/src/components/CopyButtons.tsx`

**Already extracted.** Provides three copy actions:
- Copy Markdown - Human-readable content
- Copy for Agent - Dense, structured content for AI
- Get Prompt - Pre-written prompt template

**Usage**:
```tsx
import { CopyButtons } from '@arach/dewey'

<CopyButtons
  markdownContent={humanDocs}
  agentContent={agentOptimizedDocs}
  promptContent={promptTemplate}
/>
```

### 2. AgentContext (`@arach/dewey`)

**Location**: `ext/dewey/packages/docs/src/components/AgentContext.tsx`

**Already extracted.** Collapsible block for displaying agent-optimized content inline.

**Usage**:
```tsx
import { AgentContext } from '@arach/dewey'

<AgentContext
  content={agentContent}
  title="Agent Context"
  defaultExpanded={false}
/>
```

### 3. LLM.txt Serving Pattern

**Should be added to Dewey**: A convention for serving `llm.txt` at `/llm.txt` route.

**Pattern**:
- Place `llm.txt` in `public/` directory
- Vite/Next.js will serve it at `/llm.txt`
- Combined, dense documentation optimized for LLM consumption

**Recommended content structure**:
```
# Project Name - LLM Context File

> One-line description
> Source: GitHub URL
> Docs: Docs URL

## Quick Facts
## Installation
## Minimal Example
## Schema/Types
## Project Structure
## Common Modifications
## Commands
## Critical Rules
```

### 4. Agent Content Convention

**Pattern to document in Dewey**:

```
docs/
├── overview.md              # Human docs
├── agent/
│   └── overview.agent.md    # Agent-optimized version
├── prompts/
│   └── create-thing.md      # Prompt templates
├── skill.md                 # Skill definitions
└── AGENTS.md                # Combined agent reference
```

## What Stays in Arc (Project-Specific)

### Content Files

- `docs/agent/*.agent.md` - Arc-specific agent content
- `docs/prompts/*.md` - Arc-specific prompts
- `docs/AGENTS.md` - Arc's combined agent reference
- `docs/skill.md` - Arc skill definitions
- `public/llm.txt` - Arc's LLM context file

### UI Customization

- The "Download llm.txt" button styling
- Agent page hero section with download CTA
- Page tree structure and navigation
- Badge colors and theming

## Dewey Framework Features to Add

### Near-term

1. **Agent content loading utilities**
   ```tsx
   // Helper to load both human and agent content
   const { humanContent, agentContent, prompt } = usePageContent('quickstart')
   ```

2. **LLM.txt generation CLI**
   ```bash
   dewey generate-llm --output public/llm.txt
   ```

3. **Agent content validation**
   - Ensure agent content is dense (< N tokens)
   - Check for required sections
   - Validate file paths mentioned exist

### Long-term

1. **Agent analytics**
   - Track which copy button is used most
   - See which prompts are copied

2. **Prompt marketplace**
   - Share prompts across projects
   - Community contributions

3. **Skill registry**
   - Central registry of skills
   - One-click install for popular tools

## Migration Guide

When adding agent-friendly features to a new Dewey-powered docs site:

1. **Create agent content structure**
   ```bash
   mkdir -p docs/agent docs/prompts
   ```

2. **Add llm.txt to public/**
   - Combine key docs into single file
   - Keep under 8K tokens for context limits

3. **Use CopyButtons in page header**
   ```tsx
   import { CopyButtons } from '@arach/dewey'

   <CopyButtons
     markdownContent={page.content}
     agentContent={page.agentContent}
     promptContent={page.prompt}
   />
   ```

4. **Add AgentContext blocks for inline tips**
   ```tsx
   <AgentContext content={agentTip} title="For AI Assistants" />
   ```

## Testing Agent Experience

To verify the agent experience is good:

1. **Copy test**: Use "Copy for Agent" button, paste into Claude/ChatGPT
2. **Ask a question**: "How do I add a new node to an Arc diagram?"
3. **Verify**: Agent should be able to answer accurately from copied context

Good agent content should enable the LLM to:
- Understand the project structure
- Know key file locations
- Have access to type definitions
- Understand common modification patterns
