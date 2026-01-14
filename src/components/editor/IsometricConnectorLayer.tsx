import { isoToScreen, ISO_COLORS } from '../../utils/isometric'
import { NODE_SIZES } from '../../utils/constants'
import type { NodePosition, NodeData, Connector, ConnectorStyle } from '../../types/editor'

// Default isometric dimensions (should match IsometricNodeLayer)
const DEFAULT_ISO_HEIGHT = 25
const DEFAULT_ISO_DEPTH = 50

// Stroke colors matching 2D ConnectorLayer
const strokeColors: Record<string, string> = {
  emerald: '#34d399',
  amber: '#fbbf24',
  zinc: '#71717a',
  sky: '#38bdf8',
  violet: '#a78bfa',
  blue: '#60a5fa',
}

interface IsometricConnectorLayerProps {
  nodes: Record<string, NodePosition>
  nodeData: Record<string, NodeData>
  connectors: Connector[]
  connectorStyles: Record<string, ConnectorStyle>
  selectedConnectorIndex: number | null
  onConnectorClick?: (index: number) => void
  originX?: number
  originY?: number
}

// Get anchor position on an isometric box
function getIsoAnchor(
  node: NodePosition,
  anchorPosition: string,
  originX: number,
  originY: number
): { x: number; y: number } {
  const size = NODE_SIZES[node.size as keyof typeof NODE_SIZES] || NODE_SIZES.m
  const width2D = node.width || size.width
  const isoWidth = width2D * 0.8
  const isoDepth = node.isoDepth ?? DEFAULT_ISO_DEPTH
  const isoHeight = node.isoHeight ?? DEFAULT_ISO_HEIGHT
  const elevation = node.z ?? 0

  // Calculate 3D anchor positions on the box
  let wx: number, wy: number, wz: number

  switch (anchorPosition) {
    case 'left':
      // Center of left face (x=0)
      wx = node.x
      wy = node.y + isoDepth / 2
      wz = elevation + isoHeight / 2
      break
    case 'right':
      // Center of right (front) face (y=0)
      wx = node.x + isoWidth / 2
      wy = node.y
      wz = elevation + isoHeight / 2
      break
    case 'top':
      // Center of top face
      wx = node.x + isoWidth / 2
      wy = node.y + isoDepth / 2
      wz = elevation + isoHeight
      break
    case 'bottom':
      // Center of bottom
      wx = node.x + isoWidth / 2
      wy = node.y + isoDepth / 2
      wz = elevation
      break
    case 'topLeft':
      // Back-left corner of top
      wx = node.x
      wy = node.y + isoDepth
      wz = elevation + isoHeight
      break
    case 'topRight':
      // Front-right corner of top
      wx = node.x + isoWidth
      wy = node.y
      wz = elevation + isoHeight
      break
    case 'bottomLeft':
      wx = node.x
      wy = node.y + isoDepth
      wz = elevation
      break
    case 'bottomRight':
      wx = node.x + isoWidth
      wy = node.y
      wz = elevation
      break
    default:
      // Default to center of top face
      wx = node.x + isoWidth / 2
      wy = node.y + isoDepth / 2
      wz = elevation + isoHeight
  }

  // Project to screen space
  const screen = isoToScreen(wx, wy, wz)
  return {
    x: originX + screen.screenX,
    y: originY + screen.screenY,
  }
}

// Generate a smooth 3D-aware path between two points
function generateIsoPath(
  from: { x: number; y: number },
  to: { x: number; y: number }
): string {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  // Use simple bezier curve with control points perpendicular to line
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2

  // Offset control point perpendicular to the line for a nice arc
  const perpX = -dy / distance * distance * 0.2
  const perpY = dx / distance * distance * 0.2

  return `M ${from.x} ${from.y} Q ${midX + perpX} ${midY + perpY}, ${to.x} ${to.y}`
}

export default function IsometricConnectorLayer({
  nodes,
  nodeData,
  connectors,
  connectorStyles,
  selectedConnectorIndex,
  onConnectorClick,
  originX = 400,
  originY = 500,
}: IsometricConnectorLayerProps) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Arrow markers for each color */}
        {Object.entries(strokeColors).map(([color, hex]) => (
          <marker
            key={color}
            id={`iso-arrow-${color}`}
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <polygon points="0 0, 8 3, 0 6" fill={hex} />
          </marker>
        ))}
      </defs>

      <g className="pointer-events-auto">
        {connectors.map((connector, index) => {
          const style = connectorStyles[connector.style]
          if (!style) return null

          const fromNode = nodes[connector.from]
          const toNode = nodes[connector.to]
          if (!fromNode || !toNode) return null
          if (!nodeData[connector.from] || !nodeData[connector.to]) return null

          const from = getIsoAnchor(fromNode, connector.fromAnchor, originX, originY)
          const to = getIsoAnchor(toNode, connector.toAnchor, originX, originY)

          const path = generateIsoPath(from, to)
          const strokeColor = strokeColors[style.color] || strokeColors.zinc
          const isSelected = selectedConnectorIndex === index

          const showArrow = style.showArrow !== false
          const dashArray = style.dashed ? '8 4' : undefined

          return (
            <g
              key={index}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                onConnectorClick?.(index)
              }}
            >
              {/* Wider invisible path for easier clicking */}
              <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
              />

              {/* Selection highlight */}
              {isSelected && (
                <path
                  d={path}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={style.strokeWidth + 6}
                  strokeOpacity={0.3}
                  strokeDasharray={dashArray}
                />
              )}

              {/* Main connector line */}
              <path
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeWidth={style.strokeWidth}
                strokeDasharray={dashArray}
                markerEnd={showArrow ? `url(#iso-arrow-${style.color})` : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}
              />

              {/* Endpoint dots */}
              <circle cx={from.x} cy={from.y} r={4} fill={strokeColor} />
              <circle cx={to.x} cy={to.y} r={4} fill={strokeColor} />

              {/* Label at midpoint */}
              {style.label && (
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 10}
                  textAnchor="middle"
                  fill={strokeColor}
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                  fontWeight="500"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                >
                  {style.label}
                </text>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
