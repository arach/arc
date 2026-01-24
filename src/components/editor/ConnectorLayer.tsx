import React from 'react'
import { anchor, midPoint } from '../../utils/diagramHelpers'

// Stroke colors for dark mode
const strokeColors = {
  emerald: '#34d399',
  amber: '#fbbf24',
  zinc: '#71717a',
  sky: '#38bdf8',
  violet: '#a78bfa',
  blue: '#60a5fa',
}

// Arrow marker for one-directional arrows
function ArrowMarker({ id, color }) {
  return (
    <marker
      id={id}
      markerWidth="8"
      markerHeight="6"
      refX="7"
      refY="3"
      orient="auto"
      markerUnits="userSpaceOnUse"
    >
      <polygon points="0 0, 8 3, 0 6" fill={strokeColors[color]} />
    </marker>
  )
}

// Arrow marker for start of bidirectional arrows
function ArrowMarkerStart({ id, color }) {
  return (
    <marker
      id={id}
      markerWidth="8"
      markerHeight="6"
      refX="1"
      refY="3"
      orient="auto"
      markerUnits="userSpaceOnUse"
    >
      <polygon points="8 0, 0 3, 8 6" fill={strokeColors[color]} />
    </marker>
  )
}

// Calculate optimal dot position offset from anchor point
// Dots are positioned right at the node edge since GAP is now 0
function getDotOffset() {
  // No offset needed - dots sit exactly at anchor points (node edges)
  return { dx: 0, dy: 0 }
}

// Endpoint dot component with improved positioning
function EndpointDot({ x, y, color, size = 4 }) {
  const offset = getDotOffset()
  return (
    <circle
      cx={x + offset.dx}
      cy={y + offset.dy}
      r={size}
      fill={strokeColors[color] || strokeColors.zinc}
      className="pointer-events-none"
    />
  )
}

// Get control point offset based on anchor position
function getControlOffset(anchor, distance) {
  const d = Math.abs(distance) * 0.5 // Control point distance
  switch (anchor) {
    case 'top': return { dx: 0, dy: -d }
    case 'bottom': return { dx: 0, dy: d }
    case 'left': return { dx: -d, dy: 0 }
    case 'right': return { dx: d, dy: 0 }
    case 'bottomRight': return { dx: d * 0.7, dy: d * 0.7 }
    case 'bottomLeft': return { dx: -d * 0.7, dy: d * 0.7 }
    default: return { dx: 0, dy: 0 }
  }
}

// Generate smooth curved path between two points
function generatePath(from, to, fromAnchor, toAnchor, curve, curveDepth = 50) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  // Natural bezier curve - control points extend from anchors in their natural direction
  if (curve === 'natural' || curve === 'down' || curve === 'up') {
    const fromOffset = getControlOffset(fromAnchor, distance)
    const toOffset = getControlOffset(toAnchor, distance)

    // Scale by curveDepth (default 50 = 50% of distance for control points)
    const scale = curveDepth / 50

    const cp1x = from.x + fromOffset.dx * scale
    const cp1y = from.y + fromOffset.dy * scale
    const cp2x = to.x + toOffset.dx * scale
    const cp2y = to.y + toOffset.dy * scale

    return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`
  }

  // For horizontal connections (right->left or left->right)
  if ((fromAnchor === 'right' && toAnchor === 'left') || (fromAnchor === 'left' && toAnchor === 'right')) {
    const midX = (from.x + to.x) / 2
    return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`
  }

  // For vertical connections (top->bottom or bottom->top)
  if ((fromAnchor === 'bottom' && toAnchor === 'top') || (fromAnchor === 'top' && toAnchor === 'bottom')) {
    const midY = (from.y + to.y) / 2
    return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`
  }

  // For any other connections, use a gentle curve based on anchor directions
  const fromOffset = getControlOffset(fromAnchor, distance)
  const toOffset = getControlOffset(toAnchor, distance)

  const cp1x = from.x + fromOffset.dx
  const cp1y = from.y + fromOffset.dy
  const cp2x = to.x + toOffset.dx
  const cp2y = to.y + toOffset.dy

  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`
}

function Connector({ connector, nodes, connectorStyles, isSelected, onClick, index }) {
  const style = connectorStyles[connector.style]
  if (!style) return null

  const from = anchor(nodes, connector.from, connector.fromAnchor)
  const to = anchor(nodes, connector.to, connector.toAnchor)
  const mid = midPoint(from, to)

  // Get curve depth from connector or use default
  const curveDepth = connector.curveDepth ?? 40
  const path = generatePath(from, to, connector.fromAnchor, connector.toAnchor, connector.curve, curveDepth)
  const strokeColor = strokeColors[style.color] || strokeColors.zinc

  // Arrow control - default to true if not specified
  const showArrow = style.showArrow !== false
  // Endpoint dots - default to true
  const showEndpoints = style.showEndpoints !== false
  // Bidirectional support
  const isBidirectional = style.bidirectional === true
  // Animation support (enabled by default for dashed lines, can be explicitly disabled)
  const isAnimated = style.animated !== false && style.dashed

  // Determine label position based on connector direction
  const isVertical = connector.fromAnchor === 'bottom' || connector.fromAnchor === 'top'
  let labelX, labelY, textAnchor

  if (connector.curve === 'down') {
    // Curved CloudKit paths - no label needed
    labelX = mid.x
    labelY = Math.max(from.y, to.y) + 60
    textAnchor = 'middle'
  } else if (isVertical) {
    // Vertical connectors - label to the right
    labelX = from.x + 12
    labelY = mid.y
    textAnchor = 'start'
  } else {
    // Horizontal connectors - label in the middle, above the line
    labelX = mid.x
    labelY = Math.min(from.y, to.y) - 8
    textAnchor = 'middle'
  }

  // Calculate dash array and animation properties
  const dashArray = style.dashed ? '8 4' : undefined
  
  // Determine arrow markers
  let markerStartAttr: string | undefined = undefined
  let markerEndAttr: string | undefined = undefined
  if (showArrow) {
    if (isBidirectional) {
      markerStartAttr = `url(#arrow-start-${style.color})`
      markerEndAttr = `url(#arrow-${style.color})`
    } else {
      markerEndAttr = `url(#arrow-${style.color})`
    }
  }
  
  // Animation class for CSS animations
  const animationClass = isAnimated 
    ? (isBidirectional ? 'animate-dash-bidirectional' : 'animate-dash-forward')
    : ''

  return (
    <g
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation()
        onClick(index)
      }}
    >
      {/* Invisible wider path for easier clicking */}
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

      {/* Visible connector line with animation */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={style.strokeWidth}
        strokeDasharray={dashArray}
        markerStart={markerStartAttr}
        markerEnd={markerEndAttr}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animationClass}
      />

      {/* Endpoint dots at node edges */}
      {showEndpoints && (
        <>
          <EndpointDot x={from.x} y={from.y} color={style.color} size={4} />
          <EndpointDot x={to.x} y={to.y} color={style.color} size={4} />
        </>
      )}

      {/* Label - only for non-curved connectors with labels */}
      {style.label && style.label.length > 0 && !connector.curve && (
        <text
          x={labelX}
          y={labelY}
          textAnchor={textAnchor}
          fill={strokeColor}
          fontSize="11"
          fontFamily="ui-monospace, monospace"
          fontWeight="500"
        >
          {style.label}
        </text>
      )}
    </g>
  )
}

export default function ConnectorLayer({
  layout,
  nodes,
  connectors,
  connectorStyles,
  selectedConnectorIndex,
  onConnectorClick,
}) {
  // Get unique colors used by connectors for marker definitions
  const usedColors = [...new Set(
    connectors
      .map(c => connectorStyles[c.style]?.color)
      .filter(Boolean)
  )] as string[]

  return (
    <>
      {/* CSS animations for dashed line motion */}
      <style>{`
        @keyframes dash-forward {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 12;
          }
        }
        
        @keyframes dash-bidirectional {
          0% {
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dashoffset: 12;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        
        .animate-dash-forward {
          animation: dash-forward 2s linear infinite;
        }
        
        .animate-dash-bidirectional {
          animation: dash-bidirectional 2s linear infinite;
        }
      `}</style>
      
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        preserveAspectRatio="none"
      >
        {/* Arrow marker definitions */}
        <defs>
          {usedColors.map(color => (
            <React.Fragment key={color}>
              <ArrowMarker id={`arrow-${color}`} color={color} />
              <ArrowMarkerStart id={`arrow-start-${color}`} color={color} />
            </React.Fragment>
          ))}
        </defs>

        {/* Render all connectors */}
        <g className="pointer-events-auto">
          {connectors.map((connector, i) => (
            <Connector
              key={i}
              index={i}
              connector={connector}
              nodes={nodes}
              connectorStyles={connectorStyles}
              isSelected={selectedConnectorIndex === i}
              onClick={onConnectorClick}
            />
          ))}
        </g>
      </svg>
    </>
  )
}
