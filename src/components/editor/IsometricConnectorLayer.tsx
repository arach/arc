import { useId } from 'react'
import { isoNodeAnchor } from '../../utils/isoBlueprint'
import { getIsoStyle, d } from '../../utils/isoStyles'
import type { IsoStyleSpec } from '../../utils/isoStyles'
import TechnicalDefs, { arrowMarkerId } from '../technical/TechnicalDefs'
import type { NodePosition, NodeData, Connector, ConnectorStyle } from '../../types/editor'

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
  /** Render style — technical styles draw dotted ink lines instead of colored curves. */
  isoStyle?: IsoStyleSpec
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
  isoStyle = getIsoStyle('solid'),
}: IsometricConnectorLayerProps) {
  const uid = useId().replace(/:/g, '')
  const technical = isoStyle.technical

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      {technical ? (
        <TechnicalDefs uid={uid} style={isoStyle} />
      ) : (
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
      )}

      <g className="pointer-events-auto">
        {connectors.map((connector, index) => {
          const style = connectorStyles[connector.style]
          if (!style) return null

          const fromNode = nodes[connector.from]
          const toNode = nodes[connector.to]
          if (!fromNode || !toNode) return null
          if (!nodeData[connector.from] || !nodeData[connector.to]) return null

          const from = isoNodeAnchor(fromNode, connector.fromAnchor, originX, originY)
          const to = isoNodeAnchor(toNode, connector.toAnchor, originX, originY)

          const isSelected = selectedConnectorIndex === index
          const showArrow = style.showArrow !== false

          if (technical) {
            return (
              <TechnicalConnector
                key={index}
                uid={uid}
                isoStyle={isoStyle}
                from={from}
                to={to}
                label={style.label}
                isSelected={isSelected}
                showArrow={showArrow}
                onClick={(e) => {
                  e.stopPropagation()
                  onConnectorClick?.(index)
                }}
              />
            )
          }

          const path = generateIsoPath(from, to)
          const strokeColor = strokeColors[style.color] || strokeColors.zinc
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

interface TechnicalConnectorProps {
  uid: string
  isoStyle: IsoStyleSpec
  from: { x: number; y: number }
  to: { x: number; y: number }
  label?: string
  isSelected: boolean
  showArrow: boolean
  onClick: (e: React.MouseEvent) => void
}

/**
 * Relationship line for the technical styles: a straight dotted run in ink,
 * open ring terminators, an open chevron arrowhead, and a monospace label
 * sitting on a small paper plate so the linework doesn't read through it.
 */
function TechnicalConnector({
  uid,
  isoStyle,
  from,
  to,
  label,
  isSelected,
  showArrow,
  onClick,
}: TechnicalConnectorProps) {
  const ink = isSelected ? isoStyle.ink.accent : isoStyle.ink.line
  const path = `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  const text = (label || '').toUpperCase()
  const plateWidth = text.length * d(5.2) + d(10)

  return (
    <g className="cursor-pointer" onClick={onClick}>
      {/* Wider invisible path for easier clicking */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={20} />

      <path
        d={path}
        fill="none"
        stroke={ink}
        strokeWidth={isSelected ? isoStyle.strokeWidth * 1.6 : isoStyle.strokeWidth * 1.1}
        strokeDasharray="2 3.5"
        strokeLinecap="round"
        markerEnd={showArrow ? `url(#${arrowMarkerId(uid, isSelected ? 'accent' : 'line')})` : undefined}
      />

      {/* Terminators */}
      {[from, to].map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={d(2.4)}
          fill={isoStyle.paper.from}
          stroke={ink}
          strokeWidth={isoStyle.strokeWidth * 0.7}
        />
      ))}

      {text && (
        <g>
          <rect
            x={midX - plateWidth / 2}
            y={midY - d(15)}
            width={plateWidth}
            height={d(12)}
            fill={isoStyle.paper.from}
            stroke={isoStyle.ink.muted}
            strokeWidth={0.4}
          />
          <text
            x={midX}
            y={midY - d(6.5)}
            textAnchor="middle"
            fill={isSelected ? isoStyle.ink.accent : isoStyle.ink.text}
            fontSize={d(7.5)}
            fontFamily={isoStyle.font}
            style={{ letterSpacing: '0.12em' }}
          >
            {text}
          </text>
        </g>
      )}
    </g>
  )
}
