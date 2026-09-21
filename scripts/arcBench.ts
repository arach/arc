import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { validateDiagram } from '../src/utils/diagramDiagnostics.ts'
import { generateSVG } from '../src/utils/exportUtils.ts'
import type { Diagnostic } from '../src/utils/diagramDiagnostics.ts'
import type { ArcDiagramData } from '../src/types/diagram.ts'

export interface BenchExpect {
  /** Node-name substrings (case-insensitive) that must appear in nodeData.*.name */
  nodes?: string[]
  /** [fromSpec, toSpec] pairs — direction matters; a backwards edge is reported as reversed */
  edges?: [string, string][]
  minNodes?: number
  maxNodes?: number
}

export interface BenchCase {
  name: string
  dir: string
  prompt?: string
  expect: BenchExpect
}

export interface BenchScore {
  expected: number
  found: number
  missing: string[]
}

export interface BenchCandidateResult {
  candidate: string
  pass: boolean
  valid: boolean
  rendered: boolean
  renderBytes?: number
  errors: number
  warnings: number
  diagnostics: Diagnostic[]
  nodes: BenchScore
  edges: BenchScore & { reversed: [string, string][] }
  size: { count: number; min?: number; max?: number; ok: boolean }
  inputError?: string
}

export interface BenchCaseReport {
  case: string
  dir: string
  prompt?: string
  candidates: BenchCandidateResult[]
}

export interface BenchReport {
  ok: boolean
  cases: BenchCaseReport[]
  totals: { cases: number; candidates: number; passed: number; failed: number; skipped: number }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseExpect(raw: unknown, dir: string): BenchExpect {
  if (!isRecord(raw)) throw new Error(`${dir}/expect.json: expected an object`)
  const nodes = raw.nodes ?? []
  const edges = raw.edges ?? []
  if (!Array.isArray(nodes) || nodes.some(n => typeof n !== 'string')) {
    throw new Error(`${dir}/expect.json: "nodes" must be an array of name substrings`)
  }
  if (!Array.isArray(edges) || edges.some(e => !Array.isArray(e) || e.length !== 2 || e.some(v => typeof v !== 'string'))) {
    throw new Error(`${dir}/expect.json: "edges" must be an array of [fromSpec, toSpec] pairs`)
  }
  for (const key of ['minNodes', 'maxNodes'] as const) {
    const value = raw[key]
    if (value !== undefined && (!Number.isInteger(value) || (value as number) < 0)) {
      throw new Error(`${dir}/expect.json: "${key}" must be a non-negative integer`)
    }
  }
  return { nodes, edges: edges as [string, string][], minNodes: raw.minNodes as number | undefined, maxNodes: raw.maxNodes as number | undefined }
}

export function loadCase(dir: string): BenchCase {
  const expectPath = join(dir, 'expect.json')
  if (!existsSync(expectPath)) throw new Error(`missing ${expectPath}`)
  const expect = parseExpect(JSON.parse(readFileSync(expectPath, 'utf8')), dir)
  const promptPath = join(dir, 'prompt.md')
  const prompt = existsSync(promptPath) ? readFileSync(promptPath, 'utf8').trim() : undefined
  return { name: basename(dir), dir, prompt, expect }
}

/** A directory is a case when it has expect.json; otherwise every child with expect.json is a case. */
export function collectCases(dir: string): BenchCase[] {
  const root = resolve(dir)
  if (!existsSync(root) || !statSync(root).isDirectory()) throw new Error(`bench: ${dir} is not a directory`)
  if (existsSync(join(root, 'expect.json'))) return [loadCase(root)]
  const cases = readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(join(root, entry.name, 'expect.json')))
    .map(entry => loadCase(join(root, entry.name)))
  if (!cases.length) throw new Error(`bench: no cases under ${dir} (no expect.json found)`)
  return cases.sort((a, b) => a.name.localeCompare(b.name))
}

/** Candidate JSON files for a case: explicit paths win, else outputs/*.json inside the case dir. */
export function caseCandidates(benchCase: BenchCase, explicit: string[]): string[] {
  if (explicit.length) return explicit.map(p => resolve(p))
  const outDir = join(benchCase.dir, 'outputs')
  if (!existsSync(outDir)) return []
  return readdirSync(outDir)
    .filter(name => name.endsWith('.json'))
    .sort()
    .map(name => join(outDir, name))
}

function nameMatches(name: unknown, spec: string): boolean {
  return typeof name === 'string' && name.toLowerCase().includes(spec.toLowerCase())
}

function matchingNodeIds(diagram: ArcDiagramData, spec: string): string[] {
  const nodeData = (diagram as unknown as Record<string, unknown>).nodeData
  if (!isRecord(nodeData)) return []
  return Object.keys(nodeData).filter(id => nameMatches((nodeData[id] as Record<string, unknown>)?.name, spec))
}

export function scoreCandidate(diagram: unknown, expect: BenchExpect, opts: { strict?: boolean } = {}): Omit<BenchCandidateResult, 'candidate'> {
  const diagnostics = validateDiagram(diagram)
  const errors = diagnostics.filter(d => d.severity === 'error').length
  const warnings = diagnostics.filter(d => d.severity === 'warning').length
  const valid = errors === 0

  const requiredNodes = expect.nodes ?? []
  const missingNodes = requiredNodes.filter(spec => matchingNodeIds(diagram as ArcDiagramData, spec).length === 0)
  const nodes: BenchScore = {
    expected: requiredNodes.length,
    found: requiredNodes.length - missingNodes.length,
    missing: missingNodes,
  }

  const data = diagram as ArcDiagramData
  const connectors = Array.isArray(data?.connectors) ? data.connectors : []
  const missingEdges: [string, string][] = []
  const reversedEdges: [string, string][] = []
  for (const [fromSpec, toSpec] of expect.edges ?? []) {
    const forward = connectors.some(c => nameMatches(data.nodeData?.[c.from]?.name, fromSpec) && nameMatches(data.nodeData?.[c.to]?.name, toSpec))
    if (forward) continue
    const backward = connectors.some(c => nameMatches(data.nodeData?.[c.from]?.name, toSpec) && nameMatches(data.nodeData?.[c.to]?.name, fromSpec))
    if (backward) reversedEdges.push([fromSpec, toSpec])
    else missingEdges.push([fromSpec, toSpec])
  }
  const edgeExpected = (expect.edges ?? []).length
  const edges = {
    expected: edgeExpected,
    found: edgeExpected - missingEdges.length - reversedEdges.length,
    missing: missingEdges,
    reversed: reversedEdges,
  }

  const nodeCount = Object.keys(isRecord((diagram as Record<string, unknown>)?.nodes) ? (diagram as Record<string, unknown>).nodes as Record<string, unknown> : {}).length
  const sizeOk = (expect.minNodes === undefined || nodeCount >= expect.minNodes) && (expect.maxNodes === undefined || nodeCount <= expect.maxNodes)

  let rendered = false
  let renderBytes: number | undefined
  try {
    const svg = generateSVG(diagram, {})
    rendered = typeof svg === 'string' && svg.length > 0
    renderBytes = rendered ? Buffer.byteLength(svg) : undefined
  } catch {
    rendered = false
  }

  const pass = valid && nodes.missing.length === 0 && edges.missing.length === 0 && edges.reversed.length === 0 && sizeOk && rendered && (!opts.strict || warnings === 0)

  return {
    pass,
    valid,
    rendered,
    renderBytes,
    errors,
    warnings,
    diagnostics,
    nodes,
    edges,
    size: { count: nodeCount, min: expect.minNodes, max: expect.maxNodes, ok: sizeOk },
  }
}

export function runBench(dir: string, explicitCandidates: string[] = [], opts: { strict?: boolean } = {}): BenchReport {
  const cases = collectCases(dir)
  if (explicitCandidates.length && cases.length !== 1) {
    throw new Error('bench: explicit candidate files require a single case directory')
  }
  const reports: BenchCaseReport[] = cases.map(benchCase => {
    const candidates = caseCandidates(benchCase, explicitCandidates).map(path => {
      try {
        const diagram = JSON.parse(readFileSync(path, 'utf8'))
        return { candidate: path, ...scoreCandidate(diagram, benchCase.expect, opts) }
      } catch (err) {
        return {
          candidate: path,
          pass: false,
          valid: false,
          rendered: false,
          errors: 0,
          warnings: 0,
          diagnostics: [],
          nodes: { expected: benchCase.expect.nodes?.length ?? 0, found: 0, missing: benchCase.expect.nodes ?? [] },
          edges: { expected: (benchCase.expect.edges ?? []).length, found: 0, missing: benchCase.expect.edges ?? [], reversed: [] },
          size: { count: 0, min: benchCase.expect.minNodes, max: benchCase.expect.maxNodes, ok: false },
          inputError: err instanceof Error ? err.message : String(err),
        }
      }
    })
    return { case: benchCase.name, dir: benchCase.dir, prompt: benchCase.prompt, candidates }
  })

  const all = reports.flatMap(r => r.candidates)
  const passed = all.filter(r => r.pass).length
  return {
    ok: all.every(r => r.pass),
    cases: reports,
    totals: {
      cases: reports.length,
      candidates: all.length,
      passed,
      failed: all.length - passed,
      skipped: reports.filter(r => r.candidates.length === 0).length,
    },
  }
}
