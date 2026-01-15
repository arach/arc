# Skills Page Review

**File reviewed**: `/Users/arach/dev/arc/docs/skill.md`
**Reviewer**: Dewey Documentation Agent
**Date**: 2026-01-15

---

## Scores

| Criterion | Score | Notes |
|-----------|-------|-------|
| Grounding | 3/5 | Basic introduction exists but lacks depth |
| Completeness | 4/5 | Three skills documented with good detail |
| Clarity | 4/5 | Clear structure with context blocks |
| Examples | 3/5 | Prompt templates exist but lack concrete outputs |
| Agent-Friendliness | 4/5 | Good context blocks for injection |

**Overall Score**: 18/25

---

## Detailed Assessment

### 1. Grounding (3/5)

**Issues**:
- The page jumps directly into "Available Skills" without explaining what skills are in the Arc context
- No definition of what makes something a "skill" vs a "prompt" or "command"
- The tagline "Pre-built skills for AI coding assistants" is helpful but brief

**Missing**:
- What is the relationship between skills and the Arc editor?
- How do skills differ from regular prompts?
- When should a user invoke a skill vs. just asking naturally?

### 2. Completeness (4/5)

**Strengths**:
- Three skills documented: `arc-diagram`, `arc-editor-dev`, `arc-export`
- Each skill has trigger conditions and context blocks
- Installation instructions for multiple AI tools (Claude Code, Cursor, Generic LLM)

**Issues**:
- The document references `/llm.txt` but does not include its path clearly (relative path)
- No version information or changelog
- No skill for common tasks like "convert existing diagram" or "validate diagram syntax"

### 3. Clarity (4/5)

**Strengths**:
- Consistent structure for each skill (Trigger, Capabilities, Context)
- Code blocks with clear formatting
- Section dividers (---) improve scanability

**Issues**:
- `arc-editor-dev` lacks a "Capabilities" section unlike the other two skills
- Installation section header levels are inconsistent (### for tool names)
- Some context blocks mix reference information with instructions

### 4. Examples (3/5)

**Strengths**:
- Three prompt templates provided (Create, Modify, Debug)
- TypeScript export example shows expected output format
- Context blocks show what information to provide

**Issues**:
- No complete input/output examples showing a skill in action
- Prompt templates use placeholders without showing filled-in versions
- Missing example of a conversation flow using a skill

**Recommendation**: Add a "Full Example" section showing:
```
User: Create an Arc diagram showing a microservices architecture with auth, API gateway, and user service.

[Expected output with complete JSON]
```

### 5. Agent-Friendliness (4/5)

**Strengths**:
- Context blocks are copy-paste ready for system prompts
- Valid values listed explicitly (colors, sizes, anchors)
- File paths provided for development skill
- State shape documented for debugging

**Issues**:
- No structured schema (JSON Schema or similar) for validation
- Missing explicit success/failure criteria
- No error handling guidance (what if icon name is invalid?)

---

## Specific Issues Found

1. **Broken reference**: Line 120 mentions `/llm.txt` but full path should be `/docs/llm.txt` or absolute
2. **Inconsistent skill structure**: `arc-editor-dev` is missing Capabilities and Example sections
3. **No skill invocation syntax**: Document does not explain how to actually invoke/trigger skills
4. **Prompt templates are incomplete**: Placeholders like `[SYSTEM DESCRIPTION]` need example values
5. **Missing validation skill**: No skill for validating diagram syntax or checking for errors

---

## Recommendations

### High Priority
1. Add an introduction section explaining what skills are and when to use them
2. Add complete worked examples with real diagram data
3. Standardize all three skill definitions with the same sections

### Medium Priority
4. Add a diagram validation skill
5. Include JSON Schema or TypeScript types inline
6. Fix the `/llm.txt` reference to use absolute or clear relative path

### Low Priority
7. Add version numbers to skills
8. Include common error messages and how to resolve them
9. Add a "See Also" section linking to related documentation

---

## Verdict

**NEEDS_WORK**

The skills page provides good reference material but falls short on grounding and practical examples. An AI agent could use these skills effectively, but a human reader would benefit from more context about what skills are and complete examples showing the skills in action. The three documented skills cover the main use cases but need structural consistency.

Priority fixes:
1. Add introductory section defining skills
2. Add at least one complete worked example per skill
3. Fix `arc-editor-dev` to match the structure of other skills
