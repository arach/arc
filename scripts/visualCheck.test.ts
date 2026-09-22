import { afterAll, describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadManifest, runVisualCheck } from './visualCheck.ts'

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xde, 0xad, 0xbe, 0xef])

const diagram = {
  layout: { width: 300, height: 160 },
  nodes: {
    a: { x: 20, y: 50, size: 's' },
    b: { x: 170, y: 50, size: 's' },
  },
  nodeData: {
    a: { icon: 'Monitor', name: 'A', color: 'violet' },
    b: { icon: 'Server', name: 'B', color: 'emerald' },
  },
  connectors: [
    { id: 'c1', from: 'a', to: 'b', fromAnchor: 'right', toAnchor: 'left', style: 'api' },
  ],
  connectorStyles: {
    api: { color: 'blue', strokeWidth: 2 },
  },
}

const tempRoots: string[] = []

function makeDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'arc-visual-'))
  tempRoots.push(dir)
  return dir
}

function writeCase(dir: string, manifest: unknown, name = 'flow', doc: unknown = diagram): void {
  mkdirSync(join(dir, 'cases'), { recursive: true })
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest))
  writeFileSync(join(dir, 'cases', `${name}.json`), JSON.stringify(doc))
}

afterAll(() => {
  for (const dir of tempRoots) rmSync(dir, { recursive: true, force: true })
})

describe('loadManifest', () => {
  test('rejects a missing manifest', () => {
    const dir = makeDir()
    expect(() => loadManifest(dir)).toThrow(/manifest\.json/)
  })

  test('rejects malformed variant fields', () => {
    const dir = makeDir()
    writeCase(dir, { variants: [{ theme: 42 }], cases: [{ diagram: 'cases/flow.json' }] })
    expect(() => loadManifest(dir)).toThrow(/"theme" must be a string/)
  })

  test('defaults the case name to the diagram filename stem', () => {
    const dir = makeDir()
    writeCase(dir, { cases: [{ diagram: 'cases/flow.json' }] })
    expect(loadManifest(dir).cases[0].name).toBeUndefined()
  })
})

describe('runVisualCheck', () => {
  test('--update writes goldens, then a check run passes byte-for-byte', async () => {
    const dir = makeDir()
    writeCase(dir, { variants: [{ id: 'light' }, { id: 'spacex', theme: 'spacex' }], cases: [{ diagram: 'cases/flow.json' }] })

    const updated = await runVisualCheck(dir, { update: true })
    expect(updated.ok).toBe(true)
    expect(updated.results.map(r => r.svg.status)).toEqual(['updated', 'updated'])
    expect(existsSync(join(dir, 'golden', 'flow.light.svg'))).toBe(true)
    expect(existsSync(join(dir, 'golden', 'flow.spacex.svg'))).toBe(true)

    const check = await runVisualCheck(dir)
    expect(check.ok).toBe(true)
    expect(check.results.map(r => r.svg.status)).toEqual(['pass', 'pass'])
  })

  test('a diagram change produces a diff and drops the actual render under .out/', async () => {
    const dir = makeDir()
    writeCase(dir, { cases: [{ diagram: 'cases/flow.json' }] })
    await runVisualCheck(dir, { update: true })

    const moved = { ...diagram, nodes: { ...diagram.nodes, a: { ...diagram.nodes.a, x: 60 } } }
    writeFileSync(join(dir, 'cases', 'flow.json'), JSON.stringify(moved))
    const check = await runVisualCheck(dir)
    expect(check.ok).toBe(false)
    expect(check.results[0].svg.status).toBe('diff')
    const actual = readFileSync(String(check.results[0].svg.output), 'utf8')
    const golden = readFileSync(join(dir, 'golden', 'flow.default.svg'), 'utf8')
    expect(actual).not.toBe(golden)
    expect(actual).toContain('<svg')
  })

  test('missing golden fails in check mode and writes .out/', async () => {
    const dir = makeDir()
    writeCase(dir, { cases: [{ diagram: 'cases/flow.json' }] })
    const check = await runVisualCheck(dir)
    expect(check.ok).toBe(false)
    expect(check.results[0].svg.status).toBe('missing')
    expect(existsSync(String(check.results[0].svg.output))).toBe(true)
  })

  test('a missing diagram reports a read error and a non-object doc a render error', async () => {
    const dir = makeDir()
    mkdirSync(join(dir, 'cases'), { recursive: true })
    writeFileSync(join(dir, 'cases', 'notobject.json'), JSON.stringify('just a string'))
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ cases: [{ diagram: 'cases/missing.json' }, { name: 'notobject', diagram: 'cases/notobject.json' }] }))

    const check = await runVisualCheck(dir)
    expect(check.ok).toBe(false)
    expect(check.results[0].svg.status).toBe('error')
    expect(check.results[0].svg.error).toContain('cannot read')
    expect(check.results[1].svg.status).toBe('error')
    expect(check.results[1].svg.error).toBeTruthy()
  })

  test('an unknown theme is a render error, not a crash', async () => {
    const dir = makeDir()
    writeCase(dir, { variants: [{ theme: 'nope' }], cases: [{ diagram: 'cases/flow.json' }] })
    const check = await runVisualCheck(dir)
    expect(check.ok).toBe(false)
    expect(check.results[0].svg.status).toBe('error')
    expect(check.results[0].svg.error).toContain('render/invalid-option')
  })

  test('png compare is strict-aware: diffs warn by default and fail under --png-strict', async () => {
    const dir = makeDir()
    writeCase(dir, { cases: [{ diagram: 'cases/flow.json' }] })
    const runChrome = async (_exe: string, args: string[]) => {
      const out = args.find(a => a.startsWith('--screenshot='))!.split('=')[1]
      writeFileSync(out, PNG_BYTES)
    }

    await runVisualCheck(dir, { update: true, png: true, runChrome })
    const golden = readFileSync(join(dir, 'golden', 'flow.default.png'))
    expect(golden.equals(PNG_BYTES)).toBe(true)

    const runChanged = async (_exe: string, args: string[]) => {
      const out = args.find(a => a.startsWith('--screenshot='))!.split('=')[1]
      writeFileSync(out, Buffer.concat([PNG_BYTES, Buffer.from([1, 2, 3])]))
    }
    const lax = await runVisualCheck(dir, { png: true, runChrome: runChanged })
    expect(lax.results[0].png?.status).toBe('diff')
    expect(lax.ok).toBe(true)
    const strict = await runVisualCheck(dir, { png: true, pngStrict: true, runChrome: runChanged })
    expect(strict.ok).toBe(false)
  })

  test('png skips cleanly when Chrome is unavailable', async () => {
    const dir = makeDir()
    writeCase(dir, { cases: [{ diagram: 'cases/flow.json' }] })
    await runVisualCheck(dir, { update: true })
    const check = await runVisualCheck(dir, { png: true, env: { ARC_CHROME: '/nonexistent', CHROME_PATH: '', PUPPETEER_EXECUTABLE_PATH: '', PATH: '' } })
    expect(check.ok).toBe(true)
    expect(check.results[0].png?.status).toBe('skipped')
  })
})

describe('cli', () => {
  test('subprocess: missing manifest exits 2, --help exits 0', () => {
    const dir = makeDir()
    const root = join(dirname(fileURLToPath(import.meta.url)), '..')
    const missing = spawnSync('bun', ['scripts/visualCheck.ts', dir], { cwd: root, encoding: 'utf8' })
    expect(missing.status).toBe(2)
    const help = spawnSync('bun', ['scripts/visualCheck.ts', '--help'], { cwd: root, encoding: 'utf8' })
    expect(help.status).toBe(0)
    expect(help.stdout).toContain('golden-render regression')
  })
})
