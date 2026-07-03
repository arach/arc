"use client"
import React, { useState, useCallback, useMemo } from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getTheme, type ThemeId, type Theme, type BrandSpec } from '../utils/themes'
import { autoLayout } from '../utils/autoLayout'

// ============================================
// Types
// ============================================

export type NodeSize = 'xs' | 's' | 'm' | 'l'
export type AnchorPosition = 'left' | 'right' | 'top' | 'bottom' | 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'
export type DiagramColor = 'violet' | 'emerald' | 'blue' | 'amber' | 'sky' | 'zinc' | 'rose' | 'orange'

export interface NodePosition {
  x: number
  y: number
  size: NodeSize
}

export interface NodeData {
  icon: string
  name: string
  subtitle?: string
  description?: string
  color: DiagramColor
}

export interface Connector {
  from: string
  to: string
  fromAnchor: AnchorPosition
  toAnchor: AnchorPosition
  style: string
  curve?: 'natural' | 'step'
}

export type LabelAlign = 'left' | 'right' | 'center'

export interface ConnectorStyle {
  color: DiagramColor
  strokeWidth: number
  label?: string
  labelAlign?: LabelAlign  // For vertical: 'right' = right of line, 'left' = left of line. Default: 'right'
  dashed?: boolean
}

export interface DiagramLayout {
  width: number
  height: number
}

export interface ArcDiagramData {
  id?: string
  layout: DiagramLayout
  nodes: Record<string, NodePosition>
  nodeData: Record<string, NodeData>
  connectors: Connector[]
  connectorStyles: Record<string, ConnectorStyle>
}

// ============================================
// Hover Effects
// ============================================

export interface HoverEffectsConfig {
  /** Dim unrelated nodes/connectors. Default: true */
  dim?: boolean
  /** 0–1 opacity for dimmed nodes. Connectors dim to ~56% of this. Default: 0.45 */
  dimOpacity?: number
  /** Lift hovered node up 2px. Default: true */
  lift?: boolean
  /** Colored glow shadow on hover. Default: true */
  glow?: boolean
  /** Thicken connected edges. Default: true */
  highlightEdges?: boolean
}

interface ResolvedHoverEffects {
  enabled: boolean
  dim: boolean
  dimOpacity: number
  connectorDimOpacity: number
  lift: boolean
  glow: boolean
  highlightEdges: boolean
}

function resolveHoverEffects(input?: boolean | HoverEffectsConfig): ResolvedHoverEffects {
  if (input === false) return { enabled: false, dim: false, dimOpacity: 1, connectorDimOpacity: 1, lift: false, glow: false, highlightEdges: false }
  const cfg = typeof input === 'object' ? input : {}
  const dimOpacity = cfg.dimOpacity ?? 0.45
  return {
    enabled: true,
    dim: cfg.dim ?? true,
    dimOpacity,
    connectorDimOpacity: dimOpacity * 0.56,
    lift: cfg.lift ?? true,
    glow: cfg.glow ?? true,
    highlightEdges: cfg.highlightEdges ?? true,
  }
}

// ============================================
// Constants
// ============================================

const NODE_SIZES: Record<NodeSize, { width: number; height: number }> = {
  l: { width: 220, height: 90 },
  m: { width: 160, height: 75 },
  s: { width: 110, height: 48 },
  xs: { width: 80, height: 36 },
}

// Mode = light/dark appearance, Theme = color palette
export type DiagramMode = 'dark' | 'light'
export { type ThemeId } from '../utils/themes'

// ============================================
// Components
// ============================================

interface NodeProps {
  node: NodePosition
  data: NodeData
  mode: DiagramMode
  themeColors: Theme['light'] | Theme['dark']
  brand?: BrandSpec
  hovered?: boolean
  dimmed?: boolean
  lift?: boolean
  glow?: boolean
  dimOpacity?: number
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
}

export function Node({ node, data, mode, themeColors, brand, hovered, dimmed, lift = true, glow = true, dimOpacity = 0.45, onMouseEnter, onMouseLeave, onClick }: NodeProps) {
  const size = NODE_SIZES[node.size]
  const color = themeColors.palette[data.color] || themeColors.palette.zinc
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[data.icon] || LucideIcons.Box

  const isLarge = node.size === 'l'
  const isSmall = node.size === 's'
  const isLight = mode === 'light'

  return (
    <div
      className={`
        absolute rounded-xl border-2 ${color.border} ${color.bg}
        ${isLarge ? 'px-5 py-3' : isSmall ? 'px-3 py-2' : 'px-4 py-2.5'}
        ${isLight ? 'bg-white/80 shadow-sm' : 'bg-zinc-900/90'} backdrop-blur-sm
        transition-all duration-200 ease-out
      `}
      style={{
        left: node.x,
        top: node.y,
        width: size.width,
        borderRadius: brand?.nodeRadius,
        borderWidth: brand?.nodeBorderWidth,
        transform: hovered && lift ? 'translateY(-2px)' : 'none',
        boxShadow: hovered && glow
          ? `0 8px 24px -4px ${color.stroke}33, 0 0 0 1px ${color.stroke}22`
          : 'none',
        opacity: dimmed ? dimOpacity : 1,
        zIndex: hovered ? 10 : undefined,
        cursor: onClick ? 'pointer' : undefined,
      }}
      data-arc-node
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`
          flex-shrink-0 rounded-lg
          ${isLight ? 'border border-zinc-200 bg-white shadow-sm' : 'border border-zinc-700 bg-zinc-900'}
          ${isLarge ? 'w-10 h-10' : isSmall ? 'w-6 h-6' : 'w-8 h-8'}
          flex items-center justify-center
        `} style={{ borderRadius: brand?.nodeRadius }}>
          <Icon className={`${isLarge ? 'w-5 h-5' : isSmall ? 'w-3 h-3' : 'w-4 h-4'} ${color.icon}`} />
        </div>
        <div className="min-w-0">
          <div className={`font-semibold ${themeColors.text.primary} ${isLarge ? 'text-sm' : isSmall ? 'text-[10px]' : 'text-xs'}`}>
            {data.name}
          </div>
          {data.subtitle && (
            <div
              className={`font-mono ${themeColors.text.muted} ${isSmall ? 'text-[8px]' : 'text-[10px]'}`}
              style={brand ? { fontFamily: brand.monoFamily, textTransform: brand.upperLabels ? 'uppercase' : undefined, letterSpacing: brand.upperLabels ? '0.05em' : undefined } : undefined}
            >
              {data.subtitle}
            </div>
          )}
        </div>
      </div>
      {data.description && !isSmall && (
        <div className={`mt-1.5 ${themeColors.text.secondary} ${isLarge ? 'text-[11px]' : 'text-[10px]'}`}>
          {data.description}
        </div>
      )}
    </div>
  )
}

function getAnchorPoint(node: NodePosition, anchor: AnchorPosition): { x: number; y: number } {
  const size = NODE_SIZES[node.size]
  const gap = 6

  const anchors: Record<AnchorPosition, { x: number; y: number }> = {
    left:        { x: node.x - gap,              y: node.y + size.height / 2 },
    right:       { x: node.x + size.width + gap, y: node.y + size.height / 2 },
    top:         { x: node.x + size.width / 2,   y: node.y - gap },
    bottom:      { x: node.x + size.width / 2,   y: node.y + size.height + gap },
    bottomRight: { x: node.x + size.width + gap, y: node.y + size.height - 12 },
    bottomLeft:  { x: node.x - gap,              y: node.y + size.height - 12 },
    topRight:    { x: node.x + size.width + gap, y: node.y + 12 },
    topLeft:     { x: node.x - gap,              y: node.y + 12 },
  }

  return anchors[anchor]
}

// Calculate angle between two points for arrow rotation
function getAngle(from: { x: number; y: number }, to: { x: number; y: number }): number {
  return Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI)
}

interface ConnectorProps {
  connector: Connector
  connectorIndex: number
  nodes: Record<string, NodePosition>
  styles: Record<string, ConnectorStyle>
  themeColors: Theme['light'] | Theme['dark']
  brand?: BrandSpec
  highlighted?: boolean
  dimmed?: boolean
  dimOpacity?: number
}

function ConnectorPath({ connector, connectorIndex, nodes, styles, themeColors, brand, highlighted, dimmed, dimOpacity = 0.25 }: ConnectorProps) {
  const fromNode = nodes[connector.from]
  const toNode = nodes[connector.to]
  if (!fromNode || !toNode) return null

  // Validate node sizes exist
  if (!NODE_SIZES[fromNode.size] || !NODE_SIZES[toNode.size]) {
    console.warn(`Invalid node size: ${fromNode.size} or ${toNode.size}`)
    return null
  }

  const style = styles[connector.style] || { color: 'zinc', strokeWidth: 2 }

  // Safely get anchor points
  let from: { x: number; y: number }
  let to: { x: number; y: number }
  try {
    from = getAnchorPoint(fromNode, connector.fromAnchor)
    to = getAnchorPoint(toNode, connector.toAnchor)
  } catch (e) {
    console.warn(`Invalid anchor: ${connector.fromAnchor} or ${connector.toAnchor}`)
    return null
  }

  const color = themeColors.palette[style.color]?.stroke || themeColors.palette.zinc.stroke
  const gradientId = `connector-gradient-${connectorIndex}`

  // Calculate path
  let path: string
  const isVertical = Math.abs(to.y - from.y) > Math.abs(to.x - from.x)
  const labelAlign = style.labelAlign || (isVertical ? 'right' : 'center')

  // Label positioning
  let labelPos: { x: number; y: number }
  let labelOffset = { x: 0, y: 0 }
  let textAnchor: 'start' | 'middle' | 'end' = 'middle'

  if (connector.curve === 'natural') {
    // Curved path for diagonal connections
    const dx = to.x - from.x
    const dy = to.y - from.y
    const cp1x = from.x + dx * 0.4
    const cp1y = from.y + dy * 0.1
    const cp2x = to.x - dx * 0.4
    const cp2y = to.y - dy * 0.1
    path = `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`
    labelPos = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
    labelOffset = { x: 0, y: -8 }
  } else {
    path = `M ${from.x} ${from.y} L ${to.x} ${to.y}`
    labelPos = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }

    if (isVertical) {
      // Vertical connector - position label to left or right of line
      if (labelAlign === 'right') {
        labelOffset = { x: 8, y: 4 }
        textAnchor = 'start'  // Left-aligned text on right side
      } else if (labelAlign === 'left') {
        labelOffset = { x: -8, y: 4 }
        textAnchor = 'end'    // Right-aligned text on left side
      } else {
        labelOffset = { x: 0, y: -8 }
        textAnchor = 'middle'
      }
    } else {
      // Horizontal connector - label above, centered
      labelOffset = { x: 0, y: -8 }
      textAnchor = 'middle'
    }
  }

  // Calculate arrow angle at endpoint
  const angle = getAngle(from, to)
  const arrowSize = 8

  return (
    <g style={{
      opacity: dimmed ? dimOpacity : 1,
      transition: 'opacity 200ms ease-out',
    }}>
      {/* Gradient definition - fades at both ends */}
      <defs>
        <linearGradient
          id={gradientId}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={color} stopOpacity={highlighted ? 0.5 : 0.3} />
          <stop offset="15%" stopColor={color} stopOpacity={1} />
          <stop offset="85%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={highlighted ? 0.7 : 0.5} />
        </linearGradient>
      </defs>

      {/* Main path with gradient */}
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={highlighted ? style.strokeWidth + 1 : style.strokeWidth}
        strokeDasharray={style.dashed ? '6 3' : undefined}
        style={{ transition: 'stroke-width 200ms ease-out' }}
      />

      {/* Arrow head — chevron (brand) or filled triangle */}
      <g transform={`translate(${to.x}, ${to.y}) rotate(${angle})`}>
        {brand?.arrowhead === 'chevron' ? (
          <polyline
            points={`${-arrowSize},${-arrowSize / 2.2} 0,0 ${-arrowSize},${arrowSize / 2.2}`}
            fill="none"
            stroke={color}
            strokeWidth={Math.max(1.25, style.strokeWidth)}
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        ) : (
          <polygon
            points={`0,0 ${-arrowSize},-${arrowSize / 2.5} ${-arrowSize},${arrowSize / 2.5}`}
            fill={color}
          />
        )}
      </g>

      {/* Label */}
      {style.label && (
        <text
          x={labelPos.x + labelOffset.x}
          y={labelPos.y + labelOffset.y}
          textAnchor={textAnchor}
          fill={color}
          className="text-[10px] font-mono"
          style={{
            fontFamily: brand?.monoFamily || 'ui-monospace, monospace',
            fontWeight: highlighted ? 700 : 400,
            textTransform: brand?.upperLabels ? 'uppercase' : undefined,
            letterSpacing: brand?.upperLabels ? '0.08em' : undefined,
            transition: 'font-weight 200ms ease-out',
          }}
        >
          {style.label}
        </text>
      )}
    </g>
  )
}

// ============================================
// Zoom Controls
// ============================================

const DEFAULT_ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]

interface ZoomControlsProps {
  zoom: number
  zoomLevels: number[]
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  mode: DiagramMode
  brand?: BrandSpec
  /** Distance (px) from the right and bottom edges. */
  right?: number
  bottom?: number
}

function ZoomControls({ zoom, zoomLevels, onZoomIn, onZoomOut, onReset, mode, brand, right = 12, bottom = 12 }: ZoomControlsProps) {
  const { ZoomIn, ZoomOut } = LucideIcons
  const isLight = mode === 'light'

  return (
    <div
      className={`absolute flex items-center backdrop-blur-sm rounded-md overflow-hidden z-10 ${
        isLight
          ? 'bg-white/90 border border-zinc-200 shadow-sm'
          : 'bg-zinc-900/90 border border-zinc-700'
      }`}
      style={{ right, bottom, borderRadius: brand?.nodeRadius }}
    >
      <button
        onClick={onZoomOut}
        disabled={zoom <= zoomLevels[0]}
        className={`p-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-l-md ${
          isLight ? 'hover:bg-zinc-100' : 'hover:bg-zinc-700'
        }`}
        title="Zoom out"
      >
        <ZoomOut className={`w-3 h-3 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`} />
      </button>
      <button
        onClick={onReset}
        className={`px-1.5 py-1 text-[9px] font-mono transition-colors min-w-[36px] ${
          isLight
            ? 'text-zinc-500 hover:bg-zinc-100 border-x border-zinc-200'
            : 'text-zinc-400 hover:bg-zinc-700 border-x border-zinc-700'
        }`}
        style={{ fontFamily: brand?.monoFamily }}
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        onClick={onZoomIn}
        disabled={zoom >= zoomLevels[zoomLevels.length - 1]}
        className={`p-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-r-md ${
          isLight ? 'hover:bg-zinc-100' : 'hover:bg-zinc-700'
        }`}
        title="Zoom in"
      >
        <ZoomIn className={`w-3 h-3 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`} />
      </button>
    </div>
  )
}

// ============================================
// MiniMap
// ============================================

interface MiniMapProps {
  nodes: Record<string, NodePosition>
  nodeData: Record<string, NodeData>
  layout: { width: number; height: number }
  themeColors: Theme['light'] | Theme['dark']
  brand?: BrandSpec
  mode: DiagramMode
  /** Distance (px) from the bottom and left edges. */
  inset?: number
}

function MiniMap({ nodes, nodeData, layout, themeColors, brand, mode, inset = 12 }: MiniMapProps) {
  const isLight = mode === 'light'
  const W = 132
  const H = Math.max(56, Math.min(120, Math.round((layout.height / layout.width) * W)))
  const sx = W / layout.width
  const sy = H / layout.height
  const square = brand?.nodeRadius === '0px'

  return (
    <div
      className={`absolute z-10 backdrop-blur-sm overflow-hidden ${
        isLight ? 'bg-white/90 border border-zinc-200 shadow-sm' : 'bg-zinc-900/90 border border-zinc-700'
      }`}
      style={{ bottom: inset, left: inset, width: W, height: H, borderRadius: brand?.nodeRadius }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {Object.entries(nodes).map(([id, n]) => {
          const sz = NODE_SIZES[n.size]
          if (!sz) return null
          const stroke = themeColors.palette[nodeData[id]?.color]?.stroke || themeColors.palette.zinc.stroke
          return (
            <rect
              key={id}
              x={n.x * sx}
              y={n.y * sy}
              width={Math.max(4, sz.width * sx)}
              height={Math.max(3, sz.height * sy)}
              rx={square ? 0 : 1}
              fill={stroke}
              fillOpacity={0.82}
            />
          )
        })}
      </svg>
    </div>
  )
}

// ============================================
// .arc View & Controls
// ============================================

function generateSource(data: ArcDiagramData): string {
  const clean = {
    id: data.id,
    layout: data.layout,
    nodes: data.nodes,
    nodeData: data.nodeData,
    connectors: data.connectors,
    connectorStyles: data.connectorStyles,
  }
  const json = JSON.stringify(clean, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'")

  return `import type { ArcDiagramData } from '@arach/arc'\n\nconst diagram: ArcDiagramData = ${json}\n\nexport default diagram\n`
}

function ArcSourceView({ source, mode }: {
  source: string
  mode: DiagramMode
}) {
  const isLight = mode === 'light'
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(source).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [source])

  const { Copy, Check } = LucideIcons

  return (
    <div className="absolute inset-0 overflow-auto z-[5]" style={{
      backgroundColor: isLight ? 'rgba(250,250,250,0.97)' : 'rgba(9,9,11,0.97)',
    }}>
      <div className="flex items-center justify-end gap-1 px-4 pt-3">
        <button
          onClick={handleCopy}
          className={`p-1 rounded transition-colors ${
            isLight
              ? 'hover:bg-zinc-200/60 text-zinc-400'
              : 'hover:bg-zinc-700/60 text-zinc-500'
          }`}
          title={copied ? 'Copied!' : 'Copy'}
        >
          {copied
            ? <Check className="w-3 h-3 text-emerald-500" />
            : <Copy className="w-3 h-3" />
          }
        </button>
      </div>
      <pre
        className={`px-5 pb-5 pt-2 text-[11px] leading-relaxed font-mono whitespace-pre ${
          isLight ? 'text-zinc-600' : 'text-zinc-400'
        }`}
        style={{ fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace', tabSize: 2 }}
      >
        {source}
      </pre>
    </div>
  )
}

function ViewToggle({ showArc, onToggle, mode, inset = 12 }: {
  showArc: boolean
  onToggle: () => void
  mode: DiagramMode
  inset?: number
}) {
  const isLight = mode === 'light'
  const { Braces, Layers } = LucideIcons

  return (
    <button
      onClick={onToggle}
      style={{ top: inset, right: inset }}
      className={`absolute flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-sm z-10 text-[10px] font-mono transition-colors ${
        isLight
          ? 'bg-white/90 border border-zinc-200 shadow-sm text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
          : 'bg-zinc-900/90 border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
      }`}
      title={showArc ? 'Back to diagram' : 'View source'}
    >
      {showArc
        ? <><Layers className="w-3 h-3" /> Diagram</>
        : <><Braces className="w-3 h-3" /> Source</>
      }
    </button>
  )
}

function AutoLayoutButton({ active, onToggle, mode, inset = 12 }: {
  active: boolean
  onToggle: () => void
  mode: DiagramMode
  inset?: number
}) {
  const isLight = mode === 'light'
  const { Wand2 } = LucideIcons

  return (
    <button
      onClick={onToggle}
      style={{ top: inset, left: inset }}
      className={`absolute flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-sm z-10 text-[10px] font-mono transition-colors ${
        active
          ? isLight
            ? 'bg-violet-50 border border-violet-200 text-violet-600 shadow-sm'
            : 'bg-violet-950/80 border border-violet-700 text-violet-400'
          : isLight
            ? 'bg-white/90 border border-zinc-200 shadow-sm text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
            : 'bg-zinc-900/90 border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
      }`}
      title={active ? 'Reset to original layout' : 'Auto-layout nodes'}
    >
      <Wand2 className="w-3 h-3" /> Auto
    </button>
  )
}

// ============================================
// Main Component
// ============================================

// Grid motif rendered into an SVG <pattern> — varies the background grid system.
function gridMotif(type: BrandSpec['gridType'], s: number, color: string) {
  const c = s / 2
  if (type === 'lines') return <path d={`M ${s} 0 L 0 0 L 0 ${s}`} stroke={color} strokeWidth={1} fill="none" />
  if (type === 'crosshair') {
    const r = 3, tk = 2
    // Center plus + 1px registration ticks at the four cell-edge midpoints, so
    // cells read as a ruled reticle rather than scattered dots.
    return (
      <>
        <path d={`M ${c} ${c - r} L ${c} ${c + r} M ${c - r} ${c} L ${c + r} ${c}`} stroke={color} strokeWidth={1} />
        <path d={`M ${c} 0 L ${c} ${tk} M ${c} ${s} L ${c} ${s - tk} M 0 ${c} L ${tk} ${c} M ${s} ${c} L ${s - tk} ${c}`} stroke={color} strokeWidth={1} opacity={0.5} />
      </>
    )
  }
  return <circle cx={1} cy={1} r={1} fill={color} />
}

// Edge/frame treatments drawn as an inset overlay with a consistent margin, so
// the treatment reads as a deliberate frame rather than floating inside the
// container border (the container border is suppressed when one of these is active).
const FRAME_INSET = 12 // px margin/padding from the diagram edge

function DiagramFrame({ variant, color }: { variant: NonNullable<BrandSpec['frame']>; color: string }) {
  if (variant === 'hairline' || variant === 'none') return null
  const m = FRAME_INSET

  if (variant === 'inset') {
    return <div className="absolute pointer-events-none z-[6]" style={{ inset: m, border: `1px solid ${color}` }} />
  }

  if (variant === 'brackets') {
    // Flush at the diagram's boundary corners (no inset, no competing border).
    const len = 26, wt = 2
    const c = (extra: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', width: len, height: len, ...extra })
    return (
      <div className="absolute inset-0 pointer-events-none z-[6]">
        <div style={c({ top: 0, left: 0, borderTop: `${wt}px solid ${color}`, borderLeft: `${wt}px solid ${color}` })} />
        <div style={c({ top: 0, right: 0, borderTop: `${wt}px solid ${color}`, borderRight: `${wt}px solid ${color}` })} />
        <div style={c({ bottom: 0, left: 0, borderBottom: `${wt}px solid ${color}`, borderLeft: `${wt}px solid ${color}` })} />
        <div style={c({ bottom: 0, right: 0, borderBottom: `${wt}px solid ${color}`, borderRight: `${wt}px solid ${color}` })} />
      </div>
    )
  }

  if (variant === 'ticks') {
    const gap = 16
    const vert = `repeating-linear-gradient(to right, ${color} 0 1px, transparent 1px ${gap}px)`
    const horiz = `repeating-linear-gradient(to bottom, ${color} 0 1px, transparent 1px ${gap}px)`
    const e = (img: string, extra: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', backgroundImage: img, ...extra })
    return (
      <div className="absolute pointer-events-none z-[6]" style={{ inset: m, border: `1px solid ${color}33` }}>
        <div style={e(vert, { top: -3, left: 0, right: 0, height: 6 })} />
        <div style={e(vert, { bottom: -3, left: 0, right: 0, height: 6 })} />
        <div style={e(horiz, { top: 0, bottom: 0, left: -3, width: 6 })} />
        <div style={e(horiz, { top: 0, bottom: 0, right: -3, width: 6 })} />
      </div>
    )
  }

  if (variant === 'corners') {
    // Full, closed L-brackets at each corner — thin drafting-sheet treatment,
    // inset from the edge so the content reads as framed within a sheet.
    const len = 24, wt = 1
    const c = (extra: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', width: len, height: len, ...extra })
    return (
      <div className="absolute pointer-events-none z-[6]" style={{ inset: m }}>
        <div style={c({ top: 0, left: 0, borderTop: `${wt}px solid ${color}`, borderLeft: `${wt}px solid ${color}` })} />
        <div style={c({ top: 0, right: 0, borderTop: `${wt}px solid ${color}`, borderRight: `${wt}px solid ${color}` })} />
        <div style={c({ bottom: 0, left: 0, borderBottom: `${wt}px solid ${color}`, borderLeft: `${wt}px solid ${color}` })} />
        <div style={c({ bottom: 0, right: 0, borderBottom: `${wt}px solid ${color}`, borderRight: `${wt}px solid ${color}` })} />
      </div>
    )
  }

  if (variant === 'sheet') {
    // Full drafting-sheet border: a crisp rectangle inset from the edge, with a
    // faint inner rule a few px inside for the classic double-line drawing border.
    // Everything reads as framed on a sheet, with the title block seated in a corner.
    return (
      <div className="absolute pointer-events-none z-[6]" style={{ inset: m }}>
        <div className="absolute inset-0" style={{ border: `1px solid ${color}` }} />
        <div className="absolute" style={{ inset: 4, border: `1px solid ${color}`, opacity: 0.35 }} />
      </div>
    )
  }

  if (variant === 'cropmarks') {
    // Classic open-corner trim marks: a short tick on each edge near each corner,
    // leaving the corner itself open. Symmetric and pinned to the edges.
    const gap = 8, len = 14, wt = 1
    const seg = (s: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', background: color, ...s })
    return (
      <div className="absolute pointer-events-none z-[6]" style={{ inset: FRAME_INSET }}>
        <div style={seg({ top: 0, left: gap, width: len, height: wt })} />
        <div style={seg({ top: gap, left: 0, width: wt, height: len })} />
        <div style={seg({ top: 0, right: gap, width: len, height: wt })} />
        <div style={seg({ top: gap, right: 0, width: wt, height: len })} />
        <div style={seg({ bottom: 0, left: gap, width: len, height: wt })} />
        <div style={seg({ bottom: gap, left: 0, width: wt, height: len })} />
        <div style={seg({ bottom: 0, right: gap, width: len, height: wt })} />
        <div style={seg({ bottom: gap, right: 0, width: wt, height: len })} />
      </div>
    )
  }

  if (variant === 'reticle') {
    // Calibrated bezel: flush corner brackets + centered edge registration ticks +
    // a faint inset rule. FRAME_INSET (12px) is exactly half the 24px grid cell, so
    // the inset bezel lands on grid lines — intentional alignment with the reticle grid.
    const len = 26, wt = 1.5, tick = 8, tw = 1
    const c = (extra: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', width: len, height: len, ...extra })
    const t = (extra: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', background: color, ...extra })
    return (
      <div className="absolute inset-0 pointer-events-none z-[6]">
        <div className="absolute" style={{ inset: m, border: `1px solid ${color}`, opacity: 0.35 }} />
        <div style={c({ top: 0, left: 0, borderTop: `${wt}px solid ${color}`, borderLeft: `${wt}px solid ${color}` })} />
        <div style={c({ top: 0, right: 0, borderTop: `${wt}px solid ${color}`, borderRight: `${wt}px solid ${color}` })} />
        <div style={c({ bottom: 0, left: 0, borderBottom: `${wt}px solid ${color}`, borderLeft: `${wt}px solid ${color}` })} />
        <div style={c({ bottom: 0, right: 0, borderBottom: `${wt}px solid ${color}`, borderRight: `${wt}px solid ${color}` })} />
        <div style={t({ top: 0, left: '50%', width: tw, height: tick, transform: 'translateX(-50%)' })} />
        <div style={t({ bottom: 0, left: '50%', width: tw, height: tick, transform: 'translateX(-50%)' })} />
        <div style={t({ left: 0, top: '50%', width: tick, height: tw, transform: 'translateY(-50%)' })} />
        <div style={t({ right: 0, top: '50%', width: tick, height: tw, transform: 'translateY(-50%)' })} />
      </div>
    )
  }

  return null
}

/** Content for the engineering-drawing title block (Engineering theme). */
export interface TitleBlockInfo {
  /** Project / drawing title shown in the top strip. */
  title?: string
  /** Drawing number. Defaults to the diagram label (data.id). */
  drawing?: string
  /** Scale field. Default 'NTS'. */
  scale?: string
  /** Revision field. Default 'A'. */
  rev?: string
  /** Sheet field. Default '1 / 1'. */
  sheet?: string
}

// Engineering-drawing title block, pinned to the bottom-right of the sheet.
// `bottom` is raised when zoom controls share the corner, so it stacks above them.
function TitleBlock({ info, mode, mono, bottom = 16, right = 16, onHeight }: { info: Required<TitleBlockInfo>; mode: DiagramMode; mono?: string; bottom?: number; right?: number; onHeight?: (h: number) => void }) {
  const isLight = mode === 'light'
  const line = isLight ? 'rgba(20,20,20,0.45)' : 'rgba(220,226,235,0.36)'
  const label = isLight ? 'rgba(20,20,20,0.5)' : 'rgba(205,214,228,0.5)'
  const value = isLight ? 'rgba(16,20,26,0.9)' : 'rgba(236,240,246,0.92)'
  const font = mono || "'JetBrains Mono', ui-monospace, monospace"
  const cells: [string, string][] = [
    ['DWG NO', info.drawing],
    ['SCALE', info.scale],
    ['REV', info.rev],
    ['SHEET', info.sheet],
  ]
  // Report the rendered height so neighbouring chrome (the zoom controls) can
  // position itself clear of the title block, re-measuring on font load / resize.
  const ref = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el || !onHeight) return
    onHeight(el.offsetHeight)
    const ro = new ResizeObserver(() => onHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [onHeight])
  return (
    <div
      ref={ref}
      className="absolute z-10 pointer-events-none"
      style={{
        right, bottom, fontFamily: font,
        border: `1px solid ${line}`,
        background: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(10,14,20,0.5)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div style={{ padding: '4px 10px', borderBottom: `1px solid ${line}`, color: value, fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {info.title}
      </div>
      <div style={{ display: 'flex' }}>
        {cells.map(([k, v], i) => (
          <div key={k} style={{ padding: '3px 10px 4px', borderLeft: i === 0 ? 'none' : `1px solid ${line}` }}>
            <div style={{ color: label, fontSize: 6.5, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{k}</div>
            <div style={{ color: value, fontSize: 10.5, letterSpacing: '0.03em', marginTop: 1, whiteSpace: 'nowrap' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export type LabelCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface ArcDiagramProps {
  data: ArcDiagramData
  className?: string
  interactive?: boolean  // Enable zoom/pan controls
  mode?: DiagramMode     // Light/dark appearance
  theme?: ThemeId        // Color palette theme
  /** Override the diagram label. Defaults to data.id */
  label?: string
  /** Which corner the label sits in. Default: 'top-left'. Zoom controls auto-avoid it. */
  labelPosition?: LabelCorner
  /** Initial zoom level. Use 'fit' to auto-fit content, or a number (e.g., 0.75). Default: 1 */
  defaultZoom?: number | 'fit'
  /** Max zoom when defaultZoom='fit'. E.g., 0.85 caps fit at 85%. Default: 1 */
  maxFitZoom?: number
  /** Custom zoom level steps. Default: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] */
  zoomLevels?: number[]
  /** Show the .arc source toggle button. Default: true */
  showArcToggle?: boolean
  /** Show the auto-layout button. Default: false */
  showAutoLayout?: boolean
  /** Show zoom controls even when not interactive (branded reader chrome). Default: follows `interactive` */
  showControls?: boolean
  /** Show a minimap overview (bottom-left). Default: false */
  showMinimap?: boolean
  /** Override the edge/frame treatment (else the theme's brand.frame). */
  frame?: BrandSpec['frame']
  /** Control hover behavior. true = all effects (default), false = none, object = granular control */
  hoverEffects?: boolean | HoverEffectsConfig
  /** Called when a node is hovered/clicked (nodeId) or released (null) */
  onNodeHover?: (nodeId: string | null) => void
  /** Override the engineering title-block fields (shown when the theme opts in). */
  titleBlock?: TitleBlockInfo
}

export default function ArcDiagram({
  data,
  className = '',
  interactive = true,
  mode = 'dark',
  theme = 'default',
  label,
  labelPosition = 'top-left',
  defaultZoom = 1,
  zoomLevels = DEFAULT_ZOOM_LEVELS,
  showArcToggle = true,
  showAutoLayout = false,
  showControls,
  showMinimap = false,
  frame,
  hoverEffects,
  onNodeHover,
  titleBlock,
  maxFitZoom = 1,
}: ArcDiagramProps) {
  const isLight = mode === 'light'
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [showArc, setShowArc] = useState(false)
  const [useAutoLayout, setUseAutoLayout] = useState(false)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [lockedNodeId, setLockedNodeId] = useState<string | null>(null)
  // Measured title-block height, so the zoom controls can slide clear of it.
  const [titleBlockH, setTitleBlockH] = useState(48)
  const fx = useMemo(() => resolveHoverEffects(hoverEffects), [hoverEffects])

  // Active node = locked takes priority over hovered
  const activeNodeId = fx.enabled ? (lockedNodeId ?? hoveredNodeId) : null

  // Apply auto-layout if toggled
  const activeData = useMemo(
    () => useAutoLayout ? autoLayout(data as any) as unknown as ArcDiagramData : data,
    [data, useAutoLayout],
  )

  const { id, layout, nodes, nodeData, connectors, connectorStyles } = activeData

  // Resolve theme colors based on mode
  const themeData = getTheme(theme)
  const themeColors = isLight ? themeData.light : themeData.dark
  const brand = themeData.brand
  const gridId = React.useId()
  const frameVariant = frame ?? brand?.frame ?? 'hairline'

  // Inject the brand font stylesheet once (only for themes that set a fontImport).
  React.useEffect(() => {
    const href = brand?.fontImport
    if (!href || typeof document === 'undefined') return
    if (document.querySelector(`link[data-arc-font="${href}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.setAttribute('data-arc-font', href)
    document.head.appendChild(link)
  }, [brand?.fontImport])

  // Generate source from the active (possibly auto-laid-out) data
  const sourceCode = useMemo(() => generateSource(activeData), [activeData])

  // Calculate 'fit' zoom based on container size
  const calculateFitZoom = useCallback(() => {
    if (!containerRef.current) return 1
    const container = containerRef.current
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    // Add padding for chrome (zoom controls, label)
    const padding = 40
    const fitX = (containerWidth - padding) / layout.width
    const fitY = (containerHeight - padding) / layout.height
    // Use the smaller ratio to fit both dimensions, cap at maxFitZoom
    return Math.min(fitX, fitY, maxFitZoom)
  }, [layout.width, layout.height, maxFitZoom])

  // Determine initial zoom
  const getInitialZoom = useCallback(() => {
    if (defaultZoom === 'fit') {
      return calculateFitZoom()
    }
    return defaultZoom
  }, [defaultZoom, calculateFitZoom])

  // Zoom & pan state — use defaultZoom immediately for numeric values to avoid flash
  const [zoom, setZoom] = useState(typeof defaultZoom === 'number' ? defaultZoom : 1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [initialized, setInitialized] = useState(typeof defaultZoom === 'number')

  // Set initial zoom after mount (needed for 'fit' to measure container)
  React.useEffect(() => {
    if (!initialized) {
      setZoom(getInitialZoom())
      setInitialized(true)
    }
  }, [initialized, getInitialZoom])

  // Sorted zoom levels for consistent navigation
  const sortedZoomLevels = React.useMemo(() => [...zoomLevels].sort((a, b) => a - b), [zoomLevels])

  const handleZoomIn = useCallback(() => {
    setZoom(z => {
      const idx = sortedZoomLevels.findIndex(l => l >= z)
      return sortedZoomLevels[Math.min(idx + 1, sortedZoomLevels.length - 1)]
    })
  }, [sortedZoomLevels])

  const handleZoomOut = useCallback(() => {
    setZoom(z => {
      const idx = sortedZoomLevels.findIndex(l => l >= z)
      return sortedZoomLevels[Math.max(idx - 1, 0)]
    })
  }, [sortedZoomLevels])

  const handleReset = useCallback(() => {
    setZoom(getInitialZoom())
    setPan({ x: 0, y: 0 })
  }, [getInitialZoom])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!interactive) return
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      if (e.deltaY < 0) handleZoomIn()
      else handleZoomOut()
    }
  }, [interactive, handleZoomIn, handleZoomOut])

  // Click-to-lock: clicking a node locks the highlight, clicking background or same node unlocks
  const handleNodeClick = useCallback((nodeId: string) => {
    setLockedNodeId(prev => {
      const next = prev === nodeId ? null : nodeId
      onNodeHover?.(next)
      return next
    })
  }, [onNodeHover])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!interactive) return
    // Clicking background clears locked node
    if (lockedNodeId && (e.target as HTMLElement).closest('[data-arc-node]') === null) {
      setLockedNodeId(null)
      onNodeHover?.(null)
    }
    setIsPanning(true)
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }, [interactive, pan, lockedNodeId, onNodeHover])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    })
  }, [isPanning, panStart])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Displayed label: prop overrides data.id
  const displayLabel = label ?? id

  // Chrome inset: when a full-rectangle frame border is drawn, the floating
  // chrome (source toggle, minimap, label, zoom, title block) sits INSIDE the
  // border with a gap instead of welding to the container edge. Otherwise it
  // hugs the edge at the usual 12px.
  const borderedFrame = frameVariant === 'sheet' || frameVariant === 'inset'
  const chromeInset = borderedFrame ? 28 : 12

  const showTitleBlock = !!brand?.titleBlock && !showArc
  const showLabel = !!displayLabel && !brand?.titleBlock
  const zoomShown = (interactive || showControls) && !showArc

  // The bottom-right corner belongs to "content" — the title block (a drawing
  // element) or a bottom-right label — which anchors there. The zoom controls
  // are utility chrome: they're the ones that yield, sliding up to clear that
  // content (measured height for the title block, ~one line for a label).
  const brLabel = showLabel && labelPosition === 'bottom-right'
  const cornerContentH = showTitleBlock ? titleBlockH : (brLabel ? 14 : 0)
  const zoomBottom = chromeInset + (zoomShown && cornerContentH ? cornerContentH + 10 : 0)

  // Declarative label placement resolved to pixel offsets (respects the frame inset).
  const labelStyle: React.CSSProperties = {
    ...(labelPosition.includes('top') ? { top: chromeInset } : { bottom: chromeInset }),
    ...(labelPosition.includes('left') ? { left: chromeInset } : { right: chromeInset }),
  }

  return (
    <div
      ref={containerRef}
      data-arc-diagram
      className={`rounded-2xl overflow-hidden relative ${themeColors.background.container} ${className}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: interactive ? (isPanning ? 'grabbing' : 'grab') : 'default', fontFamily: brand?.fontFamily, borderRadius: brand?.nodeRadius, borderColor: frameVariant !== 'hairline' && frameVariant !== 'none' ? 'transparent' : undefined }}
    >
      <div
        className="relative transition-transform duration-150 ease-out"
        style={{
          width: layout.width,
          height: layout.height,
          minWidth: layout.width,
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'top left',
        }}
      >
        {/* Grid background - extends beyond content for pan */}
        {brand?.gridType !== 'none' && (
          <svg
            className="absolute pointer-events-none"
            style={{
              top: -2000,
              left: -2000,
              width: layout.width + 4000,
              height: layout.height + 4000,
              opacity: themeColors.background.grid.opacity,
            }}
          >
            <defs>
              <pattern id={gridId} width={themeColors.background.grid.size} height={themeColors.background.grid.size} patternUnits="userSpaceOnUse">
                {gridMotif(brand?.gridType, themeColors.background.grid.size, themeColors.background.grid.color)}
              </pattern>
              {brand?.gridType === 'crosshair' && (() => {
                // Major graticule at 5× the cell — a longer, heavier crosshair every
                // fifth line for a minor/major rhythm. Origin-aligned so major marks
                // land on minor crosshair centers. Crosshair-only; other grids untouched.
                const M = themeColors.background.grid.size * 5, C = M / 2, r = 5
                return (
                  <pattern id={`${gridId}-major`} width={M} height={M} patternUnits="userSpaceOnUse">
                    <path d={`M ${C} ${C - r} L ${C} ${C + r} M ${C - r} ${C} L ${C + r} ${C}`} stroke={themeColors.background.grid.color} strokeWidth={1} />
                  </pattern>
                )
              })()}
            </defs>
            <rect width="100%" height="100%" fill={`url(#${gridId})`} />
            {brand?.gridType === 'crosshair' && <rect width="100%" height="100%" fill={`url(#${gridId}-major)`} />}
          </svg>
        )}

        {/* Connectors */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
        >
          {connectors.map((conn, i) => {
            const isConnected = activeNodeId != null && (conn.from === activeNodeId || conn.to === activeNodeId)
            return (
              <ConnectorPath
                key={i}
                connector={conn}
                connectorIndex={i}
                nodes={nodes}
                styles={connectorStyles}
                themeColors={themeColors}
                brand={brand}
                highlighted={fx.highlightEdges && isConnected}
                dimmed={fx.dim && activeNodeId != null && !isConnected}
                dimOpacity={fx.connectorDimOpacity}
              />
            )
          })}
        </svg>

        {/* Nodes */}
        {Object.entries(nodes).map(([nodeId, node]) => {
          const nd = nodeData[nodeId]
          if (!nd) return null
          const isActive = activeNodeId === nodeId
          return (
            <Node
              key={nodeId}
              node={node}
              data={nd}
              mode={mode}
              themeColors={themeColors}
              brand={brand}
              hovered={isActive}
              dimmed={fx.dim && activeNodeId != null && !isActive}
              lift={fx.lift}
              glow={fx.glow}
              dimOpacity={fx.dimOpacity}
              onMouseEnter={() => { if (!lockedNodeId) { setHoveredNodeId(nodeId); onNodeHover?.(nodeId) } }}
              onMouseLeave={() => { if (!lockedNodeId) { setHoveredNodeId(null); onNodeHover?.(null) } }}
              onClick={() => handleNodeClick(nodeId)}
            />
          )
        })}
      </div>

      {/* Viewer chrome - fixed position regardless of zoom/pan */}

      {/* Edge/frame treatment at the diagram boundary */}
      <DiagramFrame variant={frameVariant} color={isLight ? 'rgba(20,20,20,0.55)' : 'rgba(230,230,235,0.55)'} />

      {/* Engineering title block - bottom right (theme opt-in) */}
      {brand?.titleBlock && !showArc && (
        <TitleBlock
          mode={mode}
          mono={brand.monoFamily}
          right={chromeInset}
          bottom={chromeInset}
          onHeight={setTitleBlockH}
          info={{
            title: titleBlock?.title ?? 'System Architecture',
            drawing: titleBlock?.drawing ?? displayLabel ?? '—',
            scale: titleBlock?.scale ?? 'NTS',
            rev: titleBlock?.rev ?? 'A',
            sheet: titleBlock?.sheet ?? '1 / 1',
          }}
        />
      )}


      {/* .arc source overlay */}
      {showArc && (
        <ArcSourceView source={sourceCode} mode={mode} />
      )}

      {/* .arc toggle - top right */}
      {showArcToggle && (
        <ViewToggle
          showArc={showArc}
          onToggle={() => setShowArc(s => !s)}
          mode={mode}
          inset={chromeInset}
        />
      )}

      {/* Auto-layout button - top left */}
      {showAutoLayout && !showArc && (
        <AutoLayoutButton
          active={useAutoLayout}
          onToggle={() => setUseAutoLayout(v => !v)}
          mode={mode}
          inset={chromeInset}
        />
      )}

      {/* Diagram label - bottom left (hidden when the title block already shows the drawing no.) */}
      {showLabel && (
        <div
          className={`absolute font-mono text-[9px] tracking-wider z-10 ${themeColors.text.muted}`}
          style={{ fontFamily: brand?.monoFamily, ...labelStyle }}
        >
          {displayLabel}
        </div>
      )}

      {/* Minimap - bottom left */}
      {showMinimap && !showArc && (
        <MiniMap
          nodes={nodes}
          nodeData={nodeData}
          layout={layout}
          themeColors={themeColors}
          brand={brand}
          mode={mode}
          inset={chromeInset}
        />
      )}

      {/* Zoom controls - bottom right */}
      {(interactive || showControls) && !showArc && (
        <ZoomControls
          zoom={zoom}
          zoomLevels={sortedZoomLevels}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
          mode={mode}
          brand={brand}
          right={chromeInset}
          bottom={zoomBottom}
        />
      )}
    </div>
  )
}
