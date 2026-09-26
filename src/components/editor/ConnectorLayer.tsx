import React from 'react'
import {
  anchor,
  midPoint,
  arrowShape,
  connectorArrowAt,
  connectorArrowSize,
  connectorGeometry,
  connectorLineStyle,
} from '../../utils/diagramHelpers'
import type { ArrowHead } from '../../types/editor'
import type { BrandSpec, Theme } from '../../utils/themes'

type ResolvedThemeMode = Theme['light'] | Theme['dark']

// Stroke colors for dark mode (fallback when no theme is active)
const strokeColors = {
  emerald: '#34d399',
  amber: '#fbbf24',
  zinc: '#71717a',
  sky: '#38bdf8',
  violet: '#a78bfa',
  blue: '#60a5fa',
}

/** Resolve a stroke color from theme palette or fall back to hardcoded defaults */
function resolveStrokeColor(color: string, themeColors?: ResolvedThemeMode | null): string {
  if (themeColors) {
    const paletteEntry = themeColors.palette?.[color as keyof typeof themeColors.palette]
    if (paletteEntry?.stroke) return paletteEntry.stroke
  }
  return strokeColors[color] || strokeColors.zinc
}

/** Arrowhead (or other end glyph) drawn inline at a connector endpoint.
 *  `angle` is the path's tangent at that end, pointing along travel;
 *  the glyph is placed tip-down at `x,y` facing travel direction. */
function EndGlyph({
  kind,
  x,
  y,
  angle,
  size,
  color,
  opacity,
  themeColors,
  chevron,
}: {
  kind: ArrowHead
  x: number
  y: number
  angle: number
  size: number
  color: string
  opacity: number
  themeColors?: ResolvedThemeMode | null
  chevron?: boolean
}) {
  // 'chevron' brand turns the filled 'arrow' into an open chevron
  const resolved = kind === 'arrow' && chevron ? 'open' : kind
  const shape = arrowShape(resolved, size)
  if (!shape) return null
  const stroke = resolveStrokeColor(color, themeColors)
  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle})`} className="pointer-events-none">
      {shape.circle ? (
        <circle cx={shape.circle.cx} cy={0} r={shape.circle.r} fill={stroke} fillOpacity={0.88 * opacity} />
      ) : (
        <path
          d={shape.d!}
          fill={shape.filled ? stroke : 'none'}
          fillOpacity={shape.filled ? 0.88 * opacity : undefined}
          stroke={shape.filled ? undefined : stroke}
          strokeWidth={resolved === 'open' ? Math.max(1, size * 0.14) : Math.max(1, size * 0.2)}
          strokeOpacity={shape.filled ? undefined : 0.9 * opacity}
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      )}
    </g>
  )
}

// Calculate optimal dot position offset from anchor point
// Dots are positioned right at the node edge since GAP is now 0
function getDotOffset() {
  // No offset needed - dots sit exactly at anchor points (node edges)
  return { dx: 0, dy: 0 }
}

// Endpoint dot component with improved positioning
function EndpointDot({ x, y, color, size = 3, themeColors }: { x: number; y: number; color: string; size?: number; themeColors?: ResolvedThemeMode | null }) {
  const offset = getDotOffset()
  return (
    <circle
      cx={x + offset.dx}
      cy={y + offset.dy}
      r={size}
      fill={resolveStrokeColor(color, themeColors)}
      fillOpacity={0.75}
      className="pointer-events-none"
    />
  )
}

// Generate path between two points, with the tangent angles at each end
// (needed to orient inline arrowheads on curves and elbows). All routes go
// through connectorGeometry so canvas, SVG export, and flow animation share
// identical geometry for the same connector.
function generatePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fromAnchor: Parameters<typeof connectorGeometry>[2],
  toAnchor: Parameters<typeof connectorGeometry>[3],
  curve?: string,
  curveDepth = 40,
): { d: string; startAngle: number; endAngle: number } {
  const geometry = connectorGeometry(from, to, fromAnchor, toAnchor, curve as Parameters<typeof connectorGeometry>[4], curveDepth)
  return { d: geometry.d, startAngle: geometry.startAngle, endAngle: geometry.endAngle }
}

function EdgeHandle({
  x,
  y,
  onPointerDown,
}: {
  x: number
  y: number
  onPointerDown: (e: React.PointerEvent) => void
}) {
  return (
    <circle
      cx={x}
      cy={y}
      r={7}
      className="arc-edge-handle"
      onPointerDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onPointerDown(e)
      }}
    />
  )
}

function Connector({ connector, nodes, connectorStyles, isSelected, onClick, onContextMenu, onEndpointDown, index, themeColors, brand }: {
  connector: any; nodes: any; connectorStyles: any; isSelected: boolean; onClick: (i: number) => void; onContextMenu?: (i: number, e: React.MouseEvent) => void; onEndpointDown?: (i: number, end: 'from' | 'to', e: React.PointerEvent) => void; index: number; themeColors?: ResolvedThemeMode | null; brand?: BrandSpec
}) {
  const style = connectorStyles[connector.style]
  if (!style) return null

  const from = anchor(nodes, connector.from, connector.fromAnchor)
  const to = anchor(nodes, connector.to, connector.toAnchor)
  const mid = midPoint(from, to)

  // Get curve depth from connector or use default
  const curveDepth = connector.curveDepth ?? 40
  const { d: path, startAngle, endAngle } = generatePath(from, to, connector.fromAnchor, connector.toAnchor, connector.curve, curveDepth)
  const strokeColor = resolveStrokeColor(style.color ?? 'zinc', themeColors)
  const strokeWidth = style.strokeWidth ?? 2
  // Overall connector opacity ('auto' = fully opaque line)
  const opacity = style.opacity ?? 1

  // Per-end glyphs (explicit fromArrow/toArrow win over the legacy flags)
  const fromArrow = connectorArrowAt(style, 'from')
  const toArrow = connectorArrowAt(style, 'to')
  const fromArrowSize = connectorArrowSize(style, 'from')
  const toArrowSize = connectorArrowSize(style, 'to')
  // Endpoint dots - default to true
  const showEndpoints = style.showEndpoints !== false
  // Bidirectional support
  const isBidirectional = style.bidirectional === true || fromArrow !== 'none'
  // Animation support (enabled by default for dashed/dotted lines)
  const lineStyle = connectorLineStyle(style)
  const isAnimated = style.animated !== false && lineStyle !== 'solid'
  const labelText = connector.label ?? style.label

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

  // Dash pattern for the resolved line style ('0.1 6' + round caps = dots)
  const dashArray = lineStyle === 'dashed' ? '8 4' : lineStyle === 'dotted' ? '0.1 6' : undefined
  const dashPeriod = lineStyle === 'dashed' ? 12 : 6.1

  // Animation class for CSS animations
  const animationClass = isAnimated
    ? (isBidirectional ? 'animate-dash-bidirectional' : 'animate-dash-forward')
    : ''

  // Role label positions — a short way along the line from each end
  const rad = (deg: number) => (deg * Math.PI) / 180
  const rolePos = (p: { x: number; y: number }, angle: number, inward: boolean) => {
    const a = rad(inward ? angle : angle + 180)
    return { x: p.x + Math.cos(a) * 20, y: p.y + Math.sin(a) * 20 + 10 }
  }

  return (
    <g
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation()
        onClick(index)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onContextMenu?.(index, e)
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
          stroke={strokeColor}
          strokeWidth={strokeWidth + 7}
          strokeOpacity={0.22}
          strokeDasharray={dashArray}
          style={{ filter: 'blur(4px)' }}
        />
      )}

      <g opacity={opacity}>
        {brand?.connectorGlow && (
          <path
            d={path}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth + 5}
            strokeOpacity={0.16}
            strokeDasharray={dashArray}
            strokeLinecap="round"
            style={{ filter: 'blur(2.5px)' }}
            className={animationClass}
          />
        )}

        {/* Visible connector line with animation */}
        <path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animationClass}
          strokeOpacity={0.92}
          style={{ ['--dash-period' as string]: dashPeriod }}
        />

        {/* End glyphs (arrowheads, dots, diamonds, bars) */}
        <EndGlyph kind={fromArrow} x={from.x} y={from.y} angle={startAngle + 180} size={fromArrowSize} color={style.color ?? 'zinc'} opacity={opacity} themeColors={themeColors} chevron={brand?.arrowhead === 'chevron'} />
        <EndGlyph kind={toArrow} x={to.x} y={to.y} angle={endAngle} size={toArrowSize} color={style.color ?? 'zinc'} opacity={opacity} themeColors={themeColors} chevron={brand?.arrowhead === 'chevron'} />

        {/* Endpoint dots at node edges */}
        {showEndpoints && (
          <>
            <EndpointDot x={from.x} y={from.y} color={style.color ?? 'zinc'} size={4} themeColors={themeColors} />
            <EndpointDot x={to.x} y={to.y} color={style.color ?? 'zinc'} size={4} themeColors={themeColors} />
          </>
        )}

        {/* Label — connector label wins over the style's */}
        {labelText && labelText.length > 0 && connector.curve !== 'down' && connector.curve !== 'up' && (
          <text
            x={labelX}
            y={labelY}
            textAnchor={textAnchor}
            fill={strokeColor}
            fontSize="9"
            fontFamily={brand?.upperLabels ? (brand.monoFamily || 'ui-monospace, monospace') : (brand?.fontFamily || 'system-ui, sans-serif')}
            fontWeight="500"
            letterSpacing={brand?.upperLabels ? '0.08em' : '0.02em'}
            fillOpacity={0.82}
            style={{ textTransform: brand?.upperLabels ? 'uppercase' : 'none' }}
          >
            {labelText}
          </text>
        )}

        {/* Relationship role annotations near each end */}
        {connector.fromRole && (
          <text
            x={rolePos(from, startAngle, true).x}
            y={rolePos(from, startAngle, true).y}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="7.5"
            fontFamily={brand?.monoFamily || 'ui-monospace, monospace'}
            fillOpacity={0.6}
          >
            {connector.fromRole}
          </text>
        )}
        {connector.toRole && (
          <text
            x={rolePos(to, endAngle, false).x}
            y={rolePos(to, endAngle, false).y}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="7.5"
            fontFamily={brand?.monoFamily || 'ui-monospace, monospace'}
            fillOpacity={0.6}
          >
            {connector.toRole}
          </text>
        )}
      </g>

      {isSelected && onEndpointDown && (
        <>
          <EdgeHandle x={from.x} y={from.y} onPointerDown={(e) => onEndpointDown(index, 'from', e)} />
          <EdgeHandle x={to.x} y={to.y} onPointerDown={(e) => onEndpointDown(index, 'to', e)} />
        </>
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
  onConnectorContextMenu,
  onEndpointDown,
  themeColors,
  brand,
}: {
  layout: any; nodes: any; connectors: any[]; connectorStyles: any; selectedConnectorIndex: number | null; onConnectorClick: (i: number) => void; onConnectorContextMenu?: (i: number, e: React.MouseEvent) => void; onEndpointDown?: (i: number, end: 'from' | 'to', e: React.PointerEvent) => void; themeColors?: ResolvedThemeMode | null; brand?: BrandSpec
}) {
  return (
    <>
      {/* CSS animations for dashed line motion */}
      <style>{`
        @keyframes dash-forward {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: var(--dash-period, 12);
          }
        }
        
        @keyframes dash-bidirectional {
          0% {
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dashoffset: var(--dash-period, 12);
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
              onContextMenu={onConnectorContextMenu}
              onEndpointDown={onEndpointDown}
              themeColors={themeColors}
              brand={brand}
            />
          ))}
        </g>
      </svg>
    </>
  )
}
