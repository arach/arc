// Structural diff between two ArcDiagramData documents.
// Produces a flat, machine-readable DiagramDelta — the same object the
// `delta` prop on ArcDiagram consumes for a Before/Delta render.

import { connectorKey } from '../types/diagram'
import type { ArcDiagramData, Connector, GroupShape, NodeData, NodePosition } from '../types/diagram'

export interface RemovedNode {
  id: string
  /** Base position — enough geometry to ghost the node without the base doc. */
  position: NodePosition
  /** Base node data snapshot, when the node had one. */
  data?: NodeData
}

export interface MovedNode {
  id: string
  from: NodePosition
  to: NodePosition
}

export interface ChangedNode {
  id: string
  fields: string[]
}

export interface ConnectorDelta {
  connector: Connector
  /**
   * The `from→to` pair had parallel edges on a side, so the base↔head
   * pairing was made by document order and may not be the author's intent.
   */
  ambiguous?: boolean
}

export interface ChangedConnector {
  /** connector.key — the connector `id`, else `from->to`. */
  key: string
  before: Connector
  after: Connector
  fields: string[]
  ambiguous?: boolean
}

export interface ChangedKeys {
  key: string
  fields: string[]
}

export interface ChangedIds {
  id: string
  fields: string[]
}

export interface DiagramDelta {
  nodes: {
    added: string[]
    removed: RemovedNode[]
    moved: MovedNode[]
    changed: ChangedNode[]
  }
  connectors: {
    added: ConnectorDelta[]
    removed: ConnectorDelta[]
    changed: ChangedConnector[]
  }
  connectorStyles: {
    added: string[]
    removed: string[]
    changed: ChangedKeys[]
  }
  groups: {
    added: string[]
    removed: string[]
    changed: ChangedIds[]
  }
  layoutChanged: boolean
}

/** Field names that differ between two flat records. `undefined` == absent. */
function changedFields<T extends object>(before: T, after: T): string[] {
  const a = before as Record<string, unknown>
  const b = after as Record<string, unknown>
  const fields: string[] = []
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (!Object.is(a[key], b[key])) fields.push(key)
  }
  return fields
}

const ambiguousFlag = (ambiguous: boolean) => (ambiguous ? { ambiguous: true } : {})

function diffNodes(base: ArcDiagramData, head: ArcDiagramData): DiagramDelta['nodes'] {
  const added: string[] = []
  const removed: RemovedNode[] = []
  const moved: MovedNode[] = []
  const changed: ChangedNode[] = []

  for (const id of Object.keys(head.nodes)) {
    if (!base.nodes[id]) added.push(id)
  }

  for (const [id, b] of Object.entries(base.nodes)) {
    const h = head.nodes[id]
    if (!h) {
      removed.push({ id, position: b, ...(base.nodeData[id] ? { data: base.nodeData[id] } : {}) })
      continue
    }
    if (b.x !== h.x || b.y !== h.y || b.size !== h.size) moved.push({ id, from: b, to: h })
    const fields = changedFields(base.nodeData[id] ?? {}, head.nodeData[id] ?? {})
    if (fields.length) changed.push({ id, fields })
  }

  return { added, removed, moved, changed }
}

function groupBy<K>(list: Connector[], keyOf: (c: Connector) => K | undefined): Map<K, Connector[]> {
  const map = new Map<K, Connector[]>()
  for (const c of list) {
    const key = keyOf(c)
    if (key === undefined) continue
    const bucket = map.get(key)
    if (bucket) bucket.push(c)
    else map.set(key, [c])
  }
  return map
}

/**
 * Connectors match by `id` when both carry one, else by `from→to`.
 * An id'd connector that finds no same-id counterpart still pair-matches
 * against an id-less connector — gaining or losing an `id` reads as
 * `changed`, not remove+add. Two connectors with different ids never pair.
 * Entries derived from a multi-candidate `from→to` bucket get `ambiguous`.
 */
function diffConnectors(base: Connector[] | undefined, head: Connector[] | undefined): DiagramDelta['connectors'] {
  const out: DiagramDelta['connectors'] = { added: [], removed: [], changed: [] }
  const baseList = base ?? []
  const headList = head ?? []

  const baseById = groupBy(baseList, c => c.id)
  const headById = groupBy(headList, c => c.id)
  const baseIdUsed = new Set<Connector>()
  const headUnmatched: Connector[] = []

  for (const h of headList) {
    if (!h.id) { headUnmatched.push(h); continue }
    const candidates = baseById.get(h.id) ?? []
    const b = candidates.find(c => !baseIdUsed.has(c))
    if (!b) { headUnmatched.push(h); continue }
    baseIdUsed.add(b)
    const ambiguous = candidates.length > 1 || (headById.get(h.id)?.length ?? 0) > 1
    const fields = changedFields(b, h)
    if (fields.length) out.changed.push({ key: h.id, before: b, after: h, fields, ...ambiguousFlag(ambiguous) })
  }
  const baseUnmatched = baseList.filter(c => !baseIdUsed.has(c))

  const basePairs = groupBy(baseUnmatched, c => `${c.from}->${c.to}`)
  const headPairs = groupBy(headUnmatched, c => `${c.from}->${c.to}`)

  for (const [key, heads] of headPairs) {
    const bases = basePairs.get(key) ?? []
    const ambiguous = bases.length > 1 || heads.length > 1
    const used = new Set<Connector>()
    for (const h of heads) {
      const b = bases.find(c => !used.has(c) && !(c.id && h.id))
      if (!b) { out.added.push({ connector: h, ...ambiguousFlag(ambiguous) }); continue }
      used.add(b)
      const fields = changedFields(b, h)
      if (fields.length) out.changed.push({ key: connectorKey(h), before: b, after: h, fields, ...ambiguousFlag(ambiguous) })
    }
    for (const b of bases) {
      if (!used.has(b)) out.removed.push({ connector: b, ...ambiguousFlag(ambiguous) })
    }
  }
  for (const [key, bases] of basePairs) {
    if (headPairs.has(key)) continue
    for (const b of bases) out.removed.push({ connector: b, ...ambiguousFlag(bases.length > 1) })
  }

  // Document order, like a text diff.
  const baseOrder = new Map(baseList.map((c, i) => [c, i]))
  const headOrder = new Map(headList.map((c, i) => [c, i]))
  out.removed.sort((a, b) => (baseOrder.get(a.connector) ?? 0) - (baseOrder.get(b.connector) ?? 0))
  out.added.sort((a, b) => (headOrder.get(a.connector) ?? 0) - (headOrder.get(b.connector) ?? 0))
  out.changed.sort((a, b) => (headOrder.get(a.after) ?? 0) - (headOrder.get(b.after) ?? 0))
  return out
}

function diffStyles(
  base: ArcDiagramData['connectorStyles'],
  head: ArcDiagramData['connectorStyles'],
): DiagramDelta['connectorStyles'] {
  const added: string[] = []
  const removed: string[] = []
  const changed: ChangedKeys[] = []
  for (const key of Object.keys(head)) {
    if (!(key in base)) added.push(key)
    else {
      const fields = changedFields(base[key], head[key])
      if (fields.length) changed.push({ key, fields })
    }
  }
  for (const key of Object.keys(base)) {
    if (!(key in head)) removed.push(key)
  }
  return { added, removed, changed }
}

function diffGroups(base: GroupShape[] | undefined, head: GroupShape[] | undefined): DiagramDelta['groups'] {
  const added: string[] = []
  const removed: string[] = []
  const changed: ChangedIds[] = []
  const baseById = new Map((base ?? []).map(g => [g.id, g]))
  const headIds = new Set<string>()
  for (const g of head ?? []) {
    headIds.add(g.id)
    const b = baseById.get(g.id)
    if (!b) added.push(g.id)
    else {
      const fields = changedFields(b, g)
      if (fields.length) changed.push({ id: g.id, fields })
    }
  }
  for (const g of base ?? []) {
    if (!headIds.has(g.id)) removed.push(g.id)
  }
  return { added, removed, changed }
}

/**
 * Diff two diagrams by node id, connector id/`from→to`, style key, and group id.
 * Positions compare exactly — a `moved` entry means `x`/`y`/`size` changed,
 * a `changed` entry means data fields changed; both can apply to one node.
 */
export function diffDiagram(base: ArcDiagramData, head: ArcDiagramData): DiagramDelta {
  return {
    nodes: diffNodes(base, head),
    connectors: diffConnectors(base.connectors, head.connectors),
    connectorStyles: diffStyles(base.connectorStyles, head.connectorStyles),
    groups: diffGroups(base.groups, head.groups),
    layoutChanged: base.layout.width !== head.layout.width || base.layout.height !== head.layout.height,
  }
}
