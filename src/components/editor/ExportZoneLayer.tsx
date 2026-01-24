import { useState, useCallback, useRef } from 'react'

interface DragState {
  type: 'move' | 'resize'
  corner?: string
  startX: number
  startY: number
  originalX: number
  originalY: number
  originalWidth?: number
  originalHeight?: number
}

interface ExportZoneLayerProps {
  layout: { width: number; height: number }
  exportZone: { x: number; y: number; width: number; height: number } | null
  isEditing: boolean
  onZoneUpdate: (zone: { x: number; y: number; width: number; height: number }) => void
  screenToCanvas: (point: { x: number; y: number }) => { x: number; y: number }
}

export default function ExportZoneLayer({
  layout,
  exportZone,
  isEditing,
  onZoneUpdate,
  screenToCanvas,
}: ExportZoneLayerProps) {
  const [dragState, setDragState] = useState<DragState | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const handleResizeStart = useCallback((corner, e) => {
    if (!exportZone || !isEditing) return
    e.stopPropagation()
    e.target.setPointerCapture(e.pointerId)

    const point = screenToCanvas({ x: e.clientX, y: e.clientY })
    setDragState({
      type: 'resize',
      corner,
      startX: point.x,
      startY: point.y,
      originalX: exportZone.x,
      originalY: exportZone.y,
      originalWidth: exportZone.width,
      originalHeight: exportZone.height,
    })
  }, [exportZone, isEditing, screenToCanvas])

  const handleMoveStart = useCallback((e) => {
    if (!exportZone || !isEditing) return
    e.stopPropagation()
    e.target.setPointerCapture(e.pointerId)

    const point = screenToCanvas({ x: e.clientX, y: e.clientY })
    setDragState({
      type: 'move',
      startX: point.x,
      startY: point.y,
      originalX: exportZone.x,
      originalY: exportZone.y,
    })
  }, [exportZone, isEditing, screenToCanvas])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState || !exportZone) return

    const point = screenToCanvas({ x: e.clientX, y: e.clientY })
    const dx = point.x - dragState.startX
    const dy = point.y - dragState.startY

    if (dragState.type === 'move') {
      // Allow moving freely, just ensure minimum stays at 0
      onZoneUpdate({
        ...exportZone,
        x: Math.max(0, Math.round(dragState.originalX + dx)),
        y: Math.max(0, Math.round(dragState.originalY + dy)),
      })
    } else if (dragState.type === 'resize' && dragState.corner && dragState.originalWidth !== undefined && dragState.originalHeight !== undefined) {
      let newX = dragState.originalX
      let newY = dragState.originalY
      let newWidth = dragState.originalWidth
      let newHeight = dragState.originalHeight

      if (dragState.corner.includes('w')) {
        newX = dragState.originalX + dx
        newWidth = dragState.originalWidth - dx
      }
      if (dragState.corner.includes('e')) {
        newWidth = dragState.originalWidth + dx
      }
      if (dragState.corner.includes('n')) {
        newY = dragState.originalY + dy
        newHeight = dragState.originalHeight - dy
      }
      if (dragState.corner.includes('s')) {
        newHeight = dragState.originalHeight + dy
      }

      // Minimum size check only
      if (newWidth >= 50 && newHeight >= 50) {
        onZoneUpdate({
          x: Math.max(0, Math.round(newX)),
          y: Math.max(0, Math.round(newY)),
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        })
      }
    }
  }, [dragState, exportZone, screenToCanvas, onZoneUpdate])

  const handlePointerUp = useCallback((e) => {
    if (e.target.releasePointerCapture) {
      e.target.releasePointerCapture(e.pointerId)
    }
    setDragState(null)
  }, [])

  if (!exportZone) return null

  const { x, y, width, height } = exportZone

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="none"
      style={{ pointerEvents: 'none' }}
    >
      {/* Dimmed overlay outside export zone */}
      <defs>
        <mask id="exportZoneMask">
          <rect x={0} y={0} width={layout.width} height={layout.height} fill="white" />
          <rect x={x} y={y} width={width} height={height} fill="black" />
        </mask>
      </defs>
      <rect
        x={0}
        y={0}
        width={layout.width}
        height={layout.height}
        fill="rgba(0,0,0,0.3)"
        mask="url(#exportZoneMask)"
        style={{ pointerEvents: 'none' }}
      />

      {/* Clickable fill area for moving */}
      {isEditing && (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="transparent"
          style={{ pointerEvents: 'auto', cursor: 'move' }}
          onPointerDown={handleMoveStart}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      )}

      {/* Export zone border */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke="#10b981"
        strokeWidth={2}
        strokeDasharray="8 4"
        style={{ pointerEvents: 'none' }}
      />

      {/* Label */}
      <text
        x={x + 8}
        y={y - 8}
        fill="#10b981"
        fontSize="12"
        fontWeight="600"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        style={{ pointerEvents: 'none' }}
      >
        Export Zone ({width} x {height})
      </text>

      {/* Resize handles - only visible when editing */}
      {isEditing && (
        <g>
          {[
            { cx: x, cy: y, cursor: 'nwse-resize', corner: 'nw' },
            { cx: x + width, cy: y, cursor: 'nesw-resize', corner: 'ne' },
            { cx: x, cy: y + height, cursor: 'nesw-resize', corner: 'sw' },
            { cx: x + width, cy: y + height, cursor: 'nwse-resize', corner: 'se' },
            { cx: x + width / 2, cy: y, cursor: 'ns-resize', corner: 'n', r: 5 },
            { cx: x + width / 2, cy: y + height, cursor: 'ns-resize', corner: 's', r: 5 },
            { cx: x, cy: y + height / 2, cursor: 'ew-resize', corner: 'w', r: 5 },
            { cx: x + width, cy: y + height / 2, cursor: 'ew-resize', corner: 'e', r: 5 },
          ].map(({ cx, cy, cursor, corner, r = 6 }) => (
            <circle
              key={corner}
              cx={cx}
              cy={cy}
              r={r}
              fill="#10b981"
              style={{ pointerEvents: 'auto', cursor }}
              onPointerDown={(e) => handleResizeStart(corner, e)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
          ))}
        </g>
      )}
    </svg>
  )
}
