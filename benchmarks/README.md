# arc bench — first-pass benchmark

A "first-pass usable" benchmark for diagram authoring: can an ordinary agent,
given a plain-language prompt, emit an `ArcDiagramData` JSON that is valid,
semantically correct, and renderable on the first try?

## Layout

Each case is a directory with:

- `prompt.md` — the prompt to hand the agent (plain language, no Arc tutoring).
- `expect.json` — the scoring contract:
  - `nodes`: name substrings (case-insensitive) that must appear in `nodeData.*.name`
  - `edges`: `[fromSpec, toSpec]` pairs that must exist as connectors (direction matters;
    a backwards edge is reported as `reversed`, not found)
  - `minNodes` / `maxNodes`: optional size sanity bounds
- `outputs/` — drop agent-produced diagram JSON files here, one per run.

## Run it

```bash
# score every candidate in every case's outputs/ directory
arc bench benchmarks/

# score one or more files against a single case
arc bench benchmarks/web-app path/to/candidate.json

# machine-readable report; strict fails on warning diagnostics too
arc bench benchmarks/ --json
arc bench benchmarks/ --strict
```

Scoring per candidate: **valid** (no error-severity `validateDiagram`
diagnostics) ∧ all required nodes present ∧ all required edges present in the
right direction ∧ within `minNodes`/`maxNodes` ∧ `generateSVG` renders. Warnings
are counted but do not fail unless `--strict`. Exit `0` only when every
candidate passes; `1` if any fail; `2` on usage errors.

The committed `outputs/reference.json` files are known-good references — a clean
`arc bench benchmarks/` run should be all pass.
