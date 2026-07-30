/**
 * Auto-layout engine for Arc diagrams
 *
 * Layered DAG layout (Sugiyama) with grid-wrapping:
 * when the natural LR layout exceeds the target width,
 * layers wrap into rows — LR within each row, TB between rows.
 * This uses the full 2D canvas instead of a single axis.
 */

import type {
  ArcDiagramData,
  NodePosition,
  AnchorPosition,
  Connector,
  GroupLayoutHint,
  GroupShape,
  LayoutAlignment,
  NodeLayoutHint,
} from '../types/diagram'

// Node sizes matching the viewer
const NODE_SIZES: Record<string, { width: number; height: number }> = {
  l: { width: 220, height: 90 },
  m: { width: 160, height: 75 },
  s: { width: 110, height: 48 },
  xs: { width: 80, height: 36 },
}

export interface LayoutOptions {
  /** Horizontal gap between columns */
  columnGap?: number
  /** Vertical gap between nodes within a column */
  nodeGap?: number
  /** Vertical gap between wrapped rows */
  rowGap?: number
  /** Padding around the entire diagram */
  padding?: number
}

const DEFAULTS: Required<LayoutOptions> = {
  columnGap: 40,
  nodeGap: 24,
  rowGap: 40,
  padding: 32,
}

const DEFAULT_GROUP_LAYOUT: Required<GroupLayoutHint> = {
  direction: 'horizontal',
  padding: 20,
  layerGap: 28,
  itemGap: 18,
  align: 'center',
  justify: 'center',
}

/**
 * Assign each node to a layer using longest-path layering (Kahn's algorithm).
 */
function assignLayers(nodeIds: string[], connectors: Connector[]): Map<string, number> {
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()
  for (const id of nodeIds) {
    outgoing.set(id, [])
    incoming.set(id, [])
  }
  for (const c of connectors) {
    if (outgoing.has(c.from) && incoming.has(c.to)) {
      outgoing.get(c.from)!.push(c.to)
      incoming.get(c.to)!.push(c.from)
    }
  }

  const roots = nodeIds.filter(id => incoming.get(id)!.length === 0)
  if (roots.length === 0) roots.push(nodeIds[0])

  const layer = new Map<string, number>()
  for (const id of nodeIds) layer.set(id, 0)
  const visited = new Set<string>()

  const inDegree = new Map<string, number>()
  for (const id of nodeIds) inDegree.set(id, incoming.get(id)!.length)

  const queue = roots.filter(r => inDegree.get(r) === 0)
  if (queue.length === 0) queue.push(nodeIds[0])

  while (queue.length > 0) {
    const node = queue.shift()!
    if (visited.has(node)) continue
    visited.add(node)
    for (const next of outgoing.get(node) || []) {
      const newLayer = layer.get(node)! + 1
      if (newLayer > layer.get(next)!) layer.set(next, newLayer)
      const deg = inDegree.get(next)! - 1
      inDegree.set(next, deg)
      if (deg <= 0) queue.push(next)
    }
  }

  for (const id of nodeIds) {
    if (!visited.has(id)) layer.set(id, 0)
  }
  return layer
}

/**
 * Order nodes within each layer to minimize edge crossings (barycenter heuristic).
 */
function orderWithinLayers(
  layers: Map<number, string[]>,
  connectors: Connector[],
): Map<number, string[]> {
  const layerCount = Math.max(...layers.keys()) + 1
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()
  for (const [, nodes] of layers) {
    for (const id of nodes) {
      outgoing.set(id, [])
      incoming.set(id, [])
    }
  }
  for (const c of connectors) {
    outgoing.get(c.from)?.push(c.to)
    incoming.get(c.to)?.push(c.from)
  }

  const position = new Map<string, number>()
  for (const [, nodes] of layers) {
    nodes.forEach((id, idx) => position.set(id, idx))
  }

  for (let sweep = 0; sweep < 4; sweep++) {
    for (let l = 1; l < layerCount; l++) {
      const nodes = layers.get(l) || []
      const indexed = nodes.map(id => {
        const preds = incoming.get(id) || []
        const bc = preds.length === 0
          ? position.get(id) || 0
          : preds.reduce((s, p) => s + (position.get(p) || 0), 0) / preds.length
        return { id, bc }
      })
      indexed.sort((a, b) => a.bc - b.bc)
      const sorted = indexed.map(x => x.id)
      layers.set(l, sorted)
      sorted.forEach((id, idx) => position.set(id, idx))
    }
    for (let l = layerCount - 2; l >= 0; l--) {
      const nodes = layers.get(l) || []
      const indexed = nodes.map(id => {
        const succs = outgoing.get(id) || []
        const bc = succs.length === 0
          ? position.get(id) || 0
          : succs.reduce((s, p) => s + (position.get(p) || 0), 0) / succs.length
        return { id, bc }
      })
      indexed.sort((a, b) => a.bc - b.bc)
      const sorted = indexed.map(x => x.id)
      layers.set(l, sorted)
      sorted.forEach((id, idx) => position.set(id, idx))
    }
  }
  return layers
}

/**
 * Determine the best anchor pair based on relative node positions.
 */
function inferAnchors(
  fromNode: NodePosition,
  toNode: NodePosition,
): { fromAnchor: AnchorPosition; toAnchor: AnchorPosition } {
  const fromSize = NODE_SIZES[fromNode.size] || NODE_SIZES.m
  const toSize = NODE_SIZES[toNode.size] || NODE_SIZES.m
  const fromCx = fromNode.x + fromSize.width / 2
  const fromCy = fromNode.y + fromSize.height / 2
  const toCx = toNode.x + toSize.width / 2
  const toCy = toNode.y + toSize.height / 2
  const dx = toCx - fromCx
  const dy = toCy - fromCy

  if (Math.abs(dx) > Math.abs(dy) * 0.5) {
    if (dx > 0) {
      if (Math.abs(dy) < fromSize.height * 0.3) return { fromAnchor: 'right', toAnchor: 'left' }
      return dy > 0
        ? { fromAnchor: 'bottomRight', toAnchor: 'left' }
        : { fromAnchor: 'topRight', toAnchor: 'left' }
    } else {
      if (Math.abs(dy) < fromSize.height * 0.3) return { fromAnchor: 'left', toAnchor: 'right' }
      return dy > 0
        ? { fromAnchor: 'bottomLeft', toAnchor: 'right' }
        : { fromAnchor: 'topLeft', toAnchor: 'right' }
    }
  }

  return dy > 0
    ? { fromAnchor: 'bottom', toAnchor: 'top' }
    : { fromAnchor: 'top', toAnchor: 'bottom' }
}

/**
 * Determine how many layers fit in one row given the target width.
 */
function fitLayersPerRow(
  columnWidths: number[],
  targetW: number,
  padding: number,
  columnGap: number,
): number {
  const available = targetW - 2 * padding
  let width = 0
  for (let i = 0; i < columnWidths.length; i++) {
    const added = columnWidths[i] + (i > 0 ? columnGap : 0)
    if (width + added > available && i > 0) return i
    width += added
  }
  return columnWidths.length
}

function getNodeSize(node: NodePosition | undefined) {
  return NODE_SIZES[node?.size || 'm'] || NODE_SIZES.m
}

function alignedStart(
  alignment: LayoutAlignment,
  start: number,
  available: number,
  content: number,
) {
  if (alignment === 'end') return start + available - content
  if (alignment === 'center') return start + (available - content) / 2
  return start
}

function mainAxisPlacement(
  justify: Required<GroupLayoutHint>['justify'],
  start: number,
  available: number,
  itemSizes: number[],
  fallbackGap: number,
) {
  const totalItems = itemSizes.reduce((sum, size) => sum + size, 0)
  const fallbackContent = totalItems + fallbackGap * Math.max(0, itemSizes.length - 1)

  if (justify === 'space-between' && itemSizes.length > 1) {
    return {
      start,
      gap: Math.max(fallbackGap, (available - totalItems) / (itemSizes.length - 1)),
    }
  }

  const alignment: LayoutAlignment = justify === 'space-between' ? 'start' : justify

  return {
    start: alignedStart(alignment, start, available, fallbackContent),
    gap: fallbackGap,
  }
}

function resolveGroupLayout(group: GroupShape, hint?: GroupLayoutHint) {
  const resolved = { ...DEFAULT_GROUP_LAYOUT, ...hint }
  const padding = Math.max(0, resolved.padding)
  const labelOffset = group.label ? 22 : 0

  return {
    ...resolved,
    padding,
    layerGap: Math.max(0, resolved.layerGap),
    itemGap: Math.max(0, resolved.itemGap),
    inner: {
      x: group.x + padding,
      y: group.y + padding + labelOffset,
      width: Math.max(0, group.width - padding * 2),
      height: Math.max(0, group.height - padding * 2 - labelOffset),
    },
  }
}

function orderLayer(ids: string[], hints: Record<string, NodeLayoutHint>) {
  return [...ids].sort((a, b) => {
    const orderA = hints[a]?.order ?? Number.MAX_SAFE_INTEGER
    const orderB = hints[b]?.order ?? Number.MAX_SAFE_INTEGER
    return orderA - orderB || a.localeCompare(b)
  })
}

function layoutGroupNodes(
  data: ArcDiagramData,
  group: GroupShape,
  memberIds: string[],
  nodeHints: Record<string, NodeLayoutHint>,
  groupHint?: GroupLayoutHint,
) {
  const internalConnectors = data.connectors.filter(
    connector => memberIds.includes(connector.from) && memberIds.includes(connector.to),
  )
  const layerMap = assignLayers(memberIds, internalConnectors)
  for (const id of memberIds) {
    const explicitLayer = nodeHints[id]?.layer
    if (explicitLayer != null && Number.isFinite(explicitLayer)) {
      layerMap.set(id, Math.max(0, Math.floor(explicitLayer)))
    }
  }

  const layers = new Map<number, string[]>()
  for (const id of memberIds) {
    const layer = layerMap.get(id) || 0
    layers.set(layer, [...(layers.get(layer) || []), id])
  }

  const layerIds = [...layers.keys()].sort((a, b) => a - b)
  const orderedLayers = layerIds.map(layer => orderLayer(layers.get(layer) || [], nodeHints))
  const layout = resolveGroupLayout(group, groupHint)
  const nextNodes: Record<string, NodePosition> = {}

  if (layout.direction === 'horizontal') {
    const columns = orderedLayers.map(ids => ({
      ids,
      width: Math.max(...ids.map(id => getNodeSize(data.nodes[id]).width)),
      height: ids.reduce(
        (sum, id, index) => sum + getNodeSize(data.nodes[id]).height + (index ? layout.itemGap : 0),
        0,
      ),
    }))
    const placement = mainAxisPlacement(
      layout.justify,
      layout.inner.x,
      layout.inner.width,
      columns.map(column => column.width),
      layout.layerGap,
    )
    let x = placement.start
    for (const column of columns) {
      let y = alignedStart(layout.align, layout.inner.y, layout.inner.height, column.height)
      for (const id of column.ids) {
        const size = getNodeSize(data.nodes[id])
        nextNodes[id] = {
          x: Math.round(x + (column.width - size.width) / 2),
          y: Math.round(y),
          size: data.nodes[id]?.size || 'm',
        }
        y += size.height + layout.itemGap
      }
      x += column.width + placement.gap
    }
  } else {
    const rows = orderedLayers.map(ids => ({
      ids,
      width: ids.reduce(
        (sum, id, index) => sum + getNodeSize(data.nodes[id]).width + (index ? layout.itemGap : 0),
        0,
      ),
      height: Math.max(...ids.map(id => getNodeSize(data.nodes[id]).height)),
    }))
    const placement = mainAxisPlacement(
      layout.justify,
      layout.inner.y,
      layout.inner.height,
      rows.map(row => row.height),
      layout.layerGap,
    )
    let y = placement.start
    for (const row of rows) {
      let x = alignedStart(layout.align, layout.inner.x, layout.inner.width, row.width)
      for (const id of row.ids) {
        const size = getNodeSize(data.nodes[id])
        nextNodes[id] = {
          x: Math.round(x),
          y: Math.round(y + (row.height - size.height) / 2),
          size: data.nodes[id]?.size || 'm',
        }
        x += size.width + layout.itemGap
      }
      y += row.height + placement.gap
    }
  }

  return nextNodes
}

function autoLayoutGroups(data: ArcDiagramData): ArcDiagramData | null {
  const groups = data.groups || []
  const nodeHints = data.layoutHints?.nodes || {}
  const groupHints = data.layoutHints?.groups || {}
  const knownGroups = new Set(groups.map(group => group.id))
  const members = new Map(groups.map(group => [group.id, [] as string[]]))

  for (const nodeId of Object.keys(data.nodes)) {
    const groupId = nodeHints[nodeId]?.group
    if (groupId && knownGroups.has(groupId)) members.get(groupId)!.push(nodeId)
  }

  if (![...members.values()].some(ids => ids.length > 0)) return null

  let nodes = { ...data.nodes }
  for (const group of groups) {
    const memberIds = members.get(group.id) || []
    if (memberIds.length === 0) continue
    nodes = {
      ...nodes,
      ...layoutGroupNodes({ ...data, nodes }, group, memberIds, nodeHints, groupHints[group.id]),
    }
  }

  const connectors = data.connectors.map(connector => {
    const fromNode = nodes[connector.from]
    const toNode = nodes[connector.to]
    if (!fromNode || !toNode) return connector
    return { ...connector, ...inferAnchors(fromNode, toNode) }
  })

  return { ...data, nodes, connectors }
}

/**
 * Auto-layout an ArcDiagramData.
 *
 * Uses LR flow within rows. When layers exceed the target width,
 * wraps into multiple rows — combining LR and TB to maximize
 * use of the available 2D space.
 */
export function autoLayout(
  data: ArcDiagramData,
  options: LayoutOptions = {},
): ArcDiagramData {
  const grouped = autoLayoutGroups(data)
  if (grouped) return grouped

  const opts = { ...DEFAULTS, ...options }
  const nodeIds = Object.keys(data.nodes)

  if (nodeIds.length === 0) return data

  const targetW = data.layout.width
  const targetH = data.layout.height

  // Step 1: Layer assignment and ordering
  const layerMap = assignLayers(nodeIds, data.connectors)
  const layers = new Map<number, string[]>()
  for (const [id, layer] of layerMap) {
    if (!layers.has(layer)) layers.set(layer, [])
    layers.get(layer)!.push(id)
  }
  const orderedLayers = orderWithinLayers(layers, data.connectors)

  const layerCount = Math.max(...orderedLayers.keys()) + 1
  const columnWidths: number[] = []
  const columnNodes: string[][] = []

  for (let l = 0; l < layerCount; l++) {
    const nodes = orderedLayers.get(l) || []
    columnNodes.push(nodes)
    let maxWidth = 0
    for (const id of nodes) {
      const size = NODE_SIZES[data.nodes[id]?.size || 'm'] || NODE_SIZES.m
      maxWidth = Math.max(maxWidth, size.width)
    }
    columnWidths.push(maxWidth)
  }

  // Step 2: Determine how many layers fit per row
  const layersPerRow = fitLayersPerRow(columnWidths, targetW, opts.padding, opts.columnGap)
  const numRows = Math.ceil(layerCount / layersPerRow)

  // Step 3: Split layers into row groups
  const rowGroups: number[][] = [] // each group is array of layer indices
  for (let r = 0; r < numRows; r++) {
    const start = r * layersPerRow
    const end = Math.min(start + layersPerRow, layerCount)
    const group: number[] = []
    for (let l = start; l < end; l++) group.push(l)
    rowGroups.push(group)
  }

  // Step 4: Calculate column gaps per row (distribute remaining space)
  const newNodes: Record<string, NodePosition> = {}
  let yOffset = opts.padding

  for (let r = 0; r < rowGroups.length; r++) {
    const group = rowGroups[r]

    // Width of nodes in this row — use consistent gap, don't stretch
    const colGap = opts.columnGap

    // Height of the tallest column in this row
    let rowMaxHeight = 0
    for (const l of group) {
      const nodes = columnNodes[l]
      let colH = 0
      for (const id of nodes) {
        const size = NODE_SIZES[data.nodes[id]?.size || 'm'] || NODE_SIZES.m
        colH += size.height
      }
      colH += Math.max(0, nodes.length - 1) * opts.nodeGap
      rowMaxHeight = Math.max(rowMaxHeight, colH)
    }

    // Position columns in this row
    let x = opts.padding
    for (const l of group) {
      const nodes = columnNodes[l]

      // Column height for vertical centering
      let colH = 0
      for (const id of nodes) {
        const size = NODE_SIZES[data.nodes[id]?.size || 'm'] || NODE_SIZES.m
        colH += size.height
      }
      colH += Math.max(0, nodes.length - 1) * opts.nodeGap

      let y = yOffset + (rowMaxHeight - colH) / 2

      for (const id of nodes) {
        const origNode = data.nodes[id]
        const size = NODE_SIZES[origNode?.size || 'm'] || NODE_SIZES.m
        const nodeX = x + (columnWidths[l] - size.width) / 2

        newNodes[id] = { x: nodeX, y, size: origNode?.size || 'm' }
        y += size.height + opts.nodeGap
      }

      x += columnWidths[l] + colGap
    }

    yOffset += rowMaxHeight + opts.rowGap
  }

  // Step 5: Infer connector anchors
  const newConnectors: Connector[] = data.connectors.map(c => {
    const fromNode = newNodes[c.from]
    const toNode = newNodes[c.to]
    if (!fromNode || !toNode) return c
    const { fromAnchor, toAnchor } = inferAnchors(fromNode, toNode)
    return { ...c, fromAnchor, toAnchor }
  })

  // Step 6: Calculate final dimensions
  let maxX = 0
  let maxY = 0
  for (const node of Object.values(newNodes)) {
    const size = NODE_SIZES[node.size] || NODE_SIZES.m
    maxX = Math.max(maxX, node.x + size.width)
    maxY = Math.max(maxY, node.y + size.height)
  }

  return {
    ...data,
    layout: {
      width: Math.max(targetW, maxX + opts.padding),
      height: Math.max(targetH, maxY + opts.padding),
    },
    nodes: newNodes,
    connectors: newConnectors,
  }
}

/**
 * Generate a diagram from minimal input — no positions or anchors needed.
 */
export interface AutoDiagramInput {
  layoutHints?: ArcDiagramData['layoutHints']
  groups?: ArcDiagramData['groups']
  nodeData: ArcDiagramData['nodeData']
  connectors: Array<Omit<Connector, 'fromAnchor' | 'toAnchor'> & {
    fromAnchor?: AnchorPosition
    toAnchor?: AnchorPosition
  }>
  connectorStyles: ArcDiagramData['connectorStyles']
  layout?: LayoutOptions
}

export function createAutoLayout(input: AutoDiagramInput): ArcDiagramData {
  const nodes: Record<string, NodePosition> = {}
  for (const id of Object.keys(input.nodeData)) {
    nodes[id] = { x: 0, y: 0, size: 'm' }
  }

  const connectors: Connector[] = input.connectors.map(c => ({
    from: c.from,
    to: c.to,
    fromAnchor: c.fromAnchor || 'right',
    toAnchor: c.toAnchor || 'left',
    style: c.style,
    ...(c.curve ? { curve: c.curve } : {}),
  }))

  const data: ArcDiagramData = {
    layout: { width: 800, height: 400 },
    ...(input.layoutHints ? { layoutHints: input.layoutHints } : {}),
    nodes,
    nodeData: input.nodeData,
    connectors,
    connectorStyles: input.connectorStyles,
    ...(input.groups ? { groups: input.groups } : {}),
  }

  return autoLayout(data, input.layout)
}
