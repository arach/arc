import { useMemo } from 'react'
import { isoBox, isoToScreen, getColorShading, ISO_COLORS } from '../../utils/isometric'
import { NODE_SIZES } from '../../utils/constants'
import type { NodePosition, NodeData } from '../../types/editor'

// Default isometric dimensions
const DEFAULT_ISO_HEIGHT = 25
const DEFAULT_ISO_DEPTH = 50
const DEFAULT_CORNER_RADIUS = 6

interface IsometricNodeLayerProps {
  nodes: Record<string, NodePosition>
  nodeData: Record<string, NodeData>
  selectedNodeIds: string[]
  onNodeClick?: (nodeId: string) => void
  onNodePointerDown?: (e: React.PointerEvent, nodeId: string) => void
  // Canvas origin offset - where (0,0,0) appears on screen
  originX?: number
  originY?: number
}

// Interpolate color based on intensity for corner shading
function interpolateColor(baseColor: { hue: number; saturation: number; lightness: number }, intensity: number): string {
  // intensity 0 = darkest, 1 = lightest
  const lightness = 20 + intensity * 50 // range from 20% to 70%
  return `hsl(${baseColor.hue}, ${baseColor.saturation}%, ${lightness}%)`
}

export default function IsometricNodeLayer({
  nodes,
  nodeData,
  selectedNodeIds,
  onNodeClick,
  onNodePointerDown,
  originX = 400,
  originY = 500,
}: IsometricNodeLayerProps) {
  // Sort nodes by depth for painter's algorithm (back to front)
  // Nodes with higher (x + y) should be rendered first (they're further back)
  const sortedNodes = useMemo(() => {
    return Object.entries(nodes)
      .filter(([nodeId]) => nodeData[nodeId]) // Only nodes with data
      .sort(([, a], [, b]) => {
        const depthA = a.x + a.y + (a.z || 0)
        const depthB = b.x + b.y + (b.z || 0)
        return depthA - depthB // Lower depth = rendered first (background)
      })
  }, [nodes, nodeData])

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      style={{ overflow: 'visible' }}
    >
      {sortedNodes.map(([nodeId, node]) => {
        const data = nodeData[nodeId]
        if (!data) return null

        // Get dimensions
        const size = NODE_SIZES[node.size as keyof typeof NODE_SIZES] || NODE_SIZES.m
        const width2D = node.width || size.width

        // Convert 2D width to isometric width (scale down for visual balance)
        const isoWidth = width2D * 0.8
        const isoDepth = node.isoDepth ?? DEFAULT_ISO_DEPTH
        const isoHeight = node.isoHeight ?? DEFAULT_ISO_HEIGHT
        const elevation = node.z ?? 0

        // Calculate screen position for this node's origin
        const nodeOrigin = isoToScreen(node.x, node.y, elevation)
        const screenX = originX + nodeOrigin.screenX
        const screenY = originY + nodeOrigin.screenY

        // Generate the box paths
        const box = isoBox(isoWidth, isoDepth, isoHeight, screenX, screenY, DEFAULT_CORNER_RADIUS)

        // Get shading colors
        const colorDef = ISO_COLORS[data.color as keyof typeof ISO_COLORS] || ISO_COLORS.violet
        const shading = getColorShading(data.color)

        const isSelected = selectedNodeIds.includes(nodeId)

        // Calculate label position (center of top face)
        const labelPos = isoToScreen(node.x + isoWidth / 2, node.y + isoDepth / 2, elevation + isoHeight)
        const labelX = originX + labelPos.screenX
        const labelY = originY + labelPos.screenY

        return (
          <g
            key={nodeId}
            className="cursor-pointer"
            onClick={() => onNodeClick?.(nodeId)}
            onPointerDown={(e) => onNodePointerDown?.(e, nodeId)}
          >
            {/* Selection glow */}
            {isSelected && (
              <g filter="url(#selection-glow)">
                <path d={box.top} fill="rgba(59, 130, 246, 0.3)" />
                <path d={box.right} fill="rgba(59, 130, 246, 0.2)" />
                <path d={box.left} fill="rgba(59, 130, 246, 0.15)" />
              </g>
            )}

            {/* Back corner cylinders (render first for proper layering) */}
            {box.cornerBackLeft?.map((segment, i) => (
              <path
                key={`cbl-${i}`}
                d={segment.path}
                fill={interpolateColor(colorDef, segment.intensity)}
              />
            ))}
            {box.cornerBackRight?.map((segment, i) => (
              <path
                key={`cbr-${i}`}
                d={segment.path}
                fill={interpolateColor(colorDef, segment.intensity)}
              />
            ))}

            {/* Left face (darkest - in shadow) */}
            <path
              d={box.left}
              fill={shading.left}
              stroke={isSelected ? '#3b82f6' : 'rgba(0,0,0,0.3)'}
              strokeWidth={isSelected ? 2 : 0.5}
            />

            {/* Right face (medium) */}
            <path
              d={box.right}
              fill={shading.right}
              stroke={isSelected ? '#3b82f6' : 'rgba(0,0,0,0.3)'}
              strokeWidth={isSelected ? 2 : 0.5}
            />

            {/* Front corner cylinders */}
            {box.cornerFrontLeft?.map((segment, i) => (
              <path
                key={`cfl-${i}`}
                d={segment.path}
                fill={interpolateColor(colorDef, segment.intensity)}
              />
            ))}
            {box.cornerFrontRight?.map((segment, i) => (
              <path
                key={`cfr-${i}`}
                d={segment.path}
                fill={interpolateColor(colorDef, segment.intensity)}
              />
            ))}

            {/* Top face (brightest - lit from above) */}
            <path
              d={box.top}
              fill={shading.top}
              stroke={isSelected ? '#3b82f6' : 'rgba(255,255,255,0.1)'}
              strokeWidth={isSelected ? 2 : 0.5}
            />

            {/* Node label */}
            <text
              x={labelX}
              y={labelY - 5}
              textAnchor="middle"
              className="fill-white text-xs font-semibold pointer-events-none"
              style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                fontSize: '11px',
              }}
            >
              {data.name}
            </text>
          </g>
        )
      })}

      {/* Filter definitions */}
      <defs>
        <filter id="selection-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}
