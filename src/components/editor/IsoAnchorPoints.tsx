import { isoNodeAnchor } from '../../utils/isoBlueprint'
import type { NodePosition } from '../../types/editor'

const MAIN_ANCHORS = ['top', 'right', 'bottom', 'left'] as const

export default function IsoAnchorPoints({
  node,
  nodeId,
  originX,
  originY,
  onAnchorClick,
  pendingConnector,
}: {
  node: NodePosition
  nodeId: string
  originX: number
  originY: number
  onAnchorClick: (nodeId: string, position: string) => void
  pendingConnector: { from: string; fromAnchor: string } | null
}) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      <g className="pointer-events-auto">
        {MAIN_ANCHORS.map((position) => {
          const pos = isoNodeAnchor(node, position, originX, originY)
          const isPending =
            pendingConnector?.from === nodeId && pendingConnector?.fromAnchor === position

          return (
            <g key={position}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={12}
                fill="transparent"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onAnchorClick(nodeId, position)
                }}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isPending ? 7 : 5}
                className={`arc-editor-anchor${isPending ? ' is-pending' : ''}`}
                style={{ pointerEvents: 'none' }}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={2}
                className="arc-editor-anchor-inner"
                style={{ pointerEvents: 'none' }}
              />
            </g>
          )
        })}
      </g>
    </svg>
  )
}
