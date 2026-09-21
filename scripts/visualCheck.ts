import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { findChrome, renderDiagramPng, renderDiagramSvg, RenderError } from './renderImage.ts'
import type { RenderMode } from './renderImage.ts'
import type { ArcDiagramData } from '../src/types/diagram.ts'

const USAGE = `visual-check — golden-render regression harness for Arc diagrams

Usage:
  bun scripts/visualCheck.ts [dir] [--update] [--png] [--png-strict] [--json]

Options:
  --update       Rewrite goldens under <dir>/golden/ instead of comparing
  --png          Also render PNG goldens via Chrome/Chromium (skips if unavailable)
  --png-strict   Treat PNG hash diffs/misses as failures (implies --png)
  --json         Emit a machine-readable report

Manifest (<dir>/manifest.json):
  { "variants": [ { "id", "theme", "mode", "background", "grid", "padding", "scale" } ],
    "cases":    [ { "name", "diagram": "cases/x.json", "variants?": [...] } ] }

  "variants" at the top level is the default list; a case's own "variants" overrides it.
  With no variants anywhere, each case renders once as variant "default".

Exit codes: 0 all goldens match · 1 mismatch/missing/render failure · 2 usage error
`

interface VisualVariant {
  id?: string
  theme?: string
  mode?: RenderMode
  background?: string
  grid?: boolean
  padding?: number
  scale?: number
}

interface VisualCase {
  name?: string
  diagram: string
  variants?: VisualVariant[]
}

interface VisualManifest {
  variants?: VisualVariant[]
  cases: VisualCase[]
}

type ArtifactStatus = 'pass' | 'diff' | 'missing' | 'updated' | 'error' | 'skipped'

interface ArtifactResult {
  status: ArtifactStatus
  sha256?: string
  goldenSha256?: string
  output?: string
  error?: string
}

interface RenderResult {
  case: string
  variant: string
  width?: number
  height?: number
  svg: ArtifactResult
  png?: ArtifactResult
}

interface VisualReport {
  ok: boolean
  dir: string
  update: boolean
  checked: number
  passed: number
  diffs: number
  missing: number
  errors: number
  png: { checked: number; diffs: number; skipped: number; strict: boolean }
  results: RenderResult[]
}

class UsageError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sha256(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex')
}

function slugId(value: string): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (!slug) throw new UsageError(`variant id "${value}" has no filename-safe characters`)
  return slug
}

function parseVariant(raw: unknown, where: string): VisualVariant {
  if (!isRecord(raw)) throw new UsageError(`${where}: variant must be an object`)
  const variant: VisualVariant = {}
  for (const key of ['id', 'theme', 'background'] as const) {
    const value = raw[key]
    if (value !== undefined && typeof value !== 'string') throw new UsageError(`${where}: "${key}" must be a string`)
    if (value !== undefined) variant[key] = value
  }
  if (raw.mode !== undefined) {
    if (raw.mode !== 'light' && raw.mode !== 'dark') throw new UsageError(`${where}: "mode" must be "light" or "dark"`)
    variant.mode = raw.mode
  }
  if (raw.grid !== undefined) {
    if (typeof raw.grid !== 'boolean') throw new UsageError(`${where}: "grid" must be a boolean`)
    variant.grid = raw.grid
  }
  for (const key of ['padding', 'scale'] as const) {
    const value = raw[key]
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) {
      throw new UsageError(`${where}: "${key}" must be a finite number`)
    }
    if (value !== undefined) variant[key] = value
  }
  return variant
}

export function loadManifest(dir: string): VisualManifest {
  const manifestPath = join(dir, 'manifest.json')
  if (!existsSync(manifestPath)) throw new UsageError(`missing ${manifestPath}`)
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch (err) {
    throw new UsageError(`${manifestPath}: ${err instanceof Error ? err.message : err}`)
  }
  if (!isRecord(raw) || !Array.isArray(raw.cases)) throw new UsageError(`${manifestPath}: expected { "cases": [...] }`)

  const variants = raw.variants === undefined
    ? undefined
    : (() => {
        if (!Array.isArray(raw.variants)) throw new UsageError(`${manifestPath}: "variants" must be an array`)
        return raw.variants.map((v, i) => parseVariant(v, `${manifestPath} variants[${i}]`))
      })()

  const cases = raw.cases.map((entry, i) => {
    const where = `${manifestPath} cases[${i}]`
    if (!isRecord(entry) || typeof entry.diagram !== 'string' || !entry.diagram) {
      throw new UsageError(`${where}: expected { "diagram": "path.json" }`)
    }
    const parsed: VisualCase = {
      name: entry.name === undefined ? undefined : String(entry.name),
      diagram: entry.diagram,
      variants: entry.variants === undefined
        ? undefined
        : (() => {
            if (!Array.isArray(entry.variants)) throw new UsageError(`${where}: "variants" must be an array`)
            return entry.variants.map((v, j) => parseVariant(v, `${where} variants[${j}]`))
          })(),
    }
    return parsed
  })
  if (!cases.length) throw new UsageError(`${manifestPath}: "cases" is empty`)
  return { variants, cases }
}

/** Variant id: explicit id, else theme, else mode, else 'default'. */
function variantId(variant: VisualVariant): string {
  return slugId(variant.id ?? variant.theme ?? variant.mode ?? 'default')
}

interface CheckOptions {
  update?: boolean
  png?: boolean
  pngStrict?: boolean
  /** Chrome discovery env override (tests); defaults to process.env. */
  env?: Record<string, string | undefined>
  /** Test seam for PNG capture; forwarded to renderDiagramPng. */
  runChrome?: (executable: string, args: string[]) => Promise<void>
}

export async function runVisualCheck(dir: string, opts: CheckOptions = {}): Promise<VisualReport> {
  const root = resolve(dir)
  const manifest = loadManifest(root)
  const goldenDir = join(root, 'golden')
  const outDir = join(root, '.out')
  const pngStrict = opts.pngStrict ?? false
  const wantPng = (opts.png ?? false) || pngStrict
  const chrome = wantPng ? findChrome(opts.env) : null

  const results: RenderResult[] = []
  for (const benchCase of manifest.cases) {
    const name = benchCase.name ?? basename(benchCase.diagram).replace(/\.[^.]+$/, '')
    const diagramPath = join(root, benchCase.diagram)
    let diagram: ArcDiagramData | undefined
    let diagramError: string | undefined
    try {
      diagram = JSON.parse(readFileSync(diagramPath, 'utf8'))
    } catch (err) {
      diagramError = err instanceof Error ? err.message : String(err)
    }

    const variants = benchCase.variants ?? manifest.variants ?? [{}]
    const seen = new Set<string>()
    for (const variant of variants) {
      const id = variantId(variant)
      let unique = id
      let n = 2
      while (seen.has(unique)) unique = `${id}-${n++}`
      seen.add(unique)

      const base = { case: name, variant: unique }
      const goldenSvg = join(goldenDir, `${name}.${unique}.svg`)
      const goldenPng = join(goldenDir, `${name}.${unique}.png`)

      if (diagramError || !diagram) {
        results.push({ ...base, svg: { status: 'error', error: `cannot read ${benchCase.diagram}: ${diagramError}` } })
        continue
      }

      let rendered
      try {
        rendered = renderDiagramSvg(diagram, {
          theme: variant.theme,
          mode: variant.mode,
          backgroundColor: variant.background,
          includeGrid: variant.grid,
          padding: variant.padding,
        })
      } catch (err) {
        const code = err instanceof RenderError ? `${err.code}: ` : ''
        results.push({ ...base, svg: { status: 'error', error: `${code}${err instanceof Error ? err.message : err}` } })
        continue
      }

      const result: RenderResult = { ...base, width: rendered.width, height: rendered.height, svg: { status: 'error' } }
      const svgSha = sha256(rendered.svg)
      if (opts.update) {
        mkdirSync(goldenDir, { recursive: true })
        writeFileSync(goldenSvg, rendered.svg, 'utf8')
        result.svg = { status: 'updated', sha256: svgSha, output: goldenSvg }
      } else if (!existsSync(goldenSvg)) {
        mkdirSync(outDir, { recursive: true })
        const out = join(outDir, `${name}.${unique}.svg`)
        writeFileSync(out, rendered.svg, 'utf8')
        result.svg = { status: 'missing', sha256: svgSha, output: out }
      } else {
        const golden = readFileSync(goldenSvg, 'utf8')
        if (golden === rendered.svg) {
          result.svg = { status: 'pass', sha256: svgSha, goldenSha256: svgSha }
        } else {
          mkdirSync(outDir, { recursive: true })
          const out = join(outDir, `${name}.${unique}.svg`)
          writeFileSync(out, rendered.svg, 'utf8')
          result.svg = { status: 'diff', sha256: svgSha, goldenSha256: sha256(golden), output: out }
        }
      }
      results.push(result)

      if (wantPng) {
        const pngResult: ArtifactResult = { status: 'skipped' }
        result.png = pngResult
        if (!chrome) {
          pngResult.error = 'Chrome/Chromium not found — PNG comparison skipped (set ARC_CHROME)'
        } else {
          try {
            const png = await renderDiagramPng(diagram, {
              theme: variant.theme,
              mode: variant.mode,
              backgroundColor: variant.background,
              includeGrid: variant.grid,
              padding: variant.padding,
              scale: variant.scale,
              chromePath: chrome,
              runChrome: opts.runChrome,
            })
            const pngSha = sha256(png.png)
            if (opts.update) {
              writeFileSync(goldenPng, png.png)
              pngResult.status = 'updated'
              pngResult.sha256 = pngSha
              pngResult.output = goldenPng
            } else if (!existsSync(goldenPng)) {
              pngResult.status = 'missing'
              pngResult.sha256 = pngSha
            } else {
              const goldenSha = sha256(readFileSync(goldenPng))
              pngResult.sha256 = pngSha
              pngResult.goldenSha256 = goldenSha
              pngResult.status = goldenSha === pngSha ? 'pass' : 'diff'
              if (pngResult.status === 'diff') {
                mkdirSync(outDir, { recursive: true })
                const out = join(outDir, `${name}.${unique}.png`)
                writeFileSync(out, png.png)
                pngResult.output = out
              }
            }
          } catch (err) {
            pngResult.status = 'error'
            pngResult.error = err instanceof Error ? err.message : String(err)
          }
        }
      }
    }
  }

  const counted = results.flatMap(r => [r.svg, ...(r.png ? [r.png] : [])])
  const failed = (s: ArtifactResult) => s.status === 'diff' || s.status === 'missing' || s.status === 'error'
  // SVG goldens are deterministic: any diff/missing/error fails. PNG capture
  // depends on the local Chrome + fonts, so diffs/misses warn unless --png-strict;
  // a PNG render *error* still fails outright.
  const svgFailures = results.filter(r => failed(r.svg)).length
  const pngErrors = results.filter(r => r.png?.status === 'error').length
  const pngDiffs = results.filter(r => r.png && (r.png.status === 'diff' || r.png.status === 'missing')).length
  const ok = svgFailures === 0 && pngErrors === 0 && (!pngStrict || pngDiffs === 0)

  return {
    ok,
    dir: root,
    update: opts.update ?? false,
    checked: results.length,
    passed: results.filter(r => r.svg.status === 'pass' || r.svg.status === 'updated').length,
    diffs: counted.filter(s => s.status === 'diff').length,
    missing: counted.filter(s => s.status === 'missing').length,
    errors: counted.filter(s => s.status === 'error').length,
    png: {
      checked: results.filter(r => r.png && r.png.status !== 'skipped').length,
      diffs: pngDiffs,
      skipped: results.filter(r => r.png?.status === 'skipped').length,
      strict: pngStrict,
    },
    results,
  }
}

function printTextReport(report: VisualReport): void {
  const label = report.update ? 'updated' : 'checked'
  for (const result of report.results) {
    const dims = result.width !== undefined ? ` ${result.width}x${result.height}` : ''
    for (const [kind, artifact] of [['svg', result.svg], ['png', result.png]] as const) {
      if (!artifact) continue
      const mark = artifact.status === 'pass' ? 'ok' : artifact.status === 'updated' ? 'upd' : artifact.status === 'skipped' ? 'skip' : 'FAIL'
      const detail = artifact.error
        ? ` ${artifact.error}`
        : artifact.status === 'diff' || artifact.status === 'missing'
          ? ` ${artifact.sha256?.slice(0, 12)}${artifact.goldenSha256 ? ` != ${artifact.goldenSha256.slice(0, 12)}` : ' (no golden)'}${artifact.output ? ` → ${artifact.output}` : ''}`
          : ` ${artifact.sha256?.slice(0, 12) ?? ''}`
      console.log(`${mark.padEnd(4)} ${result.case}.${result.variant} ${kind}${dims}${detail}`)
    }
  }
  const pngNote = report.png.checked
    ? ` · png ${report.png.checked} checked, ${report.png.diffs} diff${report.png.diffs === 1 ? '' : 's'}${report.png.strict ? ' (strict)' : ' (non-strict)'}`
    : report.png.skipped ? ' · png skipped (no Chrome)' : ''
  console.log(`visual: ${report.checked} renders ${label} — ${report.passed} pass, ${report.diffs} diff, ${report.missing} missing, ${report.errors} error${pngNote}`)
}

export function reportOk(report: VisualReport): boolean {
  return report.ok
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  let dir = 'visual'
  let update = false
  let png = false
  let pngStrict = false
  let json = false
  for (const arg of argv) {
    if (arg === '--update') update = true
    else if (arg === '--png') png = true
    else if (arg === '--png-strict') { png = true; pngStrict = true }
    else if (arg === '--json') json = true
    else if (arg === '--help' || arg === '-h') { console.log(USAGE); return 0 }
    else if (arg.startsWith('-')) { console.error(`unknown option: ${arg}`); return 2 }
    else if (dir !== 'visual') { console.error(`unexpected argument: ${arg}`); return 2 }
    else dir = arg
  }

  let report: VisualReport
  try {
    report = await runVisualCheck(dir, { update, png, pngStrict })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (json) console.log(JSON.stringify({ ok: false, error: { code: err instanceof UsageError ? 'visual/usage' : 'visual/run-failed', message } }, null, 2))
    else console.error(message)
    return err instanceof UsageError ? 2 : 1
  }

  if (json) console.log(JSON.stringify(report, null, 2))
  else printTextReport(report)
  return reportOk(report) ? 0 : 1
}

if (import.meta.main) {
  main().then(code => { process.exitCode = code })
}
