import { useState } from 'react'
import { isoToScreen, isoBox, getColorShading } from '../utils/isometric'
import { Monitor, Database, Globe, Cpu } from 'lucide-react'

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
  { id: 'api', x: 120, y: 0, elevation: 40, width: 90, depth: 55, height: 25, color: 'violet', label: 'API', icon: Globe },
  { id: 'service', x: 250, y: 0, elevation: 80, width: 80, depth: 50, height: 20, color: 'cyan', label: 'Service', icon: Cpu },
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
                <td className={`border-r ${!isLast ? 'border-b' : ''} border-slate-700 p-0.5`}>
                  <input
                    type="number"
                    value={node.x}
                    onChange={(e) => onChange(node.id, 'x', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 text-slate-200 text-center py-1 px-1 border border-transparent focus:border-red-500 focus:outline-none rounded-sm"
                  />
                </td>
                <td className={`border-r ${!isLast ? 'border-b' : ''} border-slate-700 p-0.5`}>
                  <input
                    type="number"
                    value={node.y}
                    onChange={(e) => onChange(node.id, 'y', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 text-slate-200 text-center py-1 px-1 border border-transparent focus:border-green-500 focus:outline-none rounded-sm"
                  />
                </td>
                {showZ && (
                  <td className={`border-r ${!isLast ? 'border-b' : ''} border-slate-700 p-0.5`}>
                    <input
                      type="number"
                      value={node.elevation}
                      onChange={(e) => onChange(node.id, 'elevation', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-800 text-slate-200 text-center py-1 px-1 border border-transparent focus:border-blue-500 focus:outline-none rounded-sm"
                    />
                  </td>
                )}
                <td className={`${!isLast ? 'border-b' : ''} border-slate-700 p-0.5`}>
                  <input
                    type="number"
                    value={node.height}
                    onChange={(e) => onChange(node.id, 'height', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 text-slate-400 text-center py-1 px-1 border border-transparent focus:border-slate-500 focus:outline-none rounded-sm"
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

function TopDown2DCanvas({ nodes }: { nodes: DemoNode[] }) {
  const SCALE = 1.0
  const ORIGIN_X = 50  // Where (0,0) is on screen
  const ORIGIN_Y = 180 // Y=0 is near bottom, Y increases upward
  const GRID_SIZE = 50

  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.id] = node
    return acc
  }, {} as Record<string, DemoNode>)

  // Transform: Y increases upward (flip Y)
  const toScreen = (x: number, y: number) => ({
    sx: ORIGIN_X + x * SCALE,
    sy: ORIGIN_Y - y * SCALE  // Flip Y so it goes up
  })

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden">
      <svg width={420} height={220}>
        {/* Grid lines with labels */}
        {Array.from({ length: 8 }).map((_, i) => {
          const xVal = i * GRID_SIZE
          const { sx } = toScreen(xVal, 0)
          return (
            <g key={`vline-${i}`}>
              <line
                x1={sx} y1={20} x2={sx} y2={200}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
              {i > 0 && (
                <text x={sx} y={212} textAnchor="middle" className="fill-slate-600 text-[9px]">
                  {xVal}
                </text>
              )}
            </g>
          )
        })}
        {Array.from({ length: 5 }).map((_, i) => {
          const yVal = i * GRID_SIZE
          const { sy } = toScreen(0, yVal)
          return (
            <g key={`hline-${i}`}>
              <line
                x1={40} y1={sy} x2={400} y2={sy}
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
          <line x1={ORIGIN_X} y1={ORIGIN_Y} x2={ORIGIN_X + 320} y2={ORIGIN_Y} stroke="#f87171" strokeWidth="2" />
          <polygon points={`${ORIGIN_X + 320},${ORIGIN_Y} ${ORIGIN_X + 310},${ORIGIN_Y - 5} ${ORIGIN_X + 310},${ORIGIN_Y + 5}`} fill="#f87171" />
          <text x={ORIGIN_X + 330} y={ORIGIN_Y + 4} className="fill-red-400 text-[11px] font-bold">X</text>

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
          return (
            <g key={node.id}>
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

function IsometricCanvas({ nodes }: { nodes: DemoNode[] }) {
  const ORIGIN_X = 80   // Screen position of (0,0,0)
  const ORIGIN_Y = 220
  const GRID_SIZE = 50

  const sortedNodes = [...nodes].sort((a, b) => {
    const aDepth = a.y + a.x - a.elevation
    const bDepth = b.y + b.x - b.elevation
    return aDepth - bDepth
  })

  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.id] = node
    return acc
  }, {} as Record<string, DemoNode>)

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden">
      <svg width={480} height={300}>
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
              {/* X axis labels */}
              {i > 0 && (
                <text
                  x={xStart.screenX + ORIGIN_X + 5}
                  y={xStart.screenY + ORIGIN_Y + 12}
                  className="fill-red-400/50 text-[8px]"
                >
                  {val}
                </text>
              )}
              {/* Y axis labels */}
              {i > 0 && (
                <text
                  x={yStart.screenX + ORIGIN_X - 12}
                  y={yStart.screenY + ORIGIN_Y + 4}
                  className="fill-green-400/50 text-[8px]"
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

          return (
            <g key={node.id}>
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
      </svg>
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

  const resetNodes = () => setNodes(INITIAL_NODES)

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Isometric Projection Demo</h1>
          <p className="text-slate-400 text-sm">Edit coordinates to see how 2D positions map to isometric 3D</p>
        </div>

        {/* 2D Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            2D Top-Down View <span className="text-slate-600">(X-Y plane)</span>
          </h2>
          <div className="flex gap-4 bg-slate-900/50 rounded-xl p-4">
            <div className="w-72 shrink-0">
              <CoordinateTable nodes={nodes} onChange={handleChange} showZ={false} />
            </div>
            <div className="flex-1">
              <TopDown2DCanvas nodes={nodes} />
            </div>
          </div>
        </div>

        {/* Isometric Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Isometric View <span className="text-slate-600">(X-Y-Z space)</span>
          </h2>
          <div className="flex gap-4 bg-slate-900/50 rounded-xl p-4">
            <div className="w-72 shrink-0">
              <CoordinateTable nodes={nodes} onChange={handleChange} showZ={true} />
              <button
                onClick={resetNodes}
                className="mt-3 w-full text-xs text-slate-500 hover:text-slate-300 py-1.5 border border-slate-700 rounded hover:border-slate-600 transition-colors"
              >
                Reset to defaults
              </button>
            </div>
            <div className="flex-1">
              <IsometricCanvas nodes={nodes} />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="text-center text-xs text-slate-600">
          <span className="text-red-400 font-medium">X</span> = horizontal →
          <span className="text-green-400 font-medium ml-3">Y</span> = depth ↑
          <span className="text-blue-400 font-medium ml-3">Z</span> = elevation ↑
          <span className="text-slate-400 font-medium ml-3">H</span> = thickness
        </div>
      </div>
    </div>
  )
}
