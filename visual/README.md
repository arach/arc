# Visual regression harness

Golden-render regression checks for the deterministic SVG renderer — every case
in `cases/` is rendered once per variant in `manifest.json` and compared
byte-for-byte against the committed goldens in `golden/`.

## Run

```bash
bun run visual              # compare renders to goldens (exit 1 on diff/missing)
bun run visual -- --update  # rewrite goldens after an intentional render change
bun run visual -- --json    # machine-readable report
bun run visual -- --png     # also rasterize with Chrome/Chromium and compare
bun run visual -- --png-strict  # make PNG diffs fail (CI with pinned Chrome)
```

SVG comparison is exact — `renderDiagramSvg` is deterministic, so a diff means a
real render change. When a case fails, the actual output lands in `visual/.out/`
(gitignored) next to the golden for eyeballing.

PNG comparison is a SHA-256 match on the Chrome rasterization; fonts and
anti-aliasing differ across Chrome versions, so PNG diffs report but do not fail
unless `--png-strict` is passed (use it in CI with a pinned Chrome).

## Manifest

```jsonc
{
  "variants": [                       // default variant list for every case
    { "id": "light" },                // id names the golden file stem
    { "id": "dark", "mode": "dark" },
    { "id": "spacex", "theme": "spacex" },
    { "id": "gridded", "grid": true, "background": "#0f172a", "padding": 40 }
  ],
  "cases": [
    { "name": "flow", "diagram": "cases/flow.json" },
    { "name": "narrow", "diagram": "cases/narrow.json",
      "variants": [ { "id": "codex", "theme": "codex" } ] }   // per-case override
  ]
}
```

Variant fields map to `renderDiagramSvg` options: `theme`, `mode` (`light`/`dark`),
`background`, `grid`, `padding`, plus `scale` for PNG. Variant `id` defaults to
the theme or mode when omitted.

## Adding a case

1. Drop a diagram JSON in `cases/`.
2. Add it to `cases` in `manifest.json` (optionally with its own variants).
3. `bun run visual -- --update` and commit the new goldens.
