import { useId, useMemo } from 'react'
import { isoBox, isoToScreen, getColorShading, ISO_COLORS } from '../../utils/isometric'
import { isoNodeDims, isoWireBox, buildNodeIndex, sortIsoNodeIds } from '../../utils/isoBlueprint'
import type { WireBox } from '../../utils/isoBlueprint'
import { getIsoStyle } from '../../utils/isoStyles'
import type { IsoStyleSpec } from '../../utils/isoStyles'
import TechnicalDefs from '../technical/TechnicalDefs'
import { TechnicalBox, TechnicalCallout } from '../technical/TechnicalNode'
import IsoFacePrint from './IsoFacePrint'
import type { NodePosition, NodeData } from '../../types/editor'
import type { BrandSpec } from '../../utils/themes'

function isoPrintFont(kind: NodePosition['isoLabelFont'], brand?: BrandSpec | null) {
  if (kind === 'mono') return brand?.monoFamily || "'JetBrains Mono', ui-monospace, monospace"
  if (kind === 'ui') return "'Inter', system-ui, sans-serif"
  return brand?.fontFamily || "'Inter', system-ui, sans-serif"
}

const DEFAULT_CORNER_RADIUS = 6

interface IsometricNodeLayerProps {
  nodes: Record<string, NodePosition>
  nodeData: Record<string, NodeData>
  selectedNodeIds: string[]
  onNodeClick?: (nodeId: string, e: React.MouseEvent) => void
  onNodePointerDown?: (e: React.PointerEvent, nodeId: string) => void
  onNodePointerEnter?: (nodeId: string) => void
  onNodeContextMenu?: (nodeId: string, e: React.MouseEvent) => void
  // Canvas origin offset - where (0,0,0) appears on screen
  originX?: number
  originY?: number
  /** Render style — 'solid' shades the faces, technical styles draw line art. */
  isoStyle?: IsoStyleSpec
  brand?: BrandSpec | null
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
  onNodePointerEnter,
  onNodeContextMenu,
  originX = 400,
  originY = 500,
  isoStyle = getIsoStyle('solid'),
  brand,
}: IsometricNodeLayerProps) {
  const uid = useId().replace(/:/g, '')

  // Sort nodes by depth for painter's algorithm (back to front).
  const sortedIds = useMemo(
    () => sortIsoNodeIds(nodes, nodeData),
    [nodes, nodeData]
  )
  const sortedNodes = useMemo(
    () => sortedIds.map((id) => [id, nodes[id]] as const),
    [sortedIds, nodes]
  )

  const nodeIndex = useMemo(() => buildNodeIndex(nodes, nodeData), [nodes, nodeData])

  const technical = isoStyle.technical

  // Technical styles draw in two passes: every box first, then every callout,
  // so a nearer component never paints over a neighbour's label.
  const technicalItems = useMemo(() => {
    if (!technical) return []
    return sortedNodes.map(([nodeId, node]) => {
      const dims = isoNodeDims(node)
      const origin = isoToScreen(node.x, node.y, dims.elevation)
      return {
        nodeId,
        data: nodeData[nodeId],
        box: isoWireBox(
          dims.width,
          dims.depth,
          dims.height,
          originX + origin.screenX,
          originY + origin.screenY
        ) as WireBox,
      }
    })
  }, [technical, sortedNodes, nodeData, originX, originY])

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      {technical && <TechnicalDefs uid={uid} style={isoStyle} />}

      {technical &&
        technicalItems.map(({ nodeId, data, box }) => (
          <g
            key={nodeId}
            className="pointer-events-auto cursor-pointer"
            onClick={(e) => onNodeClick?.(nodeId, e)}
            onPointerDown={(e) => onNodePointerDown?.(e, nodeId)}
            onPointerEnter={() => onNodePointerEnter?.(nodeId)}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onNodeContextMenu?.(nodeId, e)
            }}
          >
            <TechnicalBox
              uid={uid}
              style={isoStyle}
              box={box}
              color={data.color}
              tag={nodeIndex[nodeId]}
              selected={selectedNodeIds.includes(nodeId)}
            />
          </g>
        ))}

      {technical &&
        technicalItems.map(({ nodeId, data, box }) => (
          <TechnicalCallout
            key={`callout-${nodeId}`}
            style={isoStyle}
            box={box}
            name={data.name}
            subtitle={data.subtitle}
            icon={data.icon}
            selected={selectedNodeIds.includes(nodeId)}
          />
        ))}

      {technical &&
        technicalItems
          .filter(({ nodeId }) => selectedNodeIds.includes(nodeId))
          .map(({ nodeId, box }) => (
            <g
              key={`sel-${nodeId}`}
              className="pointer-events-auto cursor-pointer"
              onClick={(e) => onNodeClick?.(nodeId, e)}
              onPointerDown={(e) => onNodePointerDown?.(e, nodeId)}
              onPointerEnter={() => onNodePointerEnter?.(nodeId)}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onNodeContextMenu?.(nodeId, e)
              }}
            >
              <path
                d={box.visible}
                fill="none"
                stroke={isoStyle.ink.accent}
                strokeWidth={isoStyle.strokeWidth * 1.7}
                strokeLinejoin="round"
                strokeLinecap="round"
                pointerEvents="none"
              />
              <path d={box.left} fill="transparent" />
              <path d={box.right} fill="transparent" />
              <path d={box.top} fill="transparent" />
            </g>
          ))}

      {!technical &&
        sortedNodes.map(([nodeId, node]) => {
        const data = nodeData[nodeId]
        if (!data) return null

        const dims = isoNodeDims(node)
        const isoWidth = dims.width
        const isoDepth = dims.depth
        const isoHeight = dims.height
        const elevation = dims.elevation

        // Calculate screen position for this node's origin
        const nodeOrigin = isoToScreen(node.x, node.y, elevation)
        const screenX = originX + nodeOrigin.screenX
        const screenY = originY + nodeOrigin.screenY

        const isSelected = selectedNodeIds.includes(nodeId)

        const handlers = {
          onClick: (e: React.MouseEvent) => onNodeClick?.(nodeId, e),
          onPointerDown: (e: React.PointerEvent) => onNodePointerDown?.(e, nodeId),
          onPointerEnter: () => onNodePointerEnter?.(nodeId),
          onContextMenu: (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            onNodeContextMenu?.(nodeId, e)
          },
        }

        // Generate the box paths
        const box = isoBox(isoWidth, isoDepth, isoHeight, screenX, screenY, DEFAULT_CORNER_RADIUS)

        // Get shading colors
        const colorDef = ISO_COLORS[data.color as keyof typeof ISO_COLORS] || ISO_COLORS.violet
        const shading = getColorShading(data.color)

        const labelPos = isoToScreen(node.x + isoWidth / 2, node.y + isoDepth / 2, elevation + isoHeight)
        const labelX = originX + labelPos.screenX
        const labelY = originY + labelPos.screenY
        const printClip = `iso-print-${uid}-${nodeId}`

        return (
          <g key={nodeId} className="cursor-pointer pointer-events-auto" {...handlers}>
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

            <clipPath id={printClip}>
              <path d={box.top} />
            </clipPath>
            <g clipPath={`url(#${printClip})`}>
              <IsoFacePrint
                cx={labelX}
                cy={labelY}
                width={isoWidth}
                depth={isoDepth}
                name={data.name}
                icon={data.icon}
                dir={node.isoLabelDir}
                flip={node.isoLabelFlip}
                fontFamily={isoPrintFont(node.isoLabelFont, brand)}
                uppercase={node.isoLabelFont !== 'ui' && node.isoLabelFont !== 'mono' && !!brand?.upperLabels}
              />
            </g>
          </g>
        )
      })}

      {!technical &&
        selectedNodeIds.map((nodeId) => {
          const node = nodes[nodeId]
          const data = nodeData[nodeId]
          if (!node || !data) return null
          const dims = isoNodeDims(node)
          const origin = isoToScreen(node.x, node.y, dims.elevation)
          const box = isoBox(
            dims.width,
            dims.depth,
            dims.height,
            originX + origin.screenX,
            originY + origin.screenY,
            DEFAULT_CORNER_RADIUS
          )
          const handlers = {
            onClick: (e: React.MouseEvent) => onNodeClick?.(nodeId, e),
            onPointerDown: (e: React.PointerEvent) => onNodePointerDown?.(e, nodeId),
            onPointerEnter: () => onNodePointerEnter?.(nodeId),
            onContextMenu: (e: React.MouseEvent) => {
              e.preventDefault()
              e.stopPropagation()
              onNodeContextMenu?.(nodeId, e)
            },
          }
          return (
            <g key={`sel-${nodeId}`} className="pointer-events-auto cursor-pointer" {...handlers}>
              <path d={box.left} fill="transparent" />
              <path d={box.right} fill="transparent" />
              <path d={box.top} fill="transparent" />
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
