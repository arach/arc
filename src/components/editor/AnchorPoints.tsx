import React from 'react'
import { anchor } from '../../utils/diagramHelpers'
import { ANCHOR_POSITIONS } from '../../utils/constants'

export default function AnchorPoints({
  layout,
  nodes,
  visibleNodeId,
  onAnchorClick,
  pendingConnector,
}) {
  if (!visibleNodeId) return null

  // Filter to main anchors (not bottomRight/bottomLeft for simplicity)
  const mainAnchors = ['top', 'right', 'bottom', 'left'] as const

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="none"
    >
      <g className="pointer-events-auto">
        {mainAnchors.map(position => {
          const pos = anchor(nodes, visibleNodeId, position)
          const isPending = pendingConnector?.from === visibleNodeId && pendingConnector?.fromAnchor === position

          return (
            <g key={position}>
              {/* Larger hit area */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={12}
                fill="transparent"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onAnchorClick(visibleNodeId, position)
                }}
              />
              {/* Visible anchor point */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isPending ? 7 : 5}
                className={`
                  ${isPending ? 'fill-blue-500' : 'fill-blue-400 hover:fill-blue-500'}
                  transition-all duration-150
                `}
                style={{ pointerEvents: 'none' }}
              />
              {/* Inner dot */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={2}
                className="fill-white"
                style={{ pointerEvents: 'none' }}
              />
            </g>
          )
        })}
      </g>
    </svg>
  )
}
