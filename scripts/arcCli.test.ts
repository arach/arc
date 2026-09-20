import { describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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

  test('schema prints the generated draft-07 schema', () => {
    const result = run(['schema'])
    expect(result.status).toBe(0)
    const schema = JSON.parse(result.stdout)
    expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#')
    expect(schema.$ref).toBe('#/definitions/ArcDiagramData')
  })
})
