/**
 * ASCII Diagram Renderer for Arc
 *
 * Takes ArcDiagramData and produces a precise monospace string using
 * box-drawing characters, orthogonal connector routing, labels, and arrows.
 */

import type {
  ArcDiagramData,
  NodeData,
  AnchorPosition,
  NodeSize,
  NodePosition,
} from '../components/ArcDiagram'

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

export interface AsciiOptions {
  /** Pixels per character horizontally (default: 8) */
  scaleX?: number
  /** Pixels per character vertically (default: 16) */
  scaleY?: number
  /** 'unicode' for box-drawing chars, 'ascii' for +- style (default: 'unicode') */
  charset?: 'unicode' | 'ascii'
  /** Character padding around diagram (default: 1) */
  padding?: number
  /** Max output width in chars — auto-adjusts scaleX if exceeded */
  maxWidth?: number
  /** Show connector labels (default: true) */
  showLabels?: boolean
}

export function renderAscii(data: ArcDiagramData, options?: AsciiOptions): string {
  const opts = resolveOptions(data, options)
  const chars = opts.charset === 'ascii' ? ASCII_CHARS : UNICODE_CHARS

  // Calculate grid dimensions
  const gridW = Math.ceil(data.layout.width / opts.scaleX) + opts.padding * 2 + 4
  const gridH = Math.ceil(data.layout.height / opts.scaleY) + opts.padding * 2 + 4
  const grid = new AsciiGrid(gridW, gridH)

  // Pre-compute node rects in char-grid space
  const nodeIds = Object.keys(data.nodes)
  const rects: Record<string, Rect> = {}
  for (const id of nodeIds) {
    rects[id] = nodeToRect(data.nodes[id], opts)
  }

  // Draw connectors: solid first, then dashed (so solid wins in overlaps)
  const connectors = [...data.connectors]
  connectors.sort((a, b) => {
    const aD = data.connectorStyles[a.style]?.dashed ? 1 : 0
    const bD = data.connectorStyles[b.style]?.dashed ? 1 : 0
    return aD - bD
  })

  for (const conn of connectors) {
    const fromRect = rects[conn.from]
    const toRect = rects[conn.to]
    if (!fromRect || !toRect) continue

    const from = anchorPoint(fromRect, conn.fromAnchor)
    const to = anchorPoint(toRect, conn.toAnchor)
    const fromDir = anchorDir(conn.fromAnchor)
    const toDir = anchorDir(conn.toAnchor)

    const waypoints = route(from, to, fromDir, toDir)
    const style = data.connectorStyles[conn.style]
    const label = opts.showLabels ? style?.label : undefined
    const dashed = style?.dashed ?? false

    drawConnector(grid, waypoints, label, dashed, chars)
  }

  // Draw nodes on top
  for (const id of nodeIds) {
    const isLarge = data.nodes[id].size === 'l'
    drawNode(grid, rects[id], data.nodeData[id], chars, isLarge)
  }

  let result = grid.toString()

  // Post-process: replace any remaining Unicode box-drawing chars in ASCII mode
  // (merge/drawCorner produce Unicode; box() already uses the correct charset)
  if (opts.charset === 'ascii') {
    result = result.replace(/[┌┐└┘┬┴├┤┼]/g, '+')
  }

  return result
}

// ─────────────────────────────────────────────
// Character sets
// ─────────────────────────────────────────────

interface CharSet {
  tl: string; tr: string; bl: string; br: string
  h: string; v: string
  cross: string
  arrowR: string; arrowL: string; arrowD: string; arrowU: string
  hDash: string; vDash: string
  icon: string
  dtl: string; dtr: string; dbl: string; dbr: string
  dh: string; dv: string
}

const UNICODE_CHARS: CharSet = {
  tl: '┌', tr: '┐', bl: '└', br: '┘',
  h: '─', v: '│', cross: '┼',
  arrowR: '▶', arrowL: '◀', arrowD: '▼', arrowU: '▲',
  hDash: '╌', vDash: '╎',
  icon: '◆',
  dtl: '╔', dtr: '╗', dbl: '╚', dbr: '╝', dh: '═', dv: '║',
}

const ASCII_CHARS: CharSet = {
  tl: '+', tr: '+', bl: '+', br: '+',
  h: '-', v: '|', cross: '+',
  arrowR: '>', arrowL: '<', arrowD: 'v', arrowU: '^',
  hDash: '-', vDash: ':',
  icon: '*',
  dtl: '#', dtr: '#', dbl: '#', dbr: '#', dh: '=', dv: '#',
}

// ─────────────────────────────────────────────
// Direction-based character merging
// ─────────────────────────────────────────────

type DirSet = { l?: boolean; r?: boolean; u?: boolean; d?: boolean }

/** Map each box-drawing char to the set of directions it represents */
const CHAR_DIRS: Record<string, DirSet> = {
  '─': { l: true, r: true }, '╌': { l: true, r: true }, '-': { l: true, r: true },
  '│': { u: true, d: true }, '╎': { u: true, d: true }, '|': { u: true, d: true }, ':': { u: true, d: true },
  '┌': { r: true, d: true }, '┐': { l: true, d: true },
  '└': { r: true, u: true }, '┘': { l: true, u: true },
  '┬': { l: true, r: true, d: true }, '┴': { l: true, r: true, u: true },
  '├': { u: true, d: true, r: true }, '┤': { u: true, d: true, l: true },
  '┼': { l: true, r: true, u: true, d: true },
}

/** Given a set of directions, return the appropriate box-drawing character */
function dirsToChar(d: DirSet): string {
  const { l, r, u, d: dn } = d
  if (l && r && u && dn) return '┼'
  if (l && r && dn) return '┬'
  if (l && r && u) return '┴'
  if (u && dn && r) return '├'
  if (u && dn && l) return '┤'
  if (r && dn) return '┌'
  if (l && dn) return '┐'
  if (r && u) return '└'
  if (l && u) return '┘'
  if (l || r) return '─'
  if (u || dn) return '│'
  return ' '
}

/** Merge an incoming line character with whatever already exists in the cell */
function merge(existing: string, incoming: string, dir: 'h' | 'v'): string {
  if (existing === ' ') return incoming
  if (existing === incoming) return existing

  const exDirs = CHAR_DIRS[existing]
  if (!exDirs) return incoming // existing is text or unknown, overwrite

  // New directions from the incoming line
  const newDirs: DirSet = dir === 'h' ? { l: true, r: true } : { u: true, d: true }

  // Combine
  const combined: DirSet = { ...exDirs, ...newDirs }
  return dirsToChar(combined)
}

// Characters that should never be overwritten (only arrows)
const ARROW_CHARS = new Set(['▶', '◀', '▼', '▲', '>', '<', 'v', '^'])

// ─────────────────────────────────────────────
// Grid
// ─────────────────────────────────────────────

interface Rect { x: number; y: number; w: number; h: number }
interface Point { x: number; y: number }
type Dir = 'right' | 'left' | 'up' | 'down'

class AsciiGrid {
  private cells: string[][]
  readonly width: number
  readonly height: number

  constructor(w: number, h: number) {
    this.width = w
    this.height = h
    this.cells = Array.from({ length: h }, () => Array(w).fill(' '))
  }

  ok(x: number, y: number) { return x >= 0 && x < this.width && y >= 0 && y < this.height }
  get(x: number, y: number) { return this.ok(x, y) ? this.cells[y][x] : ' ' }
  set(x: number, y: number, c: string) { if (this.ok(x, y)) this.cells[y][x] = c }

  text(x: number, y: number, s: string) {
    for (let i = 0; i < s.length; i++) this.set(x + i, y, s[i])
  }

  /** Write text but don't overwrite arrows */
  textSafe(x: number, y: number, s: string) {
    for (let i = 0; i < s.length; i++) {
      const ex = this.get(x + i, y)
      if (!ARROW_CHARS.has(ex)) this.set(x + i, y, s[i])
    }
  }

  box(r: Rect, ch: CharSet, double = false) {
    const { x, y, w, h } = r
    const tl = double ? ch.dtl : ch.tl
    const tr = double ? ch.dtr : ch.tr
    const bl = double ? ch.dbl : ch.bl
    const br = double ? ch.dbr : ch.br
    const hc = double ? ch.dh : ch.h
    const vc = double ? ch.dv : ch.v

    this.set(x, y, tl)
    this.set(x + w - 1, y, tr)
    this.set(x, y + h - 1, bl)
    this.set(x + w - 1, y + h - 1, br)
    for (let i = 1; i < w - 1; i++) { this.set(x + i, y, hc); this.set(x + i, y + h - 1, hc) }
    for (let j = 1; j < h - 1; j++) { this.set(x, y + j, vc); this.set(x + w - 1, y + j, vc) }
    // Clear interior
    for (let j = 1; j < h - 1; j++)
      for (let i = 1; i < w - 1; i++)
        this.set(x + i, y + j, ' ')
  }

  hLine(y: number, x1: number, x2: number, ch: string) {
    const [a, b] = x1 < x2 ? [x1, x2] : [x2, x1]
    for (let x = a; x <= b; x++) {
      const ex = this.get(x, y)
      if (ARROW_CHARS.has(ex)) continue
      this.set(x, y, merge(ex, ch, 'h'))
    }
  }

  vLine(x: number, y1: number, y2: number, ch: string) {
    const [a, b] = y1 < y2 ? [y1, y2] : [y2, y1]
    for (let y = a; y <= b; y++) {
      const ex = this.get(x, y)
      if (ARROW_CHARS.has(ex)) continue
      this.set(x, y, merge(ex, ch, 'v'))
    }
  }

  toString(): string {
    const lines = this.cells.map(row => row.join('').trimEnd())
    // Trim leading and trailing blank lines
    let start = 0
    while (start < lines.length && lines[start].length === 0) start++
    let end = lines.length - 1
    while (end > start && lines[end].length === 0) end--
    const trimmed = lines.slice(start, end + 1)
    // Remove common left indentation
    const minIndent = trimmed.reduce((min, line) => {
      if (line.length === 0) return min
      const indent = line.length - line.trimStart().length
      return Math.min(min, indent)
    }, Infinity)
    if (minIndent > 0 && minIndent < Infinity) {
      return trimmed.map(l => l.slice(minIndent)).join('\n')
    }
    return trimmed.join('\n')
  }
}

// ─────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────

const NODE_PX: Record<NodeSize, { w: number; h: number }> = {
  l:  { w: 220, h: 90 },
  m:  { w: 160, h: 75 },
  s:  { w: 110, h: 48 },
  xs: { w: 80,  h: 36 },
}

interface ResolvedOptions {
  scaleX: number
  scaleY: number
  charset: 'unicode' | 'ascii'
  padding: number
  showLabels: boolean
}

function resolveOptions(data: ArcDiagramData, opts?: AsciiOptions): ResolvedOptions {
  let scaleX = opts?.scaleX ?? 8
  const scaleY = opts?.scaleY ?? 16
  const padding = opts?.padding ?? 1
  const charset = opts?.charset ?? 'unicode'
  const showLabels = opts?.showLabels ?? true

  if (opts?.maxWidth) {
    const naturalW = Math.ceil(data.layout.width / scaleX) + padding * 2 + 4
    if (naturalW > opts.maxWidth) {
      scaleX = data.layout.width / (opts.maxWidth - padding * 2 - 4)
    }
  }

  return { scaleX, scaleY, padding, charset, showLabels }
}

// ─────────────────────────────────────────────
// Coordinate mapping
// ─────────────────────────────────────────────

function px2char(px: number, py: number, o: ResolvedOptions): Point {
  return {
    x: Math.round(px / o.scaleX) + o.padding,
    y: Math.round(py / o.scaleY) + o.padding,
  }
}

function nodeToRect(pos: NodePosition, o: ResolvedOptions): Rect {
  const size = NODE_PX[pos.size]
  const tl = px2char(pos.x, pos.y, o)
  const br = px2char(pos.x + size.w, pos.y + size.h, o)
  return {
    x: tl.x,
    y: tl.y,
    w: Math.max(br.x - tl.x, 8),
    h: Math.max(br.y - tl.y, 3),
  }
}

// ─────────────────────────────────────────────
// Anchors
// ─────────────────────────────────────────────

function anchorPoint(r: Rect, anchor: AnchorPosition): Point {
  const mx = r.x + Math.floor(r.w / 2)
  const my = r.y + Math.floor(r.h / 2)
  switch (anchor) {
    case 'right':       return { x: r.x + r.w, y: my }
    case 'left':        return { x: r.x - 1, y: my }
    case 'top':         return { x: mx, y: r.y - 1 }
    case 'bottom':      return { x: mx, y: r.y + r.h }
    case 'topRight':    return { x: r.x + r.w, y: r.y + 1 }
    case 'topLeft':     return { x: r.x - 1, y: r.y + 1 }
    case 'bottomRight': return { x: r.x + r.w, y: r.y + r.h - 2 }
    case 'bottomLeft':  return { x: r.x - 1, y: r.y + r.h - 2 }
    default:            return { x: r.x + r.w, y: my }
  }
}

function anchorDir(anchor: AnchorPosition): Dir {
  switch (anchor) {
    case 'right': case 'topRight': case 'bottomRight': return 'right'
    case 'left':  case 'topLeft':  case 'bottomLeft':  return 'left'
    case 'top':    return 'up'
    case 'bottom': return 'down'
    default:       return 'right'
  }
}

// ─────────────────────────────────────────────
// Connector routing (orthogonal)
// ─────────────────────────────────────────────

function route(from: Point, to: Point, fd: Dir, td: Dir): Point[] {
  // Straight line cases
  if (fd === 'right' && td === 'left' && from.y === to.y) return [from, to]
  if (fd === 'left' && td === 'right' && from.y === to.y) return [from, to]
  if (fd === 'down' && td === 'up' && from.x === to.x) return [from, to]
  if (fd === 'up' && td === 'down' && from.x === to.x) return [from, to]

  // Horizontal → Horizontal (Z-route)
  if (isH(fd) && isH(td)) {
    const mx = Math.round((from.x + to.x) / 2)
    return [from, { x: mx, y: from.y }, { x: mx, y: to.y }, to]
  }

  // Vertical → Vertical (Z-route)
  if (isV(fd) && isV(td)) {
    const my = Math.round((from.y + to.y) / 2)
    return [from, { x: from.x, y: my }, { x: to.x, y: my }, to]
  }

  // Horizontal → Vertical (L-shape)
  if (isH(fd) && isV(td)) return [from, { x: to.x, y: from.y }, to]

  // Vertical → Horizontal (L-shape)
  if (isV(fd) && isH(td)) return [from, { x: from.x, y: to.y }, to]

  // Fallback L-shape
  return [from, { x: to.x, y: from.y }, to]
}

function isH(d: Dir) { return d === 'left' || d === 'right' }
function isV(d: Dir) { return d === 'up' || d === 'down' }

// ─────────────────────────────────────────────
// Drawing connectors
// ─────────────────────────────────────────────

function drawConnector(grid: AsciiGrid, wp: Point[], label: string | undefined, dashed: boolean, ch: CharSet) {
  const hc = dashed ? ch.hDash : ch.h
  const vc = dashed ? ch.vDash : ch.v

  // Collect this connector's corner positions (intermediate waypoints)
  // so line drawing can skip them — prevents ┼ artifacts at corners
  const cornerSet = new Set<string>()
  for (let i = 1; i < wp.length - 1; i++) {
    cornerSet.add(`${wp[i].x},${wp[i].y}`)
  }

  // Track longest horizontal and vertical segments for label placement
  let bestH = { x1: 0, x2: 0, y: 0, len: 0 }
  let bestV = { y1: 0, y2: 0, x: 0, len: 0 }

  // Pass 1: draw line segments, skipping corner positions
  for (let i = 0; i < wp.length - 1; i++) {
    const a = wp[i], b = wp[i + 1]

    if (a.y === b.y) {
      const [x1, x2] = a.x < b.x ? [a.x, b.x] : [b.x, a.x]
      for (let x = x1; x <= x2; x++) {
        if (cornerSet.has(`${x},${a.y}`)) continue
        const ex = grid.get(x, a.y)
        if (ARROW_CHARS.has(ex)) continue
        grid.set(x, a.y, merge(ex, hc, 'h'))
      }
      const len = x2 - x1
      if (len > bestH.len) bestH = { x1, x2, y: a.y, len }
    } else if (a.x === b.x) {
      const [y1, y2] = a.y < b.y ? [a.y, b.y] : [b.y, a.y]
      for (let y = y1; y <= y2; y++) {
        if (cornerSet.has(`${a.x},${y}`)) continue
        const ex = grid.get(a.x, y)
        if (ARROW_CHARS.has(ex)) continue
        grid.set(a.x, y, merge(ex, vc, 'v'))
      }
      const len = y2 - y1
      if (len > bestV.len) bestV = { y1, y2, x: a.x, len }
    }
  }

  // Pass 2: draw corners at intermediate waypoints (merges with other connectors' lines)
  for (let i = 1; i < wp.length - 1; i++) {
    drawCorner(grid, wp[i - 1], wp[i], wp[i + 1])
  }

  // Arrow at destination
  if (wp.length >= 2) {
    const end = wp[wp.length - 1]
    const prev = wp[wp.length - 2]
    const arrow =
      end.x > prev.x ? ch.arrowR :
      end.x < prev.x ? ch.arrowL :
      end.y > prev.y ? ch.arrowD : ch.arrowU
    grid.set(end.x, end.y, arrow)
  }

  // Place label
  if (!label) return

  const padded = ` ${label} `

  // Try inline on longest horizontal segment (need 2-char margins from ends for corners)
  if (bestH.len >= padded.length + 2) {
    const start = bestH.x1 + Math.floor((bestH.len - padded.length) / 2) + 1
    grid.textSafe(start, bestH.y, padded)
  } else if (bestH.len >= label.length + 4) {
    const start = bestH.x1 + Math.floor((bestH.len - label.length) / 2) + 1
    grid.textSafe(start, bestH.y, label)
  } else if (bestH.len >= 4 && bestH.y > 0) {
    // Place label ABOVE the horizontal line
    const start = bestH.x1 + Math.max(1, Math.floor((bestH.len - label.length) / 2))
    grid.textSafe(start, bestH.y - 1, label)
  } else if (bestV.len >= 3) {
    // Place beside the vertical segment
    const ly = bestV.y1 + Math.floor(bestV.len / 2)
    grid.textSafe(bestV.x + 2, ly, label)
  }
}

function drawCorner(grid: AsciiGrid, prev: Point, cur: Point, next: Point) {
  // Determine which directions extend from this corner
  const dirs: DirSet = {}
  if (prev.x < cur.x) dirs.l = true
  if (prev.x > cur.x) dirs.r = true
  if (prev.y < cur.y) dirs.u = true
  if (prev.y > cur.y) dirs.d = true
  if (next.x < cur.x) dirs.l = true
  if (next.x > cur.x) dirs.r = true
  if (next.y < cur.y) dirs.u = true
  if (next.y > cur.y) dirs.d = true

  // Merge with existing character (picks up lines from other connectors)
  const existing = grid.get(cur.x, cur.y)
  const exDirs = CHAR_DIRS[existing]
  const combined = exDirs ? { ...exDirs, ...dirs } : dirs

  const c = dirsToChar(combined)
  if (c !== ' ') grid.set(cur.x, cur.y, c)
}

// ─────────────────────────────────────────────
// Drawing nodes
// ─────────────────────────────────────────────

function drawNode(grid: AsciiGrid, rect: Rect, nodeData: NodeData | undefined, ch: CharSet, isLarge: boolean) {
  if (!nodeData) return

  // Draw box (clears interior); large nodes get double-line borders
  grid.box(rect, ch, isLarge)

  const inner = rect.w - 4  // usable text width (1 border + 1 space each side)
  const lines: string[] = []

  // Line 1: icon + name
  const nameLine = `${ch.icon} ${nodeData.name}`
  lines.push(truncate(nameLine, inner))

  // Line 2: subtitle
  if (nodeData.subtitle) {
    lines.push(truncate(nodeData.subtitle, inner))
  }

  // Line 3+: description (only if enough vertical space)
  if (nodeData.description && rect.h >= 5) {
    lines.push(truncate(nodeData.description, inner))
  }

  // Available content rows = height - 2 (borders)
  const contentRows = rect.h - 2
  const usedLines = lines.slice(0, contentRows)

  // Vertically center the text block
  const startRow = rect.y + 1 + Math.max(0, Math.floor((contentRows - usedLines.length) / 2))

  for (let i = 0; i < usedLines.length; i++) {
    grid.text(rect.x + 2, startRow + i, usedLines[i])
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  if (max <= 3) return s.slice(0, max)
  return s.slice(0, max - 1) + '…'
}
