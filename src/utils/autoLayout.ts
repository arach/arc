// @ts-nocheck
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
  GroupShape,
  GroupLayoutHint,
  LayoutBoundary,
  NodeLayoutHint,
} from '../types/diagram'

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

const DEFAULT_GROUP_LAYOUT: Required<GroupLayoutHint> = {
  direction: 'vertical',
  padding: 20,
  layerGap: 28,
  itemGap: 24,
  align: 'center',
  justify: 'start',
}

type GroupFrame = GroupShape & Required<GroupLayoutHint>
type Axis = 'x' | 'y'

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

function boundaryTarget(boundary?: LayoutBoundary): number | null {
  if (boundary === 'start') return 0.18
  if (boundary === 'center') return 0.5
  if (boundary === 'end') return 0.82
  return null
}

function justifyStart(
  justify: GroupLayoutHint['justify'],
  start: number,
  span: number,
  contentSize: number,
) {
  if (justify === 'space-between') return start
  if (justify === 'center') return start + (span - contentSize) / 2
  if (justify === 'end') return start + span - contentSize
  return start
}

function justifyGap(
  justify: GroupLayoutHint['justify'],
  span: number,
  itemCount: number,
  contentWithoutGap: number,
  fallbackGap: number,
) {
  if (justify !== 'space-between' || itemCount <= 1) return fallbackGap
  return Math.max(fallbackGap, (span - contentWithoutGap) / (itemCount - 1))
}

function getNodeSize(node: NodePosition | undefined) {
  return NODE_SIZES[node?.size || 'm'] || NODE_SIZES.m
}

function getNodeCenter(node: NodePosition | undefined) {
  const size = getNodeSize(node)
  return {
    x: (node?.x || 0) + size.width / 2,
    y: (node?.y || 0) + size.height / 2,
  }
}

function resolveGroupFrame(group: GroupShape, hint?: GroupLayoutHint): GroupFrame {
  return {
    ...group,
    ...DEFAULT_GROUP_LAYOUT,
    ...hint,
  }
}

function getInnerBounds(group: GroupFrame) {
  const padding = Math.min(group.padding, Math.max(0, Math.min(group.width, group.height) / 3))
  return {
    x: group.x + padding,
    y: group.y + padding + (group.label ? 18 : 0),
    width: Math.max(0, group.width - padding * 2),
    height: Math.max(0, group.height - padding * 2 - (group.label ? 18 : 0)),
  }
}

function sortGroups(groups: GroupShape[]) {
  return [...groups].sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x
    return a.y - b.y
  })
}

function assignLayersWithHints(
  nodeIds: string[],
  connectors: Connector[],
  nodeHints: Record<string, NodeLayoutHint>,
): Map<string, number> {
  const base = assignLayers(nodeIds, connectors)
  for (const id of nodeIds) {
    const explicitLayer = nodeHints[id]?.layer
    if (explicitLayer != null) base.set(id, explicitLayer)
  }
  return base
}

function gatherNeighborWeights(
  nodeId: string,
  connectors: Connector[],
  nodeHints: Record<string, NodeLayoutHint>,
): Map<string, number> {
  const weights = new Map<string, number>()
  const addWeight = (otherId: string, weight: number) => {
    weights.set(otherId, (weights.get(otherId) || 0) + weight)
  }

  for (const connector of connectors) {
    if (connector.from === nodeId) addWeight(connector.to, 1)
    if (connector.to === nodeId) addWeight(connector.from, 1)
  }

  for (const [otherId, weight] of Object.entries(nodeHints[nodeId]?.affinity || {})) {
    addWeight(otherId, weight)
  }

  return weights
}

function projectToAxis(value: { x: number; y: number }, axis: Axis) {
  return axis === 'x' ? value.x : value.y
}

function normalizeAxisValue(value: number, start: number, span: number) {
  if (span <= 0) return 0.5
  return Math.max(0, Math.min(1, (value - start) / span))
}

function scoreNodeWithinLayer(
  nodeId: string,
  currentNodes: Record<string, NodePosition>,
  connectors: Connector[],
  nodeHints: Record<string, NodeLayoutHint>,
  group: GroupFrame,
  axis: Axis,
) {
  const inner = getInnerBounds(group)
  const axisStart = axis === 'x' ? inner.x : inner.y
  const axisSpan = axis === 'x' ? inner.width : inner.height
  const neighbors = gatherNeighborWeights(nodeId, connectors, nodeHints)
  const hint = nodeHints[nodeId]

  let weighted = normalizeAxisValue(projectToAxis(getNodeCenter(currentNodes[nodeId]), axis), axisStart, axisSpan)
  let totalWeight = 1

  const boundary = boundaryTarget(hint?.boundary)
  if (boundary != null) {
    weighted += boundary * 3
    totalWeight += 3
  }

  for (const [otherId, weight] of neighbors) {
    const otherCenter = getNodeCenter(currentNodes[otherId])
    weighted += normalizeAxisValue(projectToAxis(otherCenter, axis), axisStart, axisSpan) * weight
    totalWeight += weight
  }

  const average = weighted / totalWeight
  const orderBias = (hint?.order ?? 0) * 0.0001
  return average + orderBias
}

function layoutGroupNodes(
  group: GroupFrame,
  memberIds: string[],
  currentNodes: Record<string, NodePosition>,
  data: ArcDiagramData,
  nodeHints: Record<string, NodeLayoutHint>,
): Record<string, NodePosition> {
  if (memberIds.length === 0) return {}

  const internalConnectors = data.connectors.filter(
    (connector) => memberIds.includes(connector.from) && memberIds.includes(connector.to),
  )

  const layerMap = assignLayersWithHints(memberIds, internalConnectors, nodeHints)
  const layers = new Map<number, string[]>()
  for (const id of memberIds) {
    const layer = layerMap.get(id) || 0
    if (!layers.has(layer)) layers.set(layer, [])
    layers.get(layer)!.push(id)
  }

  const orderedLayers = orderWithinLayers(layers, internalConnectors)
  const inner = getInnerBounds(group)
  const nextNodes: Record<string, NodePosition> = {}

  if (group.direction === 'vertical') {
    const layerIds = [...orderedLayers.keys()].sort((a, b) => a - b)
    const layerRows = layerIds.map((layerId) => {
      const ids = [...(orderedLayers.get(layerId) || [])].sort((a, b) => {
        return scoreNodeWithinLayer(a, currentNodes, data.connectors, nodeHints, group, 'x')
          - scoreNodeWithinLayer(b, currentNodes, data.connectors, nodeHints, group, 'x')
      })
      const rowHeight = Math.max(...ids.map((id) => getNodeSize(currentNodes[id]).height))
      const rowWidth = ids.reduce((sum, id, index) => {
        return sum + getNodeSize(currentNodes[id]).width + (index > 0 ? group.itemGap : 0)
      }, 0)
      return { ids, rowHeight, rowWidth }
    })
    const contentHeightNoGap = layerRows.reduce((sum, row) => sum + row.rowHeight, 0)
    const layerGap = justifyGap(group.justify, inner.height, layerRows.length, contentHeightNoGap, group.layerGap)
    const contentHeight = layerRows.reduce((sum, row, index) => {
      return sum + row.rowHeight + (index > 0 ? layerGap : 0)
    }, 0)
    let y = justifyStart(group.justify, inner.y, inner.height, contentHeight)
    for (const row of layerRows) {
      const { ids, rowHeight, rowWidth } = row
      const startX = group.align === 'start'
        ? inner.x
        : group.align === 'end'
          ? inner.x + inner.width - rowWidth
          : inner.x + (inner.width - rowWidth) / 2
      let x = startX
      for (const id of ids) {
        const size = getNodeSize(currentNodes[id])
        nextNodes[id] = {
          x: Math.round(x),
          y: Math.round(y + (rowHeight - size.height) / 2),
          size: currentNodes[id]?.size || 'm',
        }
        x += size.width + group.itemGap
      }
      y += rowHeight + layerGap
    }
  } else {
    const layerIds = [...orderedLayers.keys()].sort((a, b) => a - b)
    const columns = layerIds.map((layerId) => {
      const ids = [...(orderedLayers.get(layerId) || [])].sort((a, b) => {
        return scoreNodeWithinLayer(a, currentNodes, data.connectors, nodeHints, group, 'y')
          - scoreNodeWithinLayer(b, currentNodes, data.connectors, nodeHints, group, 'y')
      })
      const columnWidth = Math.max(...ids.map((id) => getNodeSize(currentNodes[id]).width))
      const columnHeight = ids.reduce((sum, id, index) => {
        return sum + getNodeSize(currentNodes[id]).height + (index > 0 ? group.itemGap : 0)
      }, 0)
      return { ids, columnWidth, columnHeight }
    })
    const contentWidthNoGap = columns.reduce((sum, column) => sum + column.columnWidth, 0)
    const layerGap = justifyGap(group.justify, inner.width, columns.length, contentWidthNoGap, group.layerGap)
    const contentWidth = columns.reduce((sum, column, index) => {
      return sum + column.columnWidth + (index > 0 ? layerGap : 0)
    }, 0)
    let x = justifyStart(group.justify, inner.x, inner.width, contentWidth)
    for (const column of columns) {
      const { ids, columnWidth, columnHeight } = column
      const startY = group.align === 'start'
        ? inner.y
        : group.align === 'end'
          ? inner.y + inner.height - columnHeight
          : inner.y + (inner.height - columnHeight) / 2
      let y = startY
      for (const id of ids) {
        const size = getNodeSize(currentNodes[id])
        nextNodes[id] = {
          x: Math.round(x + (columnWidth - size.width) / 2),
          y: Math.round(y),
          size: currentNodes[id]?.size || 'm',
        }
        y += size.height + group.itemGap
      }
      x += columnWidth + layerGap
    }
  }

  return nextNodes
}

function autoLayoutWithGroups(
  data: ArcDiagramData,
): ArcDiagramData {
  const groups = sortGroups(data.groups || [])
  const nodeHints = data.layoutHints?.nodes || {}
  const groupHints = data.layoutHints?.groups || {}
  const groupedNodeIds = new Set(
    Object.entries(nodeHints)
      .filter(([, hint]) => hint.group)
      .map(([id]) => id),
  )

  if (groups.length === 0 || groupedNodeIds.size === 0) return data

  const groupMembers = new Map<string, string[]>()
  for (const group of groups) groupMembers.set(group.id, [])
  for (const nodeId of Object.keys(data.nodes)) {
    const groupId = nodeHints[nodeId]?.group
    if (groupId && groupMembers.has(groupId)) {
      groupMembers.get(groupId)!.push(nodeId)
    }
  }

  let currentNodes = { ...data.nodes }
  for (let pass = 0; pass < 3; pass++) {
    for (const groupShape of groups) {
      const frame = resolveGroupFrame(groupShape, groupHints[groupShape.id])
      const members = groupMembers.get(groupShape.id) || []
      currentNodes = {
        ...currentNodes,
        ...layoutGroupNodes(frame, members, currentNodes, data, nodeHints),
      }
    }
  }

  const newConnectors: Connector[] = data.connectors.map((connector) => {
    const fromNode = currentNodes[connector.from]
    const toNode = currentNodes[connector.to]
    if (!fromNode || !toNode) return connector
    const { fromAnchor, toAnchor } = inferAnchors(fromNode, toNode)
    return { ...connector, fromAnchor, toAnchor }
  })

  return {
    ...data,
    nodes: currentNodes,
    connectors: newConnectors,
  }
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
  if (data.groups?.length && data.layoutHints?.nodes && Object.keys(data.layoutHints.nodes).length > 0) {
    return autoLayoutWithGroups(data)
  }

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
