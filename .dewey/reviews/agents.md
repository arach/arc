# Documentation Review: AGENTS.md

**Reviewer:** Dewey Documentation Agent
**Date:** 2026-01-15
**File:** `/Users/arach/dev/arc/docs/AGENTS.md`

---

## Scores

| Criterion | Score | Notes |
|-----------|-------|-------|
| **Grounding** | 4/5 | Strong project context and critical rules upfront |
| **Completeness** | 4/5 | Good coverage of schema, API, and structure |
| **Clarity** | 5/5 | Well-organized with clear sections and tables |
| **Examples** | 3/5 | Has code examples but lacks AI-specific setup guidance |
| **Agent-Friendliness** | 4/5 | Structured for parsing but missing agent workflow tips |

**Overall Score:** 20/25

---

## Detailed Assessment

### Grounding (4/5)

**Strengths:**
- Opens with "Critical Context" section with explicit rules for AI agents
- Clear statements about what NOT to do (never modify configs without understanding schema)
- Project structure table provides quick navigation
- Quick Navigation section with key file paths

**Issues:**
- Title says "LLM Documentation" but could be more specific about which LLMs/agents this targets
- Missing explicit connection to CLAUDE.md or similar agent instruction files

### Completeness (4/5)

**Strengths:**
- Full TypeScript interfaces for all data types
- Complete diagram config schema with examples
- State model clearly documented
- Data flow explanation helps agents understand side effects

**Issues:**
- Missing information about testing strategy or how to validate changes
- No mention of common pitfalls or error scenarios
- Missing information about how the editor interacts with file system

### Clarity (5/5)

**Strengths:**
- Excellent use of tables for structured information
- Code blocks are properly typed (tsx, typescript, json, bash)
- Logical section progression from overview to details
- Consistent formatting throughout

### Examples (3/5)

**Strengths:**
- Full working React example with proper imports
- Vanilla JavaScript snippet included
- JSON diagram config example provided

**Issues:**
- No examples for common agent tasks like:
  - Adding a new node programmatically
  - Modifying connector styles
  - Exporting a diagram
- No Claude Code specific examples (slash commands, common queries)
- No Cursor, Copilot, or other AI tool setup instructions
- Missing "prompt templates" for common operations

### Agent-Friendliness (4/5)

**Strengths:**
- Frontmatter with title/description aids parsing
- Tables are easy for LLMs to parse
- Type definitions are copy-pasteable
- Section headers provide clear semantic structure

**Issues:**
- Could benefit from a "Common Agent Tasks" section
- Missing suggested prompts for typical operations
- No guidance on how agents should handle edge cases

---

## Specific Recommendations

### High Priority

1. **Add Agent Workflow Section**
   ```markdown
   ## Common Agent Tasks

   ### Adding a New Node
   1. Edit nodes object in diagram config
   2. Add corresponding nodeData entry
   3. Validate: same keys in both objects

   ### Connecting Nodes
   1. Ensure both node IDs exist
   2. Add connector with valid anchor positions
   3. Define or reference existing connectorStyle
   ```

2. **Add Testing Guidance**
   - How to verify changes work
   - What the build/lint commands check
   - How to preview changes

3. **Add AI Tool Setup Examples**
   - Claude Code: mention CLAUDE.md synergy
   - Cursor: .cursorrules suggestions
   - Generic: common prompt patterns

### Medium Priority

4. **Add Error Scenarios**
   - What happens with invalid node IDs
   - Missing required fields behavior
   - Common schema violations

5. **Add Prompt Templates**
   ```markdown
   ## Suggested Prompts
   - "Add a database node connected to the backend"
   - "Change the theme to warm mode"
   - "Export this diagram to TypeScript"
   ```

### Low Priority

6. **Add Version Information**
   - React version requirements
   - Node.js version requirements
   - Breaking changes between versions

---

## Summary

The AGENTS.md file is a solid foundation for AI assistant integration. It provides excellent structural information, clear type definitions, and a good overview of the project. The "Critical Context" section with explicit rules is particularly valuable for preventing agent mistakes.

The main gap is in practical guidance for AI workflows. Adding a "Common Agent Tasks" section with step-by-step instructions and prompt templates would significantly improve the agent experience.

---

**Verdict:** NEEDS_WORK

The document scores 20/25 overall. While strong in structure and clarity, it needs agent-specific workflow guidance and setup examples for different AI tools to fully serve its stated purpose as "LLM Documentation."
