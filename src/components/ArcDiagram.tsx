"use client"
import React, { useState, useCallback } from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getTheme, type ThemeId, type Theme } from '../utils/themes'

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
}

function Node({ node, data, mode, themeColors }: NodeProps) {
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
      `}
      style={{ left: node.x, top: node.y, width: size.width }}
    >
      <div className="flex items-center gap-3">
        <div className={`
          flex-shrink-0 rounded-lg
          ${isLight ? 'border border-zinc-200 bg-white shadow-sm' : 'border border-zinc-700 bg-zinc-900'}
          ${isLarge ? 'w-10 h-10' : isSmall ? 'w-6 h-6' : 'w-8 h-8'}
          flex items-center justify-center
        `}>
          <Icon className={`${isLarge ? 'w-5 h-5' : isSmall ? 'w-3 h-3' : 'w-4 h-4'} ${color.icon}`} />
        </div>
        <div className="min-w-0">
          <div className={`font-semibold ${themeColors.text.primary} ${isLarge ? 'text-sm' : isSmall ? 'text-[10px]' : 'text-xs'}`}>
            {data.name}
          </div>
          {data.subtitle && (
            <div className={`font-mono ${themeColors.text.muted} ${isSmall ? 'text-[8px]' : 'text-[10px]'}`}>
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
}

function ConnectorPath({ connector, connectorIndex, nodes, styles, themeColors }: ConnectorProps) {
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

const DEFAULT_ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]

interface ZoomControlsProps {
  zoom: number
  zoomLevels: number[]
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  mode: DiagramMode
}

function ZoomControls({ zoom, zoomLevels, onZoomIn, onZoomOut, onReset, mode }: ZoomControlsProps) {
  const { ZoomIn, ZoomOut } = LucideIcons
  const isLight = mode === 'light'

  return (
    <div className={`absolute bottom-3 right-3 flex items-center backdrop-blur-sm rounded-md z-10 ${
      isLight
        ? 'bg-white/90 border border-zinc-200 shadow-sm'
        : 'bg-zinc-900/90 border border-zinc-700'
    }`}>
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
// Main Component
// ============================================

interface ArcDiagramProps {
  data: ArcDiagramData
  className?: string
  interactive?: boolean  // Enable zoom/pan controls
  mode?: DiagramMode     // Light/dark appearance
  theme?: ThemeId        // Color palette theme
  /** Override the diagram label (bottom-left). Defaults to data.id */
  label?: string
  /** Initial zoom level. Use 'fit' to auto-fit content, or a number (e.g., 0.75). Default: 1 */
  defaultZoom?: number | 'fit'
  /** Custom zoom level steps. Default: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] */
  zoomLevels?: number[]
}

export default function ArcDiagram({
  data,
  className = '',
  interactive = true,
  mode = 'dark',
  theme = 'default',
  label,
  defaultZoom = 1,
  zoomLevels = DEFAULT_ZOOM_LEVELS,
}: ArcDiagramProps) {
  const { id, layout, nodes, nodeData, connectors, connectorStyles } = data
  const isLight = mode === 'light'
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Resolve theme colors based on mode
  const themeData = getTheme(theme)
  const themeColors = isLight ? themeData.light : themeData.dark

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
    // Use the smaller ratio to fit both dimensions, cap at 1 (100%)
    return Math.min(fitX, fitY, 1)
  }, [layout.width, layout.height])

  // Determine initial zoom
  const getInitialZoom = useCallback(() => {
    if (defaultZoom === 'fit') {
      return calculateFitZoom()
    }
    return defaultZoom
  }, [defaultZoom, calculateFitZoom])

  // Zoom & pan state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [initialized, setInitialized] = useState(false)

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

  // Displayed label: prop overrides data.id
  const displayLabel = label ?? id

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl overflow-hidden relative ${themeColors.background.container} ${className}`}
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
          className="absolute"
          style={{
            top: -2000,
            left: -2000,
            width: layout.width + 4000,
            height: layout.height + 4000,
            backgroundImage: `radial-gradient(circle, ${themeColors.background.grid.color} 1px, transparent 1px)`,
            backgroundSize: `${themeColors.background.grid.size}px ${themeColors.background.grid.size}px`,
            opacity: themeColors.background.grid.opacity,
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
              themeColors={themeColors}
            />
          ))}
        </svg>

        {/* Nodes */}
        {Object.entries(nodes).map(([nodeId, node]) => {
          const data = nodeData[nodeId]
          if (!data) return null  // Skip nodes without data
          return <Node key={nodeId} node={node} data={data} mode={mode} themeColors={themeColors} />
        })}
      </div>

      {/* Viewer chrome - fixed position regardless of zoom/pan */}

      {/* Diagram label - bottom left */}
      {displayLabel && (
        <div className={`absolute bottom-3 left-3 font-mono text-[9px] tracking-wider z-10 ${themeColors.text.muted}`}>
          {displayLabel}
        </div>
      )}

      {/* Zoom controls - bottom right */}
      {interactive && (
        <ZoomControls
          zoom={zoom}
          zoomLevels={sortedZoomLevels}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
          mode={mode}
        />
      )}
    </div>
  )
}
