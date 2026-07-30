/**
 * Mermaid → ArcDiagramData import bridge
 *
 * Converts raw Mermaid source into Arc diagram data.
 * v1 scope: flowchart, sequenceDiagram, stateDiagram-v2
 */

import type {
  ArcDiagramData,
  NodePosition,
  NodeData,
  Connector,
  ConnectorStyle,
  DiagramColor,
  NodeSize,
} from './ArcDiagram'
import { autoLayout } from './autoLayout'

// ============================================
// Public API
// ============================================

export interface MermaidImportResult {
  /** The converted Arc diagram data, auto-laid-out */
  diagram: ArcDiagramData
  /** Non-fatal issues encountered during parsing */
  warnings: string[]
  /** Mermaid features that were skipped */
  unsupported: string[]
}

export interface MermaidImportOptions {
  /** Default node size. Default: 'm' */
  defaultSize?: NodeSize
  /** Target layout width. Default: 800 */
  width?: number
  /** Target layout height. Default: 400 */
  height?: number
}

/**
 * Import raw Mermaid source into ArcDiagramData.
 *
 * Supported diagram types: flowchart, sequenceDiagram, stateDiagram-v2
 */
export function importMermaid(
  source: string,
  options: MermaidImportOptions = {},
): MermaidImportResult {
  const normalized = source.replace(/\r\n?/g, '\n')
  const sourceLines = normalized.split('\n')
  const declarationIndex = sourceLines.findIndex((line) => {
    const trimmed = line.trim()
    return trimmed.length > 0 && !trimmed.startsWith('%%')
  })

  if (declarationIndex === -1) {
    return {
      diagram: emptyDiagram(options),
      warnings: ['Mermaid source does not contain a diagram declaration'],
      unsupported: [],
    }
  }

  const trimmed = sourceLines.slice(declarationIndex).join('\n').trim()
  const firstLine = trimmed.split('\n')[0].trim()

  if (/^flowchart\b/i.test(firstLine) || /^graph\b/i.test(firstLine)) {
    return parseFlowchart(trimmed, options)
  }
  if (/^sequenceDiagram/i.test(firstLine)) {
    return parseSequenceDiagram(trimmed, options)
  }
  if (/^stateDiagram-v2/i.test(firstLine) || /^stateDiagram\b/i.test(firstLine)) {
    return parseStateDiagram(trimmed, options)
  }

  return {
    diagram: emptyDiagram(options),
    warnings: [`Unrecognized diagram type: "${firstLine}"`],
    unsupported: [firstLine.split(/\s/)[0]],
  }
}

// ============================================
// Color palette for auto-assignment
// ============================================

const COLORS: DiagramColor[] = ['violet', 'emerald', 'blue', 'amber', 'sky', 'zinc', 'rose', 'orange']

function colorForIndex(i: number): DiagramColor {
  return COLORS[i % COLORS.length]
}

// ============================================
// Icon guessing from labels
// ============================================

const ICON_HINTS: Array<[RegExp, string]> = [
  [/database|db|store|storage|persist/i, 'Database'],
  [/server|backend|api|endpoint/i, 'Server'],
  [/user|client|surface|browser/i, 'Monitor'],
  [/queue|message|event|stream/i, 'Mail'],
  [/file|document|artifact/i, 'FileText'],
  [/network|route|delivery|bridge/i, 'Network'],
  [/lock|auth|security/i, 'Lock'],
  [/cloud|deploy|host/i, 'Cloud'],
  [/error|fail|crash|recover/i, 'AlertTriangle'],
  [/check|health|pass|success/i, 'CheckCircle'],
  [/start|init|install|begin/i, 'Play'],
  [/stop|end|complete|done/i, 'Square'],
  [/state|status|phase/i, 'Activity'],
  [/agent|bot|worker/i, 'Bot'],
  [/conversation|chat|thread/i, 'MessageSquare'],
  [/flight|invocation|run/i, 'Zap'],
  [/bind|map|link/i, 'Link'],
]

function guessIcon(label: string): string {
  for (const [pattern, icon] of ICON_HINTS) {
    if (pattern.test(label)) return icon
  }
  return 'Box'
}

// ============================================
// Helpers
// ============================================

function emptyDiagram(options: MermaidImportOptions = {}): ArcDiagramData {
  return {
    layout: { width: options.width ?? 800, height: options.height ?? 400 },
    nodes: {},
    nodeData: {},
    connectors: [],
    connectorStyles: {},
  }
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_')
}

/** Extract label from Mermaid node definitions like ID["Label"] or ID("Label") or ID[Label] */
function extractLabel(raw: string): { id: string; label: string } {
  // Match ID["Label"], ID['Label'], ID("Label"), ID('Label')
  const quoted = raw.match(/^([a-zA-Z0-9_-]+)\s*[\[("]+\s*"?'?([^"'\])]+)'?"?\s*[\])"]+$/)
  if (quoted) return { id: quoted[1], label: quoted[2].trim() }

  // Match ID[Label] or ID(Label) without quotes
  const bracketed = raw.match(/^([a-zA-Z0-9_-]+)\s*[\[(]([^\])]+)[\])]$/)
  if (bracketed) return { id: bracketed[1], label: bracketed[2].trim() }

  // Plain ID
  const plain = raw.trim()
  return { id: plain, label: plain }
}

function isExplicitNodeDefinition(raw: string): boolean {
  return /^[a-zA-Z0-9_-]+\s*[\[(].*[\])]$/.test(raw.trim())
}

function splitNodeLabel(label: string): Pick<NodeData, 'name' | 'subtitle' | 'description'> {
  const parts = label
    .split(/<br\s*\/?\s*>/gi)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 0) return { name: label }

  return {
    name: parts[0],
    ...(parts[1] ? { subtitle: parts[1] } : {}),
    ...(parts.length > 2 ? { description: parts.slice(2).join(' · ') } : {}),
  }
}

// ============================================
// Flowchart Parser
// ============================================

interface ParsedEdge {
  from: string
  to: string
  label?: string
  dashed: boolean
}

function parseFlowchart(
  source: string,
  options: MermaidImportOptions,
): MermaidImportResult {
  const warnings: string[] = []
  const unsupported: string[] = []
  const lines = source.split('\n')
  const nodeLabels = new Map<string, string>()
  const edges: ParsedEdge[] = []
  const size = options.defaultSize ?? 'm'

  // Skip first line (flowchart TD / graph LR etc.)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('%%')) continue

    // Skip subgraph/end
    if (/^subgraph\b/i.test(line)) {
      unsupported.push('subgraph')
      continue
    }
    if (/^end$/i.test(line)) continue
    if (/^direction\b/i.test(line)) {
      unsupported.push('direction directives')
      continue
    }
    if (/^classDef\b/i.test(line) || /^class\b/i.test(line) || /^style\b/i.test(line)) {
      unsupported.push('styling directives')
      continue
    }
    if (/^click\b/i.test(line) || /^linkStyle\b/i.test(line)) {
      unsupported.push('click/linkStyle')
      continue
    }

    // Parse edges: A -->|label| B, A --> B, A -.text.-> B, A -. text .-> B
    // Can have node definitions inline: A["Foo"] --> B["Bar"]
    const edgePatterns = [
      // Dotted with label: A -. text .-> B or A -.text.-> B
      /^(.+?)\s+-\.+\s*(.*?)\s*\.+->\s*(.+)$/,
      // Solid with label: A -->|text| B or A -- text --> B
      /^(.+?)\s+-->?\|([^|]*)\|\s*(.+)$/,
      /^(.+?)\s+--\s+([^-]+?)\s+-->\s*(.+)$/,
      // Plain solid: A --> B
      /^(.+?)\s+-->\s*(.+)$/,
      // Plain dotted: A -.-> B
      /^(.+?)\s+-\.+->\s*(.+)$/,
    ]

    let matched = false
    for (const pattern of edgePatterns) {
      const m = line.match(pattern)
      if (!m) continue
      matched = true

      let fromRaw: string, toRaw: string, edgeLabel: string | undefined
      const isDashed = pattern.source.includes('-\\.')

      if (m.length === 4) {
        fromRaw = m[1].trim()
        edgeLabel = m[2].trim() || undefined
        toRaw = m[3].trim()
      } else {
        fromRaw = m[1].trim()
        toRaw = m[2].trim()
      }

      const from = extractLabel(fromRaw)
      const to = extractLabel(toRaw)
      if (from.label !== from.id) nodeLabels.set(from.id, from.label)
      if (to.label !== to.id) nodeLabels.set(to.id, to.label)

      edges.push({
        from: sanitizeId(from.id),
        to: sanitizeId(to.id),
        label: edgeLabel,
        dashed: isDashed,
      })
      break
    }

    if (!matched) {
      // Might be a standalone node definition: ID["Label"]
      const nodeDef = extractLabel(line)
      if (nodeDef.id && isExplicitNodeDefinition(line)) {
        nodeLabels.set(nodeDef.id, nodeDef.label)
        matched = true
      }
    }

    if (!matched && line.length > 0) {
      warnings.push(`Skipped unrecognized line: "${line.substring(0, 60)}"`)
    }
  }

  // Collect all node IDs
  const allIds = new Set<string>()
  for (const e of edges) { allIds.add(e.from); allIds.add(e.to) }
  for (const id of nodeLabels.keys()) allIds.add(sanitizeId(id))

  const nodeIds = [...allIds]
  if (nodeIds.length === 0) {
    return { diagram: emptyDiagram(options), warnings, unsupported: [...new Set(unsupported)] }
  }

  // Build nodes
  const nodes: Record<string, NodePosition> = {}
  const nodeData: Record<string, NodeData> = {}
  nodeIds.forEach((id, i) => {
    nodes[id] = { x: 0, y: 0, size }
    const label = nodeLabels.get(id) ?? id
    nodeData[id] = {
      icon: guessIcon(label),
      ...splitNodeLabel(label),
      color: colorForIndex(i),
    }
  })

  // Build connectors and styles
  const connectors: Connector[] = []
  const connectorStyles: Record<string, ConnectorStyle> = {}
  const styleCache = new Map<string, string>()

  edges.forEach((edge, i) => {
    const styleKey = [edge.label ?? '', edge.dashed ? 'd' : 's'].join(':')
    let styleName = styleCache.get(styleKey)
    if (!styleName) {
      styleName = `e${i}`
      styleCache.set(styleKey, styleName)
      connectorStyles[styleName] = {
        color: 'zinc',
        strokeWidth: 2,
        ...(edge.label ? { label: edge.label } : {}),
        ...(edge.dashed ? { dashed: true } : {}),
      }
    }
    connectors.push({
      from: edge.from,
      to: edge.to,
      fromAnchor: 'right',
      toAnchor: 'left',
      style: styleName,
    })
  })

  const diagram: ArcDiagramData = {
    layout: { width: options.width ?? 800, height: options.height ?? 400 },
    nodes,
    nodeData,
    connectors,
    connectorStyles,
  }

  return {
    diagram: autoLayout(diagram),
    warnings,
    unsupported: [...new Set(unsupported)],
  }
}

// ============================================
// Sequence Diagram Parser
// ============================================

function parseSequenceDiagram(
  source: string,
  options: MermaidImportOptions,
): MermaidImportResult {
  const warnings: string[] = []
  const unsupported: string[] = []
  const lines = source.split('\n')

  const participants: Array<{ id: string; label: string }> = []
  const participantIds = new Set<string>()
  const messages: Array<{ from: string; to: string; label: string; dashed: boolean }> = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('%%')) continue

    // participant/actor: participant S as "Surface"
    const pMatch = line.match(/^(?:participant|actor)\s+(\S+)(?:\s+as\s+"?([^"]+)"?)?$/i)
    if (pMatch) {
      const id = pMatch[1]
      const label = pMatch[2]?.trim() ?? id
      if (!participantIds.has(id)) {
        participants.push({ id: sanitizeId(id), label })
        participantIds.add(id)
      }
      continue
    }

    // Messages: S->>B: Label, S-->>B: Label, S->>+B: Label, S-)B: Label
    const msgMatch = line.match(/^(\S+?)\s*(--?>>?\+?-?|--?>>\+?|--?\))\s*(\S+?)\s*:\s*(.+)$/i)
    if (msgMatch) {
      const fromId = sanitizeId(msgMatch[1])
      const arrow = msgMatch[2]
      const toId = sanitizeId(msgMatch[3])
      const label = msgMatch[4].trim()
      const dashed = arrow.startsWith('--')

      // Auto-register participants
      if (!participantIds.has(msgMatch[1])) {
        participants.push({ id: fromId, label: msgMatch[1] })
        participantIds.add(msgMatch[1])
      }
      if (!participantIds.has(msgMatch[3])) {
        participants.push({ id: toId, label: msgMatch[3] })
        participantIds.add(msgMatch[3])
      }

      messages.push({ from: fromId, to: toId, label, dashed })
      continue
    }

    // Note, activate, deactivate, alt/else/end, loop, etc.
    if (/^(Note|activate|deactivate|alt|else|end|loop|opt|par|critical|break|rect|autonumber)/i.test(line)) {
      unsupported.push(line.split(/\s/)[0])
      continue
    }

    warnings.push(`Skipped unrecognized line: "${line.substring(0, 60)}"`)
  }

  if (participants.length === 0) {
    return { diagram: emptyDiagram(options), warnings, unsupported: [...new Set(unsupported)] }
  }

  // Build nodes — sequence diagrams lay out participants left-to-right
  const nodes: Record<string, NodePosition> = {}
  const nodeData: Record<string, NodeData> = {}
  const size = options.defaultSize ?? 'm'

  participants.forEach((p, i) => {
    nodes[p.id] = { x: 0, y: 0, size }
    nodeData[p.id] = {
      icon: guessIcon(p.label),
      name: p.label,
      color: colorForIndex(i),
    }
  })

  // Build connectors — deduplicate style by label+dashed combo
  const connectors: Connector[] = []
  const connectorStyles: Record<string, ConnectorStyle> = {}
  const styleCache = new Map<string, string>()

  messages.forEach((msg, i) => {
    const styleKey = [msg.label, msg.dashed ? 'd' : 's'].join(':')
    let styleName = styleCache.get(styleKey)
    if (!styleName) {
      styleName = `m${i}`
      styleCache.set(styleKey, styleName)
      connectorStyles[styleName] = {
        color: 'zinc',
        strokeWidth: 2,
        label: msg.label,
        ...(msg.dashed ? { dashed: true } : {}),
      }
    }
    connectors.push({
      from: msg.from,
      to: msg.to,
      fromAnchor: 'right',
      toAnchor: 'left',
      style: styleName,
    })
  })

  const diagram: ArcDiagramData = {
    layout: { width: options.width ?? 800, height: options.height ?? 400 },
    nodes,
    nodeData,
    connectors,
    connectorStyles,
  }

  return {
    diagram: autoLayout(diagram),
    warnings,
    unsupported: [...new Set(unsupported)],
  }
}

// ============================================
// State Diagram Parser
// ============================================

function parseStateDiagram(
  source: string,
  options: MermaidImportOptions,
): MermaidImportResult {
  const warnings: string[] = []
  const unsupported: string[] = []
  const lines = source.split('\n')

  const stateLabels = new Map<string, string>()
  const transitions: Array<{ from: string; to: string; label?: string }> = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('%%')) continue

    // State description: state "Label" as S
    const stateMatch = line.match(/^state\s+"([^"]+)"\s+as\s+(\S+)/i)
    if (stateMatch) {
      stateLabels.set(stateMatch[2], stateMatch[1])
      continue
    }

    // Transition: A --> B: label or A --> B
    const transMatch = line.match(/^(\S+)\s+-->\s+(\S+)\s*(?::\s*(.+))?$/)
    if (transMatch) {
      const fromRaw = transMatch[1]
      const toRaw = transMatch[2]
      const label = transMatch[3]?.trim()

      transitions.push({
        from: fromRaw === '[*]' ? '__start__' : sanitizeId(fromRaw),
        to: toRaw === '[*]' ? '__end__' : sanitizeId(toRaw),
        label,
      })

      // Register states
      if (fromRaw !== '[*]' && !stateLabels.has(fromRaw)) stateLabels.set(fromRaw, fromRaw)
      if (toRaw !== '[*]' && !stateLabels.has(toRaw)) stateLabels.set(toRaw, toRaw)
      continue
    }

    // note, state with nested, ---, direction
    if (/^(note|state\s*\{|direction|\-\-\-)/i.test(line)) {
      unsupported.push(line.split(/\s/)[0])
      continue
    }

    if (line === '}') continue

    warnings.push(`Skipped unrecognized line: "${line.substring(0, 60)}"`)
  }

  // Collect all state IDs — include synthetic start/end if referenced
  const allIds = new Set<string>()
  for (const t of transitions) { allIds.add(t.from); allIds.add(t.to) }
  for (const id of stateLabels.keys()) allIds.add(sanitizeId(id))

  if (allIds.size === 0) {
    return { diagram: emptyDiagram(options), warnings, unsupported: [...new Set(unsupported)] }
  }

  const size = options.defaultSize ?? 's'
  const nodes: Record<string, NodePosition> = {}
  const nodeData: Record<string, NodeData> = {}
  let colorIdx = 0

  for (const id of allIds) {
    nodes[id] = { x: 0, y: 0, size: id === '__start__' || id === '__end__' ? 'xs' : size }
    const label = id === '__start__' ? 'Start'
      : id === '__end__' ? 'End'
      : stateLabels.get(id) ?? id
    nodeData[id] = {
      icon: id === '__start__' ? 'Play' : id === '__end__' ? 'Square' : guessIcon(label),
      name: label,
      color: id === '__start__' || id === '__end__' ? 'zinc' : colorForIndex(colorIdx++),
    }
  }

  // Build connectors
  const connectors: Connector[] = []
  const connectorStyles: Record<string, ConnectorStyle> = {}
  const styleCache = new Map<string, string>()

  transitions.forEach((t, i) => {
    const styleKey = t.label ?? ''
    let styleName = styleCache.get(styleKey)
    if (!styleName) {
      styleName = `t${i}`
      styleCache.set(styleKey, styleName)
      connectorStyles[styleName] = {
        color: 'zinc',
        strokeWidth: 2,
        ...(t.label ? { label: t.label } : {}),
      }
    }
    connectors.push({
      from: t.from,
      to: t.to,
      fromAnchor: 'right',
      toAnchor: 'left',
      style: styleName,
    })
  })

  const diagram: ArcDiagramData = {
    layout: { width: options.width ?? 800, height: options.height ?? 400 },
    nodes,
    nodeData,
    connectors,
    connectorStyles,
  }

  return {
    diagram: autoLayout(diagram),
    warnings,
    unsupported: [...new Set(unsupported)],
  }
}
