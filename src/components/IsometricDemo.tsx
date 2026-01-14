import { useState, useRef } from 'react'
import { isoToScreen, isoBox, getColorShading, screenToIsoFloor } from '../utils/isometric'
import { Monitor, Database, Globe, Cpu } from 'lucide-react'
import ThreeRenderer from './ThreeRenderer'

interface DemoNode {
  id: string
  x: number
  y: number
  elevation: number
  width: number
  depth: number
  height: number
  color: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const INITIAL_NODES: DemoNode[] = [
  { id: 'client', x: 0, y: 0, elevation: 0, width: 80, depth: 50, height: 20, color: 'blue', label: 'Client', icon: Monitor },
  { id: 'api', x: 120, y: 0, elevation: 0, width: 90, depth: 55, height: 25, color: 'violet', label: 'API', icon: Globe },
  { id: 'service', x: 250, y: 0, elevation: 0, width: 80, depth: 50, height: 20, color: 'cyan', label: 'Service', icon: Cpu },
  { id: 'db', x: 250, y: 100, elevation: 0, width: 80, depth: 50, height: 18, color: 'emerald', label: 'Database', icon: Database },
]

const CONNECTORS = [
  { from: 'client', to: 'api' },
  { from: 'api', to: 'service' },
  { from: 'service', to: 'db' },
]

// ============================================
// EXCEL-LIKE COORDINATE TABLE
// ============================================

function CoordinateTable({
  nodes,
  onChange,
  showZ = true
}: {
  nodes: DemoNode[]
  onChange: (id: string, field: string, value: number) => void
  showZ?: boolean
}) {
  return (
    <div className="border border-slate-600 rounded overflow-hidden">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-800">
            <th className="border-r border-b border-slate-600 px-3 py-2 text-left font-medium text-slate-400 w-24">Node</th>
            <th className="border-r border-b border-slate-600 px-2 py-2 text-center font-medium text-red-400 w-16">X</th>
            <th className="border-r border-b border-slate-600 px-2 py-2 text-center font-medium text-green-400 w-16">Y</th>
            {showZ && <th className="border-r border-b border-slate-600 px-2 py-2 text-center font-medium text-blue-400 w-16">Z</th>}
            <th className="border-b border-slate-600 px-2 py-2 text-center font-medium text-slate-400 w-16">H</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node, i) => {
            const shading = getColorShading(node.color as any)
            const isLast = i === nodes.length - 1
            return (
              <tr key={node.id} className="bg-slate-900 hover:bg-slate-850">
                <td className={`border-r ${!isLast ? 'border-b' : ''} border-slate-700 px-3 py-1.5`}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: shading.top }}
                    />
                    <span className="text-slate-300 truncate">{node.label}</span>
                  </div>
                </td>
                <td className={`border-r ${!isLast ? 'border-b' : ''} border-slate-700 p-0`}>
                  <input
                    type="number"
                    value={node.x}
                    onChange={(e) => onChange(node.id, 'x', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 text-slate-200 text-center py-1.5 px-1 border-0 focus:bg-slate-700 focus:outline-none"
                  />
                </td>
                <td className={`border-r ${!isLast ? 'border-b' : ''} border-slate-700 p-0`}>
                  <input
                    type="number"
                    value={node.y}
                    onChange={(e) => onChange(node.id, 'y', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 text-slate-200 text-center py-1.5 px-1 border-0 focus:bg-slate-700 focus:outline-none"
                  />
                </td>
                {showZ && (
                  <td className={`border-r ${!isLast ? 'border-b' : ''} border-slate-700 p-0`}>
                    <input
                      type="number"
                      value={node.elevation}
                      onChange={(e) => onChange(node.id, 'elevation', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-800 text-slate-200 text-center py-1.5 px-1 border-0 focus:bg-slate-700 focus:outline-none"
                    />
                  </td>
                )}
                <td className={`${!isLast ? 'border-b' : ''} border-slate-700 p-0`}>
                  <input
                    type="number"
                    value={node.height}
                    onChange={(e) => onChange(node.id, 'height', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 text-slate-400 text-center py-1.5 px-1 border-0 focus:bg-slate-700 focus:outline-none"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ============================================
// 2D TOP-DOWN VIEW
// ============================================

function TopDown2DCanvas({
  nodes,
  onNodeMove
}: {
  nodes: DemoNode[]
  onNodeMove: (id: string, x: number, y: number) => void
}) {
  const SCALE = 1.5
  const ORIGIN_X = 80  // Where (0,0) is on screen
  const ORIGIN_Y = 280 // Y=0 is near bottom, Y increases upward
  const GRID_SIZE = 50
  const CANVAS_WIDTH = 1200
  const CANVAS_HEIGHT = 320

  const [dragState, setDragState] = useState<{
    nodeId: string
    startX: number
    startY: number
    nodeStartX: number
    nodeStartY: number
  } | null>(null)

  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.id] = node
    return acc
  }, {} as Record<string, DemoNode>)

  // Transform: Y increases upward (flip Y)
  const toScreen = (x: number, y: number) => ({
    sx: ORIGIN_X + x * SCALE,
    sy: ORIGIN_Y - y * SCALE  // Flip Y so it goes up
  })

  const handlePointerDown = (e: React.PointerEvent, nodeId: string) => {
    e.preventDefault()
    const node = nodeMap[nodeId]
    if (!node) return

    ;(e.target as Element).setPointerCapture(e.pointerId)
    setDragState({
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
    })
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return

    const deltaScreenX = e.clientX - dragState.startX
    const deltaScreenY = e.clientY - dragState.startY

    // Convert screen delta to 2D coords (Y is flipped)
    const deltaX = deltaScreenX / SCALE
    const deltaY = -deltaScreenY / SCALE  // Flip Y

    const newX = Math.round(dragState.nodeStartX + deltaX)
    const newY = Math.round(dragState.nodeStartY + deltaY)

    onNodeMove(dragState.nodeId, newX, newY)
  }

  const handlePointerUp = () => {
    setDragState(null)
  }

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden">
      <svg
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={dragState ? 'cursor-grabbing' : ''}
      >
        {/* Grid lines with labels */}
        {Array.from({ length: 15 }).map((_, i) => {
          const xVal = i * GRID_SIZE
          const { sx } = toScreen(xVal, 0)
          if (sx > CANVAS_WIDTH - 20) return null
          return (
            <g key={`vline-${i}`}>
              <line
                x1={sx} y1={20} x2={sx} y2={CANVAS_HEIGHT - 20}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
              {i > 0 && (
                <text x={sx} y={CANVAS_HEIGHT - 8} textAnchor="middle" className="fill-slate-600 text-[9px]">
                  {xVal}
                </text>
              )}
            </g>
          )
        })}
        {Array.from({ length: 7 }).map((_, i) => {
          const yVal = i * GRID_SIZE
          const { sy } = toScreen(0, yVal)
          if (sy < 20) return null
          return (
            <g key={`hline-${i}`}>
              <line
                x1={40} y1={sy} x2={CANVAS_WIDTH - 40} y2={sy}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
              {i > 0 && (
                <text x={32} y={sy + 3} textAnchor="end" className="fill-slate-600 text-[9px]">
                  {yVal}
                </text>
              )}
            </g>
          )
        })}

        {/* Axes at origin */}
        <g>
          {/* X axis (red) - pointing right */}
          <line x1={ORIGIN_X} y1={ORIGIN_Y} x2={CANVAS_WIDTH - 80} y2={ORIGIN_Y} stroke="#f87171" strokeWidth="2" />
          <polygon points={`${CANVAS_WIDTH - 80},${ORIGIN_Y} ${CANVAS_WIDTH - 90},${ORIGIN_Y - 5} ${CANVAS_WIDTH - 90},${ORIGIN_Y + 5}`} fill="#f87171" />
          <text x={CANVAS_WIDTH - 68} y={ORIGIN_Y + 4} className="fill-red-400 text-[11px] font-bold">X</text>

          {/* Y axis (green) - pointing up */}
          <line x1={ORIGIN_X} y1={ORIGIN_Y} x2={ORIGIN_X} y2={30} stroke="#4ade80" strokeWidth="2" />
          <polygon points={`${ORIGIN_X},30 ${ORIGIN_X - 5},40 ${ORIGIN_X + 5},40`} fill="#4ade80" />
          <text x={ORIGIN_X - 12} y={26} className="fill-green-400 text-[11px] font-bold">Y</text>

          {/* Origin label */}
          <text x={ORIGIN_X - 8} y={ORIGIN_Y + 14} className="fill-slate-500 text-[9px]">0</text>
        </g>

        {/* Connectors */}
        {CONNECTORS.map((conn, i) => {
          const from = nodeMap[conn.from]
          const to = nodeMap[conn.to]
          if (!from || !to) return null
          const { sx: x1, sy: y1 } = toScreen(from.x + from.width / 2, from.y + from.depth / 2)
          const { sx: x2, sy: y2 } = toScreen(to.x + to.width / 2, to.y + to.depth / 2)
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          )
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const Icon = node.icon
          const shading = getColorShading(node.color as any)
          const { sx, sy } = toScreen(node.x, node.y + node.depth) // top-left in screen coords
          const isDragging = dragState?.nodeId === node.id
          return (
            <g
              key={node.id}
              onPointerDown={(e) => handlePointerDown(e, node.id)}
              className={`cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
              style={{ filter: isDragging ? 'brightness(1.1)' : undefined }}
            >
              <rect
                x={sx}
                y={sy}
                width={node.width * SCALE}
                height={node.depth * SCALE}
                fill={shading.top}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1"
                rx="4"
              />
              <foreignObject
                x={sx}
                y={sy}
                width={node.width * SCALE}
                height={node.depth * SCALE}
                className="pointer-events-none"
              >
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <Icon size={14} className="mb-0.5" />
                  <span className="text-[9px] font-medium">{node.label}</span>
                </div>
              </foreignObject>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ============================================
// ISOMETRIC VIEW
// ============================================

function IsometricCanvas({
  nodes,
  onNodeMove
}: {
  nodes: DemoNode[]
  onNodeMove: (id: string, x: number, y: number) => void
}) {
  // Origin at bottom-center, objects in positive quadrant appear above
  // +X goes up-right, +Y goes up-left, +Z goes up
  const BASE_ORIGIN_X = 290  // Center horizontally
  const BASE_ORIGIN_Y = 380  // Near bottom
  const GRID_SIZE = 50
  const CANVAS_WIDTH = 580
  const CANVAS_HEIGHT = 400

  const svgRef = useRef<SVGSVGElement>(null)

  // Canvas transform state (pan & zoom)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 })

  // Node drag state
  const [dragState, setDragState] = useState<{
    nodeId: string
    startX: number
    startY: number
    nodeStartX: number
    nodeStartY: number
  } | null>(null)

  // Computed origin with pan offset
  const ORIGIN_X = BASE_ORIGIN_X + pan.x
  const ORIGIN_Y = BASE_ORIGIN_Y + pan.y

  const sortedNodes = [...nodes].sort((a, b) => {
    const aDepth = a.y + a.x - a.elevation
    const bDepth = b.y + b.x - b.elevation
    return aDepth - bDepth
  })

  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.id] = node
    return acc
  }, {} as Record<string, DemoNode>)

  // Canvas pan handlers (drag on empty space)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // Only start panning if clicking on the SVG background, not a node
    if (e.target === svgRef.current) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y })
    }
  }

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x
      const dy = e.clientY - panStart.y
      setPan({ x: panStart.panX + dx, y: panStart.panY + dy })
      return
    }

    if (dragState) {
      // Calculate screen delta
      const deltaScreenX = e.clientX - dragState.startX
      const deltaScreenY = e.clientY - dragState.startY

      // Convert screen delta to isometric delta
      const isoStart = screenToIsoFloor(0, 0)
      const isoEnd = screenToIsoFloor(deltaScreenX / zoom, deltaScreenY / zoom)

      const deltaIsoX = isoEnd.x - isoStart.x
      const deltaIsoY = isoEnd.y - isoStart.y

      const newX = Math.round(dragState.nodeStartX + deltaIsoX)
      const newY = Math.round(dragState.nodeStartY + deltaIsoY)

      onNodeMove(dragState.nodeId, newX, newY)
    }
  }

  const handleCanvasPointerUp = () => {
    setIsPanning(false)
    setDragState(null)
  }

  // Zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.max(0.5, Math.min(2, z * delta)))
  }

  // Node drag handlers
  const handleNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const node = nodeMap[nodeId]
    if (!node) return

    ;(e.target as Element).setPointerCapture(e.pointerId)
    setDragState({
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
    })
  }

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden relative">
      <svg
        ref={svgRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerUp}
        onWheel={handleWheel}
        className={isPanning ? 'cursor-grabbing' : dragState ? 'cursor-grabbing' : 'cursor-grab'}
        style={{ touchAction: 'none' }}
      >
        {/* Zoom transform group */}
        <g transform={`scale(${zoom})`} style={{ transformOrigin: `${CANVAS_WIDTH/2}px ${CANVAS_HEIGHT/2}px` }}>
        {/* Isometric grid on floor with labels */}
        {Array.from({ length: 8 }).map((_, i) => {
          const val = i * GRID_SIZE
          const xStart = isoToScreen(val, 0, 0)
          const xEnd = isoToScreen(val, 350, 0)
          const yStart = isoToScreen(0, val, 0)
          const yEnd = isoToScreen(350, val, 0)
          return (
            <g key={i}>
              {/* X grid lines */}
              <line
                x1={xStart.screenX + ORIGIN_X}
                y1={xStart.screenY + ORIGIN_Y}
                x2={xEnd.screenX + ORIGIN_X}
                y2={xEnd.screenY + ORIGIN_Y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
              {/* Y grid lines */}
              <line
                x1={yStart.screenX + ORIGIN_X}
                y1={yStart.screenY + ORIGIN_Y}
                x2={yEnd.screenX + ORIGIN_X}
                y2={yEnd.screenY + ORIGIN_Y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
              {/* X axis labels - on the front side of the X axis (Y=0 line) */}
              {i > 0 && (
                <text
                  x={xStart.screenX + ORIGIN_X}
                  y={xStart.screenY + ORIGIN_Y + 14}
                  className="fill-red-400/70 text-[9px] font-medium"
                  textAnchor="middle"
                >
                  {val}
                </text>
              )}
              {/* Y axis labels - on the front side of the Y axis (X=0 line) */}
              {i > 0 && (
                <text
                  x={yStart.screenX + ORIGIN_X}
                  y={yStart.screenY + ORIGIN_Y + 14}
                  className="fill-green-400/70 text-[9px] font-medium"
                  textAnchor="middle"
                >
                  {val}
                </text>
              )}
            </g>
          )
        })}

        {/* Axes at origin with arrows */}
        <g>
          {/* X axis (red) */}
          {(() => {
            const xEnd = isoToScreen(120, 0, 0)
            return (
              <>
                <line
                  x1={ORIGIN_X}
                  y1={ORIGIN_Y}
                  x2={xEnd.screenX + ORIGIN_X}
                  y2={xEnd.screenY + ORIGIN_Y}
                  stroke="#f87171"
                  strokeWidth="2.5"
                />
                {/* Arrow */}
                <polygon
                  points={`
                    ${xEnd.screenX + ORIGIN_X + 8},${xEnd.screenY + ORIGIN_Y + 4}
                    ${xEnd.screenX + ORIGIN_X - 6},${xEnd.screenY + ORIGIN_Y - 4}
                    ${xEnd.screenX + ORIGIN_X - 2},${xEnd.screenY + ORIGIN_Y + 6}
                  `}
                  fill="#f87171"
                />
                <text
                  x={xEnd.screenX + ORIGIN_X + 14}
                  y={xEnd.screenY + ORIGIN_Y + 8}
                  className="fill-red-400 text-[12px] font-bold"
                >
                  X
                </text>
              </>
            )
          })()}

          {/* Y axis (green) */}
          {(() => {
            const yEnd = isoToScreen(0, 120, 0)
            return (
              <>
                <line
                  x1={ORIGIN_X}
                  y1={ORIGIN_Y}
                  x2={yEnd.screenX + ORIGIN_X}
                  y2={yEnd.screenY + ORIGIN_Y}
                  stroke="#4ade80"
                  strokeWidth="2.5"
                />
                {/* Arrow */}
                <polygon
                  points={`
                    ${yEnd.screenX + ORIGIN_X - 8},${yEnd.screenY + ORIGIN_Y + 4}
                    ${yEnd.screenX + ORIGIN_X + 6},${yEnd.screenY + ORIGIN_Y - 4}
                    ${yEnd.screenX + ORIGIN_X + 2},${yEnd.screenY + ORIGIN_Y + 6}
                  `}
                  fill="#4ade80"
                />
                <text
                  x={yEnd.screenX + ORIGIN_X - 20}
                  y={yEnd.screenY + ORIGIN_Y + 8}
                  className="fill-green-400 text-[12px] font-bold"
                >
                  Y
                </text>
              </>
            )
          })()}

          {/* Z axis (blue) - going up */}
          {(() => {
            const zEnd = isoToScreen(0, 0, 120)
            return (
              <>
                <line
                  x1={ORIGIN_X}
                  y1={ORIGIN_Y}
                  x2={zEnd.screenX + ORIGIN_X}
                  y2={zEnd.screenY + ORIGIN_Y}
                  stroke="#60a5fa"
                  strokeWidth="2.5"
                />
                {/* Arrow */}
                <polygon
                  points={`
                    ${zEnd.screenX + ORIGIN_X},${zEnd.screenY + ORIGIN_Y - 8}
                    ${zEnd.screenX + ORIGIN_X - 5},${zEnd.screenY + ORIGIN_Y + 4}
                    ${zEnd.screenX + ORIGIN_X + 5},${zEnd.screenY + ORIGIN_Y + 4}
                  `}
                  fill="#60a5fa"
                />
                <text
                  x={zEnd.screenX + ORIGIN_X + 8}
                  y={zEnd.screenY + ORIGIN_Y}
                  className="fill-blue-400 text-[12px] font-bold"
                >
                  Z
                </text>
              </>
            )
          })()}

          {/* Origin marker */}
          <circle cx={ORIGIN_X} cy={ORIGIN_Y} r="4" fill="white" />
          <text x={ORIGIN_X - 18} y={ORIGIN_Y + 4} className="fill-slate-400 text-[9px]">0</text>
        </g>

        {/* Connectors */}
        {CONNECTORS.map((conn, i) => {
          const from = nodeMap[conn.from]
          const to = nodeMap[conn.to]
          if (!from || !to) return null

          const fromPt = isoToScreen(
            from.x + from.width / 2,
            from.y + from.depth / 2,
            from.elevation + from.height
          )
          const toPt = isoToScreen(
            to.x + to.width / 2,
            to.y + to.depth / 2,
            to.elevation + to.height
          )

          const x1 = fromPt.screenX + ORIGIN_X
          const y1 = fromPt.screenY + ORIGIN_Y
          const x2 = toPt.screenX + ORIGIN_X
          const y2 = toPt.screenY + ORIGIN_Y

          return (
            <g key={i}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
                strokeDasharray="5 3"
              />
              <circle cx={x2} cy={y2} r="3" fill="rgba(255,255,255,0.5)" />
            </g>
          )
        })}

        {/* Nodes */}
        {sortedNodes.map((node) => {
          const Icon = node.icon
          const origin = isoToScreen(node.x, node.y, node.elevation)
          const screenX = origin.screenX + ORIGIN_X
          const screenY = origin.screenY + ORIGIN_Y
          const paths = isoBox(node.width, node.depth, node.height, screenX, screenY)
          const shading = getColorShading(node.color as any)
          const topCenter = isoToScreen(
            node.x + node.width / 2,
            node.y + node.depth / 2,
            node.elevation + node.height
          )

          const isDragging = dragState?.nodeId === node.id
          return (
            <g
              key={node.id}
              onPointerDown={(e) => handleNodePointerDown(e, node.id)}
              className={`cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
              style={{ filter: isDragging ? 'brightness(1.1)' : undefined }}
            >
              <path d={paths.left} fill={shading.left} stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
              <path d={paths.right} fill={shading.right} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
              <path d={paths.top} fill={shading.top} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />

              <foreignObject
                x={topCenter.screenX + ORIGIN_X - 40}
                y={topCenter.screenY + ORIGIN_Y - 18}
                width="80"
                height="36"
                className="pointer-events-none"
              >
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <Icon size={13} className="mb-0.5 drop-shadow-md" />
                  <span className="text-[8px] font-medium drop-shadow-md">{node.label}</span>
                </div>
              </foreignObject>
            </g>
          )
        })}
        </g>
      </svg>

      {/* Zoom indicator */}
      <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 bg-slate-800/80 px-2 py-1 rounded">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function IsometricDemo() {
  const [nodes, setNodes] = useState<DemoNode[]>(INITIAL_NODES)

  const handleChange = (id: string, field: string, value: number) => {
    setNodes(prev => prev.map(node =>
      node.id === id ? { ...node, [field]: value } : node
    ))
  }

  const handleNodeMove = (id: string, x: number, y: number) => {
    setNodes(prev => prev.map(node =>
      node.id === id ? { ...node, x, y } : node
    ))
  }

  const resetNodes = () => setNodes(INITIAL_NODES)

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Arc Rendering Modes</h1>
          <p className="text-slate-400 text-sm">Edit in Three.js (left) → Preview in SVG player (right)</p>
        </div>

        {/* Coordinate table at top */}
        <div className="mb-6 flex justify-center">
          <div className="w-[500px]">
            <CoordinateTable nodes={nodes} onChange={handleChange} showZ={true} />
            <button
              onClick={resetNodes}
              className="mt-3 w-full text-xs text-slate-500 hover:text-slate-300 py-1.5 border border-slate-700 rounded hover:border-slate-600 transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        </div>

        {/* Side by side: Editor | Player */}
        <div className="grid grid-cols-2 gap-4">

          {/* LEFT: Three.js Editor */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded">EDITOR</span>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Arc Three.js <span className="text-slate-600 normal-case">(full 3D)</span>
              </h2>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-2">
              <ThreeRenderer
                nodes={nodes}
                onNodeMove={handleNodeMove}
                width={580}
                height={400}
              />
            </div>
          </div>

          {/* RIGHT: SVG Player */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">PLAYER</span>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Arc SVG <span className="text-slate-600 normal-case">(zero deps)</span>
              </h2>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-2">
              <IsometricCanvas nodes={nodes} onNodeMove={handleNodeMove} />
            </div>
          </div>

        </div>

        {/* 2D Planning view below */}
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold text-slate-600 bg-slate-800 px-2 py-0.5 rounded">2D</span>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Top-Down <span className="text-slate-600 normal-case">(planning view)</span>
            </h2>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-2">
            <TopDown2DCanvas nodes={nodes} onNodeMove={handleNodeMove} />
          </div>
        </div>

        {/* Legend */}
        <div className="text-center text-xs text-slate-600 mt-6">
          <span className="text-red-400 font-medium">X</span> = horizontal →
          <span className="text-green-400 font-medium ml-3">Y</span> = depth
          <span className="text-blue-400 font-medium ml-3">Z</span> = elevation ↑
          <span className="text-slate-400 font-medium ml-3">H</span> = thickness
        </div>
      </div>
    </div>
  )
}
