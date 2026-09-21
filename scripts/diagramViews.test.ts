import { describe, expect, it } from 'bun:test'
import { resolveViewFocus, type DiagramView } from '../src/components/ArcDiagram'
import { toExportFormat, type ArcDiagram } from '../src/types/diagram'
import { validateDiagram } from '../src/utils/diagramDiagnostics'

const nodes = {
  app: { x: 100, y: 100, size: 'm' as const },
  api: { x: 400, y: 100, size: 'm' as const },
  db: { x: 700, y: 100, size: 'm' as const },
  queue: { x: 400, y: 300, size: 'm' as const },
}
const connectors = [
  { from: 'app', to: 'api', fromAnchor: 'right' as const, toAnchor: 'left' as const, style: 'flow' },
  { from: 'api', to: 'db', fromAnchor: 'right' as const, toAnchor: 'left' as const, style: 'flow' },
  { from: 'api', to: 'queue', fromAnchor: 'bottom' as const, toAnchor: 'top' as const, style: 'flow' },
]
const connectorStyles = { flow: { color: 'zinc', strokeWidth: 2 } }
const nodeData = Object.fromEntries(
  Object.keys(nodes).map(id => [id, { name: id, icon: 'Box', color: 'zinc' }]),
)

describe('resolveViewFocus', () => {
  const focusTargets = {
    api: { nodes: ['db'], connectors: [{ from: 'api', to: 'db' }], caption: 'API story' },
  }

  it('returns empty sets for no view', () => {
    const { nodeIds, connectorIndexes } = resolveViewFocus(undefined, connectors, focusTargets)
    expect(nodeIds.size).toBe(0)
    expect(connectorIndexes.size).toBe(0)
  })

  it('inherits the anchor node focusTarget story', () => {
    const view: DiagramView = { id: 'v1', title: 'API', node: 'api' }
    const { nodeIds, connectorIndexes } = resolveViewFocus(view, connectors, focusTargets)
    // anchor + declared story + direct neighbors (append)
    expect(nodeIds.has('api')).toBe(true)
    expect(nodeIds.has('db')).toBe(true)
    expect(connectorIndexes.has(1)).toBe(true)
    expect(nodeIds.has('queue')).toBe(true) // neighbor, append mode
  })

  it('view overrides replace the anchor story', () => {
    const view: DiagramView = {
      id: 'v1', title: 'Queue path', node: 'api', mode: 'replace',
      nodes: ['api', 'queue'], connectors: [{ from: 'api', to: 'queue' }],
    }
    const { nodeIds, connectorIndexes } = resolveViewFocus(view, connectors, focusTargets)
    expect(nodeIds.has('db')).toBe(false)
    expect(nodeIds.has('queue')).toBe(true)
    expect(connectorIndexes.has(2)).toBe(true)
    expect(connectorIndexes.has(0)).toBe(false)
  })

  it('anchor + mode append still picks up neighbors', () => {
    const view: DiagramView = { id: 'v1', title: 'Around API', node: 'api', mode: 'append' }
    const { nodeIds } = resolveViewFocus(view, connectors, focusTargets)
    expect(nodeIds.has('app')).toBe(true)
    expect(nodeIds.has('db')).toBe(true)
    expect(nodeIds.has('queue')).toBe(true)
  })

  it('node-less views highlight exactly the declared set', () => {
    const view: DiagramView = {
      id: 'v1', title: 'Edge', nodes: ['app', 'api'],
      connectors: [{ from: 'app', to: 'api' }],
    }
    const { nodeIds, connectorIndexes } = resolveViewFocus(view, connectors, focusTargets)
    expect(nodeIds.size).toBe(2)
    expect(connectorIndexes.size).toBe(1)
    expect(connectorIndexes.has(0)).toBe(true)
  })

  it('matches connectors by Connector.id when present', () => {
    const withIds = [
      { id: 'c-app-api', ...connectors[0] },
      { id: 'c-api-db', ...connectors[1] },
    ]
    const view: DiagramView = { id: 'v', title: 'T', connectors: [{ id: 'c-api-db' }] }
    const { nodeIds, connectorIndexes } = resolveViewFocus(view, withIds)
    expect(connectorIndexes.has(1)).toBe(true)
    expect(connectorIndexes.has(0)).toBe(false)
    expect(nodeIds.has('api')).toBe(true)
    expect(nodeIds.has('db')).toBe(true)
  })
})

describe('views serialization', () => {
  it('toExportFormat carries views through', () => {
    const diagram: ArcDiagram = {
      layout: { width: 800, height: 400 },
      grid: { enabled: true, size: 24, color: '#000', opacity: 0.1, type: 'dots' },
      nodes, nodeData, connectors, connectorStyles: {},
      views: [{ id: 'intro', title: 'Overview', nodes: ['app', 'api'], caption: 'c' }],
    }
    const out = toExportFormat(diagram)
    expect(out.views).toHaveLength(1)
    expect(out.views![0]).toMatchObject({ id: 'intro', title: 'Overview' })
  })
})

describe('validateDiagram — views', () => {
  const base = () => ({ layout: { width: 800, height: 400 }, nodes, nodeData, connectors, connectorStyles })
  const codes = (value: unknown) => validateDiagram(value).map(x => x.code)

  it('flags a non-array views field', () => {
    expect(codes({ ...base(), views: { nope: true } })).toContain('shape/invalid-views')
  })

  it('flags a view missing id/title', () => {
    expect(codes({ ...base(), views: [{ node: 'app' }] })).toContain('shape/invalid-view')
  })

  it('flags duplicate view ids', () => {
    expect(codes({ ...base(), views: [
      { id: 'a', title: 'One' },
      { id: 'a', title: 'Two' },
    ] })).toContain('semantic/duplicate-view-id')
  })

  it('flags dangling node refs', () => {
    const missing = validateDiagram({ ...base(), views: [
      { id: 'a', title: 'A', node: 'ghost', nodes: ['app', 'phantom'] },
    ] }).filter(x => x.code === 'semantic/view-missing-node')
    expect(missing.map(x => (x.evidence as any).value).sort()).toEqual(['ghost', 'phantom'])
  })

  it('flags dangling connector refs', () => {
    const missing = validateDiagram({ ...base(), views: [
      { id: 'a', title: 'A', connectors: [{ id: 'nope' }, { from: 'app', to: 'api' }] },
    ] }).filter(x => x.code === 'semantic/view-missing-connector')
    expect(missing).toHaveLength(1)
    expect((missing[0].evidence as any).ref.id).toBe('nope')
  })

  it('accepts a clean views list', () => {
    const diags = validateDiagram({ ...base(), views: [
      { id: 'a', title: 'A', node: 'app' },
      { id: 'b', title: 'B', nodes: ['db'], connectors: [{ from: 'api', to: 'db' }] },
    ] })
    expect(diags.filter(x => x.code.startsWith('shape/invalid-view') || x.code.startsWith('semantic/'))).toHaveLength(0)
  })
})
