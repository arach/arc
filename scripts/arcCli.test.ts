import { describe, expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CLI = join(import.meta.dir, 'arc-cli.ts')

interface CliResult {
  status: number | null
  stdout: string
  stderr: string
}

function run(args: string[], input?: string): CliResult {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    input,
    encoding: 'utf8',
  })
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

const valid = {
  layout: { width: 600, height: 300 },
  nodes: {
    a: { x: 40, y: 80, size: 'm' },
  },
  nodeData: {
    a: { icon: 'Server', name: 'A', color: 'blue' },
  },
  connectors: [],
  connectorStyles: {},
}

const warningOnly = {
  ...valid,
  connectorStyles: {
    unused: { color: 'blue', strokeWidth: 2 },
  },
}

const invalid = {
  ...valid,
  nodeData: {
    a: { icon: 'Server', name: 'A', color: 'not-a-color' },
  },
}

const head = {
  ...valid,
  nodes: {
    ...valid.nodes,
    b: { x: 280, y: 80, size: 'm' },
  },
  nodeData: {
    ...valid.nodeData,
    b: { icon: 'Database', name: 'B', color: 'emerald' },
  },
  connectors: [
    { id: 'a-to-b', from: 'a', to: 'b', fromAnchor: 'right', toAnchor: 'left', style: 'api' },
  ],
  connectorStyles: {
    api: { color: 'violet', strokeWidth: 2, label: 'API' },
  },
}

describe('arc CLI', () => {
  test('check returns {ok:true, diagnostics:[]} for a clean stdin diagram', () => {
    const result = run(['check', '-', '--json'], JSON.stringify(valid))
    expect(result.status).toBe(0)
    expect(JSON.parse(result.stdout)).toEqual({ ok: true, diagnostics: [] })
  })

  test('check returns coded diagnostics and exit 1 for invalid JSON documents', () => {
    const dir = mkdtempSync(join(tmpdir(), 'arc-cli-'))
    try {
      const file = join(dir, 'bad.json')
      writeFileSync(file, JSON.stringify(invalid))
      const result = run(['check', file, '--json'])
      expect(result.status).toBe(1)
      const payload = JSON.parse(result.stdout)
      expect(payload.ok).toBe(false)
      expect(payload.diagnostics[0].code).toBe('semantic/unknown-color')
      expect(payload.diagnostics[0].supportedFixes?.[0]).toEqual({ kind: 'set-color', color: 'violet' })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('check warnings do not fail unless --strict is set', () => {
    const normal = run(['check', '-', '--json'], JSON.stringify(warningOnly))
    expect(normal.status).toBe(0)
    expect(JSON.parse(normal.stdout).diagnostics[0].severity).toBe('warning')

    const strict = run(['check', '-', '--json', '--strict'], JSON.stringify(warningOnly))
    expect(strict.status).toBe(1)
    expect(JSON.parse(strict.stdout).ok).toBe(false)
  })

  test('check --severity error filters warnings out of the JSON payload', () => {
    const result = run(['check', '-', '--json', '--severity', 'error'], JSON.stringify(warningOnly))
    expect(result.status).toBe(0)
    expect(JSON.parse(result.stdout)).toEqual({ ok: true, diagnostics: [] })
  })

  test('check --json emits an error payload for malformed JSON', () => {
    const result = run(['check', '-', '--json'], '{')
    expect(result.status).toBe(1)
    const payload = JSON.parse(result.stdout)
    expect(payload.ok).toBe(false)
    expect(payload.error).toContain('check: invalid JSON')
  })

  test('diff prints the structural delta JSON', () => {
    const dir = mkdtempSync(join(tmpdir(), 'arc-cli-'))
    try {
      const baseFile = join(dir, 'base.json')
      const headFile = join(dir, 'head.json')
      writeFileSync(baseFile, JSON.stringify(valid))
      writeFileSync(headFile, JSON.stringify(head))
      const result = run(['diff', baseFile, headFile])
      expect(result.status).toBe(0)
      const delta = JSON.parse(result.stdout)
      expect(delta.nodes.added).toEqual(['b'])
      expect(delta.connectors.added).toHaveLength(1)
      expect(delta.connectorStyles.added).toEqual(['api'])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('diff --summary reports counts', () => {
    const dir = mkdtempSync(join(tmpdir(), 'arc-cli-'))
    try {
      const baseFile = join(dir, 'base.json')
      const headFile = join(dir, 'head.json')
      writeFileSync(baseFile, JSON.stringify(valid))
      writeFileSync(headFile, JSON.stringify(head))
      const result = run(['diff', baseFile, headFile, '--summary'])
      expect(result.status).toBe(0)
      expect(result.stdout).toContain('nodes: +1 -0 moved:0 changed:0')
      expect(result.stdout).toContain('connectors: +1 -0 changed:0')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('diff validates both inputs before diffing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'arc-cli-'))
    try {
      const baseFile = join(dir, 'base.json')
      const headFile = join(dir, 'head.json')
      writeFileSync(baseFile, JSON.stringify(invalid))
      writeFileSync(headFile, JSON.stringify(valid))
      const result = run(['diff', baseFile, headFile])
      expect(result.status).toBe(1)
      const payload = JSON.parse(result.stdout)
      expect(payload.ok).toBe(false)
      expect(payload.errors.base[0].code).toBe('semantic/unknown-color')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('render writes an SVG atomically and emits a deterministic receipt', () => {
    const dir = mkdtempSync(join(tmpdir(), 'arc-cli-'))
    try {
      const input = join(dir, 'diagram.json')
      const output = join(dir, 'diagram.svg')
      const source = JSON.stringify(valid)
      writeFileSync(input, source)

      const result = run(['render', input, '--out', output, '--json'])
      expect(result.status).toBe(0)
      const receipt = JSON.parse(result.stdout)
      const svg = readFileSync(output, 'utf8')
      expect(receipt).toMatchObject({
        ok: true,
        command: 'render',
        input,
        output,
        format: 'svg',
        width: 640,
        height: 340,
        bytes: Buffer.byteLength(svg),
      })
      expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="340"')
      expect(svg).toContain('A')
      expect(receipt.sha256.source).toBe(createHash('sha256').update(source).digest('hex'))
      expect(receipt.sha256.output).toBe(createHash('sha256').update(svg).digest('hex'))
      expect(readdirSync(dir).filter(name => name.startsWith('.diagram.svg.tmp'))).toEqual([])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('render fails closed and does not overwrite an existing artifact', () => {
    const dir = mkdtempSync(join(tmpdir(), 'arc-cli-'))
    try {
      const input = join(dir, 'bad.json')
      const output = join(dir, 'diagram.svg')
      writeFileSync(input, JSON.stringify(invalid))
      writeFileSync(output, 'keep me')

      const result = run(['render', input, '--out', output, '--json'])
      expect(result.status).toBe(1)
      const payload = JSON.parse(result.stdout)
      expect(payload.ok).toBe(false)
      expect(payload.error.code).toBe('validation/failed')
      expect(payload.diagnostics[0].code).toBe('semantic/unknown-color')
      expect(readFileSync(output, 'utf8')).toBe('keep me')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('render warns by default and --strict blocks the write', () => {
    const dir = mkdtempSync(join(tmpdir(), 'arc-cli-'))
    try {
      const input = join(dir, 'warning.json')
      const output = join(dir, 'warning.svg')
      writeFileSync(input, JSON.stringify(warningOnly))

      const allowed = run(['render', input, '--out', output, '--json'])
      expect(allowed.status).toBe(0)
      expect(JSON.parse(allowed.stdout).diagnostics[0].severity).toBe('warning')
      expect(existsSync(output)).toBe(true)

      rmSync(output)
      const strict = run(['render', input, '--out', output, '--json', '--strict'])
      expect(strict.status).toBe(1)
      expect(JSON.parse(strict.stdout).error.code).toBe('validation/failed')
      expect(existsSync(output)).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('render returns a coded JSON error without writing on malformed input', () => {
    const dir = mkdtempSync(join(tmpdir(), 'arc-cli-'))
    try {
      const output = join(dir, 'bad.svg')
      const result = run(['render', '-', '--out', output, '--json'], '{')
      expect(result.status).toBe(1)
      const payload = JSON.parse(result.stdout)
      expect(payload.error.code).toBe('cli/input-error')
      expect(existsSync(output)).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('render usage errors are still structured when --json is present', () => {
    const result = run(['render', '--json'])
    expect(result.status).toBe(2)
    const payload = JSON.parse(result.stdout)
    expect(payload.error.code).toBe('cli/usage-error')
  })

  test('schema prints the generated draft-07 schema', () => {
    const result = run(['schema'])
    expect(result.status).toBe(0)
    const schema = JSON.parse(result.stdout)
    expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#')
    expect(schema.$ref).toBe('#/definitions/ArcDiagramData')
  })
})
