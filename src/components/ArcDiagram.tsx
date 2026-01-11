"use client"
import React, { useState, useCallback } from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ============================================
// Types
// ============================================

export type NodeSize = 's' | 'm' | 'l'
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
// Constants
// ============================================

const NODE_SIZES: Record<NodeSize, { width: number; height: number }> = {
  l: { width: 200, height: 80 },
  m: { width: 140, height: 65 },
  s: { width: 90, height: 40 },
}

const COLORS: Record<DiagramColor, { border: string; bg: string; icon: string; stroke: string }> = {
  violet:  { border: 'border-violet-400/50',  bg: 'bg-violet-500/10',  icon: 'text-violet-400',  stroke: '#a78bfa' },
  emerald: { border: 'border-emerald-400/50', bg: 'bg-emerald-500/10', icon: 'text-emerald-400', stroke: '#34d399' },
  blue:    { border: 'border-blue-400/50',    bg: 'bg-blue-500/10',    icon: 'text-blue-400',    stroke: '#60a5fa' },
  amber:   { border: 'border-amber-400/50',   bg: 'bg-amber-500/10',   icon: 'text-amber-400',   stroke: '#fbbf24' },
  sky:     { border: 'border-sky-400/50',     bg: 'bg-sky-500/10',     icon: 'text-sky-400',     stroke: '#38bdf8' },
  zinc:    { border: 'border-zinc-600',       bg: 'bg-zinc-800/50',    icon: 'text-zinc-400',    stroke: '#71717a' },
  rose:    { border: 'border-rose-400/50',    bg: 'bg-rose-500/10',    icon: 'text-rose-400',    stroke: '#fb7185' },
  orange:  { border: 'border-orange-400/50',  bg: 'bg-orange-500/10',  icon: 'text-orange-400',  stroke: '#fb923c' },
}

// ============================================
// Components
// ============================================

interface NodeProps {
  node: NodePosition
  data: NodeData
}

function Node({ node, data }: NodeProps) {
  const size = NODE_SIZES[node.size]
  const color = COLORS[data.color] || COLORS.zinc
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[data.icon] || LucideIcons.Box

  const isLarge = node.size === 'l'
  const isSmall = node.size === 's'

  return (
    <div
      className={`
        absolute rounded-xl border-2 ${color.border} ${color.bg}
        ${isLarge ? 'px-5 py-3' : isSmall ? 'px-3 py-2' : 'px-4 py-2.5'}
        bg-zinc-900/90 backdrop-blur-sm
      `}
      style={{ left: node.x, top: node.y, width: size.width }}
    >
      <div className="flex items-center gap-3">
        <div className={`
          flex-shrink-0 rounded-lg border border-zinc-700 bg-zinc-900
          ${isLarge ? 'w-10 h-10' : isSmall ? 'w-6 h-6' : 'w-8 h-8'}
          flex items-center justify-center
        `}>
          <Icon className={`${isLarge ? 'w-5 h-5' : isSmall ? 'w-3 h-3' : 'w-4 h-4'} ${color.icon}`} />
        </div>
        <div className="min-w-0">
          <div className={`font-semibold text-white ${isLarge ? 'text-sm' : isSmall ? 'text-[10px]' : 'text-xs'}`}>
            {data.name}
          </div>
          {data.subtitle && (
            <div className={`font-mono text-zinc-500 ${isSmall ? 'text-[8px]' : 'text-[10px]'}`}>
              {data.subtitle}
            </div>
          )}
        </div>
      </div>
      {data.description && !isSmall && (
        <div className={`mt-1.5 text-zinc-400 ${isLarge ? 'text-[11px]' : 'text-[10px]'}`}>
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
}

function ConnectorPath({ connector, connectorIndex, nodes, styles }: ConnectorProps) {
  const fromNode = nodes[connector.from]
  const toNode = nodes[connector.to]
  if (!fromNode || !toNode) return null

  const style = styles[connector.style] || { color: 'zinc', strokeWidth: 2 }
  const from = getAnchorPoint(fromNode, connector.fromAnchor)
  const to = getAnchorPoint(toNode, connector.toAnchor)
  const color = COLORS[style.color]?.stroke || COLORS.zinc.stroke
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
    <g>
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
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="15%" stopColor={color} stopOpacity={1} />
          <stop offset="85%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0.5} />
        </linearGradient>
      </defs>

      {/* Main path with gradient */}
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.dashed ? '6 3' : undefined}
      />

      {/* Arrow head - triangle at end point */}
      <g transform={`translate(${to.x}, ${to.y}) rotate(${angle})`}>
        <polygon
          points={`0,0 ${-arrowSize},-${arrowSize/2.5} ${-arrowSize},${arrowSize/2.5}`}
          fill={color}
        />
      </g>

      {/* Label */}
      {style.label && (
        <text
          x={labelPos.x + labelOffset.x}
          y={labelPos.y + labelOffset.y}
          textAnchor={textAnchor}
          fill={color}
          className="text-[10px] font-mono"
          style={{ fontFamily: 'ui-monospace, monospace' }}
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

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2]

interface ZoomControlsProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  const { ZoomIn, ZoomOut } = LucideIcons

  return (
    <div className="absolute bottom-3 right-3 flex items-center bg-zinc-900/90 backdrop-blur-sm rounded-md border border-zinc-700 z-10">
      <button
        onClick={onZoomOut}
        disabled={zoom <= ZOOM_LEVELS[0]}
        className="p-1 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-l-md"
        title="Zoom out"
      >
        <ZoomOut className="w-3 h-3 text-zinc-400" />
      </button>
      <button
        onClick={onReset}
        className="px-1.5 py-1 text-[9px] font-mono text-zinc-400 hover:bg-zinc-700 transition-colors min-w-[36px] border-x border-zinc-700"
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        onClick={onZoomIn}
        disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
        className="p-1 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-r-md"
        title="Zoom in"
      >
        <ZoomIn className="w-3 h-3 text-zinc-400" />
      </button>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

interface ArcDiagramProps {
  data: ArcDiagramData
  className?: string
  interactive?: boolean  // Enable zoom/pan controls
}

export default function ArcDiagram({ data, className = '', interactive = true }: ArcDiagramProps) {
  const { id, layout, nodes, nodeData, connectors, connectorStyles } = data

  // Zoom & pan state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  const handleZoomIn = useCallback(() => {
    setZoom(z => {
      const idx = ZOOM_LEVELS.findIndex(l => l >= z)
      return ZOOM_LEVELS[Math.min(idx + 1, ZOOM_LEVELS.length - 1)]
    })
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(z => {
      const idx = ZOOM_LEVELS.findIndex(l => l >= z)
      return ZOOM_LEVELS[Math.max(idx - 1, 0)]
    })
  }, [])

  const handleReset = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!interactive) return
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      if (e.deltaY < 0) handleZoomIn()
      else handleZoomOut()
    }
  }, [interactive, handleZoomIn, handleZoomOut])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!interactive) return
    setIsPanning(true)
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }, [interactive, pan])

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

  return (
    <div
      className={`rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden relative ${className}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: interactive ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
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
        <div
          className="absolute opacity-[0.08]"
          style={{
            top: -2000,
            left: -2000,
            width: layout.width + 4000,
            height: layout.height + 4000,
            backgroundImage: 'radial-gradient(circle, #71717a 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Connectors */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
        >
          {connectors.map((conn, i) => (
            <ConnectorPath
              key={i}
              connector={conn}
              connectorIndex={i}
              nodes={nodes}
              styles={connectorStyles}
            />
          ))}
        </svg>

        {/* Nodes */}
        {Object.entries(nodes).map(([nodeId, node]) => (
          <Node key={nodeId} node={node} data={nodeData[nodeId]} />
        ))}
      </div>

      {/* Viewer chrome - fixed position regardless of zoom/pan */}

      {/* Diagram ID - bottom left */}
      {id && (
        <div className="absolute bottom-3 left-3 font-mono text-[9px] text-zinc-600 tracking-wider z-10">
          {id}
        </div>
      )}

      {/* Zoom controls - bottom right */}
      {interactive && (
        <ZoomControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
