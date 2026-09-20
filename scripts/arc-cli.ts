import { readFileSync } from 'node:fs'
import { validateDiagram } from '../src/utils/diagramDiagnostics.ts'
import type { Diagnostic, DiagnosticSeverity, Fix } from '../src/utils/diagramDiagnostics.ts'
import { diffDiagram } from '../src/utils/diffDiagram.ts'
import type { ArcDiagramData } from '../src/types/diagram.ts'
import diagramSchemaJson from '../schemas/arc-diagram.schema.json'

const USAGE = `arc — Arc diagram CLI

Usage:
  arc check <file|-> [--severity error|warning|all] [--format text|json] [--json] [--strict]
  arc diff <base> <head> [--format json|summary] [--json] [--summary]
  arc schema

Commands:
  check    Validate a diagram and print coded diagnostics
  diff     Print the structural DiagramDelta between two diagrams
  schema   Print the generated draft-07 JSON Schema

Input:
  use "-" or pipe JSON on stdin for check; diff expects two file paths

Exit codes:
  0 success · 1 diagnostics with errors or runtime failure · 2 usage error
`

type CheckFormat = 'text' | 'json'
type DiffFormat = 'json' | 'summary'
type SeverityFilter = DiagnosticSeverity | 'all'

class CliError extends Error {
  constructor(message: string, readonly exitCode = 1) {
    super(message)
  }
}

function fail(message: string, exitCode = 1): never {
  throw new CliError(message, exitCode)
}

function parseJson(text: string, label: string): unknown {
  try {
    return JSON.parse(text)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    fail(`${label}: invalid JSON — ${detail}`)
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

async function readDiagramText(path: string | undefined, label: string): Promise<string> {
  if (path === '-' || (!path && !process.stdin.isTTY)) return readStdin()
  if (!path) fail(`${label}: missing file path (or pipe JSON on stdin)`, 2)
  try {
    return readFileSync(path, 'utf8')
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    fail(`${label}: could not read ${path} — ${detail}`)
  }
}

async function readDiagram(path: string | undefined, label: string): Promise<unknown> {
  return parseJson(await readDiagramText(path, label), label)
}

function subjectLabel(diagnostic: Diagnostic): string {
  const subject = diagnostic.subject
  const id = subject.id ? `:${subject.id}` : ''
  const index = subject.index === undefined ? '' : `:${subject.index}`
  return `${subject.type}${id}${index}`
}

function fixLabel(fix: Fix): string {
  switch (fix.kind) {
    case 'add-node':
    case 'remove-node':
    case 'add-node-data':
    case 'remove-node-data':
      return `${fix.kind}(${fix.nodeId})`
    case 'retarget':
      return `retarget(${fix.end}→${fix.to})`
    case 'set-connector-id':
      return `set-connector-id(${fix.id})`
    case 'set-style':
      return `set-style(${fix.style})`
    case 'set-color':
      return `set-color(${fix.color})`
    case 'set-size':
      return `set-size(${fix.size})`
    case 'set-shape':
      return `set-shape(${fix.shape})`
    case 'set-anchor':
      return `set-anchor(${fix.field}=${fix.anchor})`
    default:
      return fix.kind
  }
}

function printDiagnostics(diagnostics: Diagnostic[]): void {
  for (const diagnostic of diagnostics) {
    console.log(`${diagnostic.severity} ${diagnostic.code} ${subjectLabel(diagnostic)} — ${diagnostic.message}`)
    if (diagnostic.supportedFixes?.length) {
      console.log(`  fixes: ${diagnostic.supportedFixes.map(fixLabel).join(', ')}`)
    }
  }
}

function parseCheckArgs(args: string[]): {
  file?: string
  severity: SeverityFilter
  format: CheckFormat
  strict: boolean
} {
  let file: string | undefined
  let severity: SeverityFilter = 'all'
  let format: CheckFormat = 'text'
  let strict = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--severity') {
      severity = args[++i] as SeverityFilter
      if (!['error', 'warning', 'all'].includes(severity)) fail('--severity must be error, warning, or all', 2)
    } else if (arg === '--format') {
      format = args[++i] as CheckFormat
      if (!['text', 'json'].includes(format)) fail('--format must be text or json', 2)
    } else if (arg === '--json') {
      format = 'json'
    } else if (arg === '--strict') {
      strict = true
    } else if (arg === '--help' || arg === '-h') {
      console.log(USAGE)
      process.exit(0)
    } else if (arg.startsWith('-') && arg !== '-') {
      fail(`unknown option: ${arg}`, 2)
    } else if (file !== undefined) {
      fail(`unexpected argument: ${arg}`, 2)
    } else {
      file = arg
    }
  }

  return { file, severity, format, strict }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

async function checkCommand(args: string[]): Promise<number> {
  const { file, severity, format, strict } = parseCheckArgs(args)
  let value: unknown
  try {
    value = await readDiagram(file, 'check')
  } catch (err) {
    if (format === 'json') console.log(JSON.stringify({ ok: false, error: errorMessage(err) }, null, 2))
    else console.error(errorMessage(err))
    return 1
  }

  const diagnostics = validateDiagram(value)
  const shown = severity === 'all' ? diagnostics : diagnostics.filter(d => d.severity === severity)
  const errors = diagnostics.filter(d => d.severity === 'error')
  const warnings = diagnostics.filter(d => d.severity === 'warning')
  const ok = errors.length === 0 && (!strict || warnings.length === 0)

  if (format === 'json') {
    console.log(JSON.stringify({ ok, diagnostics: shown }, null, 2))
  } else {
    if (diagnostics.length === 0) {
      console.log('ok — no diagnostics')
    } else {
      console.log(`${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`)
      printDiagnostics(shown)
    }
  }

  return ok ? 0 : 1
}

function parseDiffArgs(args: string[]): { base?: string; head?: string; format: DiffFormat } {
  let base: string | undefined
  let head: string | undefined
  let format: DiffFormat = 'json'

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--format') {
      format = args[++i] as DiffFormat
      if (!['json', 'summary'].includes(format)) fail('--format must be json or summary', 2)
    } else if (arg === '--summary') {
      format = 'summary'
    } else if (arg === '--json') {
      format = 'json'
    } else if (arg === '--help' || arg === '-h') {
      console.log(USAGE)
      process.exit(0)
    } else if (arg.startsWith('-')) {
      fail(`unknown option: ${arg}`, 2)
    } else if (base === undefined) {
      base = arg
    } else if (head === undefined) {
      head = arg
    } else {
      fail(`unexpected argument: ${arg}`, 2)
    }
  }

  if (!base || !head) fail('diff requires <base> and <head> file paths', 2)
  return { base, head, format }
}

function diffSummary(delta: ReturnType<typeof diffDiagram>): string {
  const lines = [
    `nodes: +${delta.nodes.added.length} -${delta.nodes.removed.length} moved:${delta.nodes.moved.length} changed:${delta.nodes.changed.length}`,
    `connectors: +${delta.connectors.added.length} -${delta.connectors.removed.length} changed:${delta.connectors.changed.length}`,
    `connectorStyles: +${delta.connectorStyles.added.length} -${delta.connectorStyles.removed.length} changed:${delta.connectorStyles.changed.length}`,
    `groups: +${delta.groups.added.length} -${delta.groups.removed.length} changed:${delta.groups.changed.length}`,
    `layout: ${delta.layoutChanged ? 'changed' : 'unchanged'}`,
  ]
  const ambiguous = delta.connectors.changed.filter(c => c.ambiguous).length
  if (ambiguous) lines.push(`ambiguous connector matches: ${ambiguous}`)
  return lines.join('\n')
}

async function diffCommand(args: string[]): Promise<number> {
  const { base, head, format } = parseDiffArgs(args)
  let baseValue: unknown
  let headValue: unknown
  try {
    baseValue = await readDiagram(base, 'base')
    headValue = await readDiagram(head, 'head')
  } catch (err) {
    if (format === 'json') console.log(JSON.stringify({ ok: false, error: errorMessage(err) }, null, 2))
    else console.error(errorMessage(err))
    return 1
  }

  const baseDiagnostics = validateDiagram(baseValue)
  const headDiagnostics = validateDiagram(headValue)
  const baseErrors = baseDiagnostics.filter(d => d.severity === 'error')
  const headErrors = headDiagnostics.filter(d => d.severity === 'error')

  if (baseErrors.length || headErrors.length) {
    if (format === 'json') {
      console.log(JSON.stringify({
        ok: false,
        errors: {
          ...(baseDiagnostics.length ? { base: baseDiagnostics } : {}),
          ...(headDiagnostics.length ? { head: headDiagnostics } : {}),
        },
      }, null, 2))
    } else {
      if (baseDiagnostics.length) {
        console.log('base diagnostics:')
        printDiagnostics(baseDiagnostics)
      }
      if (headDiagnostics.length) {
        console.log('head diagnostics:')
        printDiagnostics(headDiagnostics)
      }
    }
    return 1
  }

  const delta = diffDiagram(baseValue as ArcDiagramData, headValue as ArcDiagramData)
  console.log(format === 'json' ? JSON.stringify(delta, null, 2) : diffSummary(delta))
  return 0
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2)
  let exitCode: number

  switch (command) {
    case 'check':
      exitCode = await checkCommand(args)
      break
    case 'diff':
      exitCode = await diffCommand(args)
      break
    case 'schema':
      if (args.length) fail(`schema takes no arguments`, 2)
      console.log(JSON.stringify(diagramSchemaJson, null, 2))
      exitCode = 0
      break
    case '--help':
    case '-h':
    case undefined:
      console.log(USAGE)
      exitCode = command ? 0 : 2
      break
    default:
      fail(`unknown command: ${command}`, 2)
  }

  process.exitCode = exitCode
}

main().catch((err: unknown) => {
  if (err instanceof CliError && err.message !== USAGE) {
    console.error(err.message)
    process.exitCode = err.exitCode
    return
  }
  console.error(err instanceof Error ? err.message : String(err))
  process.exitCode = 1
})
