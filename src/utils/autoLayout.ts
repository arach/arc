/**
 * Auto-layout engine for Arc diagrams
 *
 * Layered DAG layout (Sugiyama) with grid-wrapping:
 * when the natural LR layout exceeds the target width,
 * layers wrap into rows — LR within each row, TB between rows.
 * This uses the full 2D canvas instead of a single axis.
 */

import type { ArcDiagramData, NodePosition, AnchorPosition, Connector } from '../types/diagram'

// Node sizes matching the viewer
const NODE_SIZES: Record<string, { width: number; height: number }> = {
  l: { width: 220, height: 90 },
  m: { width: 160, height: 75 },
  s: { width: 110, height: 48 },
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
    nodes,
    nodeData: input.nodeData,
    connectors,
    connectorStyles: input.connectorStyles,
  }

  return autoLayout(data, input.layout)
}
