import { describe, expect, test } from 'bun:test'
import { diffDiagram } from '../src/utils/diffDiagram'
import type { ArcDiagramData, Connector } from '../src/types/diagram'

const conn = (from: string, to: string, extra: Partial<Connector> = {}): Connector => ({
  from,
  to,
  fromAnchor: 'right',
  toAnchor: 'left',
  style: 's',
  ...extra,
})

const diagram = (over: Partial<ArcDiagramData> = {}): ArcDiagramData => ({
  layout: { width: 600, height: 320 },
  nodes: {},
  nodeData: {},
  connectors: [],
  connectorStyles: {},
  ...over,
})

describe('diffDiagram', () => {
  test('identity diff produces an all-empty delta', () => {
    const d = diagram({
      nodes: { a: { x: 0, y: 0, size: 'm' } },
      nodeData: { a: { icon: 'Box', name: 'A', color: 'blue' } },
      connectors: [conn('a', 'b')],
      connectorStyles: { s: { color: 'zinc', strokeWidth: 2 } },
      groups: [{ id: 'g', x: 0, y: 0, width: 100, height: 100, type: 'rect', color: 'zinc' }],
    })
    expect(diffDiagram(d, d)).toEqual({
      nodes: { added: [], removed: [], moved: [], changed: [] },
      connectors: { added: [], removed: [], changed: [] },
      connectorStyles: { added: [], removed: [], changed: [] },
      groups: { added: [], removed: [], changed: [] },
      layoutChanged: false,
    })
  })

  test('nodes: added, removed (with base geometry), moved, changed', () => {
    const base = diagram({
      nodes: {
        keep: { x: 0, y: 0, size: 'm' },
        drop: { x: 200, y: 0, size: 's' },
        slide: { x: 0, y: 100, size: 'm' },
        edit: { x: 400, y: 0, size: 'm' },
      },
      nodeData: {
        keep: { icon: 'Box', name: 'Keep', color: 'blue' },
        drop: { icon: 'Box', name: 'Drop', color: 'rose' },
        slide: { icon: 'Box', name: 'Slide', color: 'amber' },
        edit: { icon: 'Box', name: 'Edit', color: 'blue' },
      },
    })
    const head = diagram({
      nodes: {
        keep: { x: 0, y: 0, size: 'm' },
        slide: { x: 40, y: 100, size: 'm' },
        edit: { x: 400, y: 0, size: 'm' },
        fresh: { x: 400, y: 200, size: 'xs' },
      },
      nodeData: {
        keep: { icon: 'Box', name: 'Keep', color: 'blue' },
        slide: { icon: 'Box', name: 'Slide', color: 'amber' },
        edit: { icon: 'Box', name: 'Edited', color: 'emerald', subtitle: 'new' },
        fresh: { icon: 'Zap', name: 'Fresh', color: 'violet' },
      },
    })

    const d = diffDiagram(base, head)
    expect(d.nodes.added).toEqual(['fresh'])
    expect(d.nodes.removed).toEqual([
      { id: 'drop', position: { x: 200, y: 0, size: 's' }, data: { icon: 'Box', name: 'Drop', color: 'rose' } },
    ])
    expect(d.nodes.moved).toEqual([
      { id: 'slide', from: { x: 0, y: 100, size: 'm' }, to: { x: 40, y: 100, size: 'm' } },
    ])
    expect(d.nodes.changed).toEqual([{ id: 'edit', fields: ['name', 'color', 'subtitle'] }])
  })

  test('a node can be both moved and changed; size counts as moved', () => {
    const base = diagram({
      nodes: { a: { x: 0, y: 0, size: 'm' } },
      nodeData: { a: { icon: 'Box', name: 'A', color: 'blue' } },
    })
    const head = diagram({
      nodes: { a: { x: 0, y: 0, size: 'l' } },
      nodeData: { a: { icon: 'Box', name: 'A2', color: 'blue' } },
    })
    const d = diffDiagram(base, head)
    expect(d.nodes.moved.map(m => m.id)).toEqual(['a'])
    expect(d.nodes.changed).toEqual([{ id: 'a', fields: ['name'] }])
  })

  test('connectors: added, removed, changed by from→to', () => {
    const base = diagram({
      connectors: [
        conn('a', 'b'),
        conn('b', 'c'),
        conn('c', 'd', { style: 'old' }),
      ],
    })
    const head = diagram({
      connectors: [
        conn('a', 'b'),
        conn('b', 'c', { curve: 'natural' }),
        conn('d', 'e'),
      ],
    })
    const d = diffDiagram(base, head)
    expect(d.connectors.added.map(e => e.connector)).toEqual([conn('d', 'e')])
    expect(d.connectors.removed.map(e => e.connector)).toEqual([conn('c', 'd', { style: 'old' })])
    expect(d.connectors.changed).toEqual([
      { key: 'b->c', before: conn('b', 'c'), after: conn('b', 'c', { curve: 'natural' }), fields: ['curve'] },
    ])
  })

  test('id-keyed connectors survive reorder; id field changes are reported', () => {
    const base = diagram({
      connectors: [
        conn('a', 'b', { id: 'first' }),
        conn('b', 'c', { id: 'second' }),
      ],
    })
    const head = diagram({
      connectors: [
        conn('b', 'c', { id: 'second', curve: 'step' }),
        conn('a', 'b', { id: 'first' }),
      ],
    })
    const d = diffDiagram(base, head)
    expect(d.connectors.added).toEqual([])
    expect(d.connectors.removed).toEqual([])
    expect(d.connectors.changed).toEqual([
      { key: 'second', before: conn('b', 'c', { id: 'second' }), after: conn('b', 'c', { id: 'second', curve: 'step' }), fields: ['curve'] },
    ])
  })

  test('id-keyed connectors track reroutes (endpoint change is a change, not remove+add)', () => {
    const base = diagram({ connectors: [conn('a', 'b', { id: 'e1' })] })
    const head = diagram({ connectors: [conn('a', 'c', { id: 'e1' })] })
    const d = diffDiagram(base, head)
    expect(d.connectors.changed).toEqual([
      { key: 'e1', before: conn('a', 'b', { id: 'e1' }), after: conn('a', 'c', { id: 'e1' }), fields: ['to'] },
    ])
    expect(d.connectors.added).toEqual([])
    expect(d.connectors.removed).toEqual([])
  })

  test('a connector gaining an id pair-matches by endpoints instead of remove+add', () => {
    const base = diagram({ connectors: [conn('a', 'b')] })
    const head = diagram({ connectors: [conn('a', 'b', { id: 'e1' })] })
    const d = diffDiagram(base, head)
    expect(d.connectors.changed).toEqual([
      { key: 'e1', before: conn('a', 'b'), after: conn('a', 'b', { id: 'e1' }), fields: ['id'] },
    ])
    expect(d.connectors.added).toEqual([])
    expect(d.connectors.removed).toEqual([])
  })

  test('different ids on the same endpoints never pair — remove + add', () => {
    const base = diagram({ connectors: [conn('a', 'b', { id: 'x' })] })
    const head = diagram({ connectors: [conn('a', 'b', { id: 'y' })] })
    const d = diffDiagram(base, head)
    expect(d.connectors.added.map(e => e.connector.id)).toEqual(['y'])
    expect(d.connectors.removed.map(e => e.connector.id)).toEqual(['x'])
    expect(d.connectors.changed).toEqual([])
  })

  test('parallel edges pair by document order and flag ambiguous', () => {
    const base = diagram({
      connectors: [conn('a', 'b'), conn('a', 'b', { style: 't' })],
    })
    const head = diagram({
      connectors: [conn('a', 'b', { curve: 'step' })],
    })
    const d = diffDiagram(base, head)
    // One pairing (first↔first), one removal — both flagged.
    expect(d.connectors.changed).toEqual([
      { key: 'a->b', before: conn('a', 'b'), after: conn('a', 'b', { curve: 'step' }), fields: ['curve'], ambiguous: true },
    ])
    expect(d.connectors.removed).toEqual([
      { connector: conn('a', 'b', { style: 't' }), ambiguous: true },
    ])
  })

  test('connectorStyles: added, removed, changed', () => {
    const base = diagram({
      connectorStyles: {
        keep: { color: 'zinc', strokeWidth: 2 },
        drop: { color: 'rose', strokeWidth: 1 },
        edit: { color: 'blue', strokeWidth: 2 },
      },
    })
    const head = diagram({
      connectorStyles: {
        keep: { color: 'zinc', strokeWidth: 2 },
        edit: { color: 'blue', strokeWidth: 3, dashed: true },
        fresh: { color: 'violet', strokeWidth: 1.5 },
      },
    })
    const d = diffDiagram(base, head)
    expect(d.connectorStyles.added).toEqual(['fresh'])
    expect(d.connectorStyles.removed).toEqual(['drop'])
    expect(d.connectorStyles.changed).toEqual([
      { key: 'edit', fields: ['strokeWidth', 'dashed'] },
    ])
  })

  test('groups: added, removed, changed', () => {
    const g = (id: string, over = {}) => ({ id, x: 0, y: 0, width: 100, height: 80, type: 'rect' as const, color: 'zinc' as const, ...over })
    const base = diagram({ groups: [g('keep'), g('drop'), g('edit')] })
    const head = diagram({ groups: [g('keep'), g('edit', { label: 'Edge', x: 8 }), g('fresh')] })
    const d = diffDiagram(base, head)
    expect(d.groups.added).toEqual(['fresh'])
    expect(d.groups.removed).toEqual(['drop'])
    expect(d.groups.changed).toEqual([{ id: 'edit', fields: ['x', 'label'] }])
  })

  test('layoutChanged tracks layout size', () => {
    const base = diagram({ layout: { width: 600, height: 320 } })
    const head = diagram({ layout: { width: 800, height: 320 } })
    expect(diffDiagram(base, head).layoutChanged).toBe(true)
    expect(diffDiagram(base, base).layoutChanged).toBe(false)
  })
})
