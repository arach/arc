import { useState, useCallback } from 'react'
import { isoToScreen, isoFloorRect, isoFloorEllipse, canvasToIsoFloor } from '../../utils/isometric'
import type { IsoStyleSpec } from '../../utils/isoStyles'
import type { GroupShape as Group } from '../../types/diagram'

interface GroupDragState {
  groupId: string
  type: 'move' | 'resize'
  corner?: string
  startX: number
  startY: number
  originalX: number
  originalY: number
  originalWidth?: number
  originalHeight?: number
}

interface IsoOrigin {
  x: number
  y: number
}

// Group colors matching the node color palette
const groupColors: Record<string, { fill: string; stroke: string }> = {
  violet: { fill: 'rgba(139, 92, 246, 0.1)', stroke: 'rgba(139, 92, 246, 0.5)' },
  emerald: { fill: 'rgba(52, 211, 153, 0.1)', stroke: 'rgba(52, 211, 153, 0.5)' },
  blue: { fill: 'rgba(96, 165, 250, 0.1)', stroke: 'rgba(96, 165, 250, 0.5)' },
  amber: { fill: 'rgba(251, 191, 36, 0.1)', stroke: 'rgba(251, 191, 36, 0.5)' },
  zinc: { fill: 'rgba(113, 113, 122, 0.1)', stroke: 'rgba(113, 113, 122, 0.5)' },
  sky: { fill: 'rgba(56, 189, 248, 0.1)', stroke: 'rgba(56, 189, 248, 0.5)' },
}

function projectPoint(x: number, y: number, isoOrigin: IsoOrigin | null | undefined) {
  if (!isoOrigin) return { x, y }
  const p = isoToScreen(x, y, 0)
  return { x: isoOrigin.x + p.screenX, y: isoOrigin.y + p.screenY }
}

function GroupShape({
  group,
  isSelected,
  onClick,
  onDragStart,
  onResize,
  isoOrigin,
  isoStyle,
}: {
  group: Group
  isSelected: boolean
  onClick: (id: string) => void
  onDragStart: (groupId: string, e: React.MouseEvent) => void
  onResize: (groupId: string, corner: string, e: React.MouseEvent) => void
  isoOrigin?: IsoOrigin | null
  isoStyle?: IsoStyleSpec | null
}) {
  const palette = groupColors[group.color] || groupColors.zinc
  const technical = isoStyle?.technical ? isoStyle : null
  const colors = technical
    ? { fill: technical.face.top, stroke: technical.ink.muted }
    : palette
  const { x, y, width, height, type, label } = group
  const stroke = isSelected ? (technical ? technical.ink.accent : '#3b82f6') : colors.stroke
  const fillOpacity = technical ? 0.45 : 1

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick(group.id)
    onDragStart(group.id, e)
  }

  const handleResizeMouseDown = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation()
    onResize(group.id, corner, e)
  }

  const projected = Boolean(isoOrigin)
  const path = projected
    ? type === 'circle'
      ? isoFloorEllipse(x + width / 2, y + height / 2, width / 2, height / 2, isoOrigin!.x, isoOrigin!.y)
      : isoFloorRect(x, y, width, height, isoOrigin!.x, isoOrigin!.y, 6)
    : null

  const labelPos = projectPoint(x + 12, y + 20, isoOrigin)
  const handles = [
    { corner: 'nw', ...projectPoint(x, y, isoOrigin), cursor: 'cursor-nwse-resize' },
    { corner: 'ne', ...projectPoint(x + width, y, isoOrigin), cursor: 'cursor-nesw-resize' },
    { corner: 'sw', ...projectPoint(x, y + height, isoOrigin), cursor: 'cursor-nesw-resize' },
    { corner: 'se', ...projectPoint(x + width, y + height, isoOrigin), cursor: 'cursor-nwse-resize' },
  ]

  return (
    <g className="cursor-move">
      {path ? (
        <path
          d={path}
          fill={colors.fill}
          fillOpacity={fillOpacity}
          stroke={stroke}
          strokeWidth={isSelected ? 2 : 1.5}
          strokeDasharray={group.dashed ? '8 4' : undefined}
          onMouseDown={handleMouseDown}
        />
      ) : type === 'circle' ? (
        <ellipse
          cx={x + width / 2}
          cy={y + height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={colors.fill}
          stroke={stroke}
          strokeWidth={isSelected ? 2 : 1.5}
          strokeDasharray={group.dashed ? '8 4' : undefined}
          onMouseDown={handleMouseDown}
        />
      ) : (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={6}
          ry={6}
          fill={colors.fill}
          stroke={stroke}
          strokeWidth={isSelected ? 2 : 1.5}
          strokeDasharray={group.dashed ? '8 4' : undefined}
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Label */}
      {label && (
        <text
          x={labelPos.x}
          y={labelPos.y}
          fill={technical ? technical.ink.text : colors.stroke}
          fontSize="12"
          fontWeight="500"
          fontFamily={technical ? technical.font : 'ui-sans-serif, system-ui, sans-serif'}
          style={{ pointerEvents: 'none' }}
        >
          {label}
        </text>
      )}

      {/* Selection/resize handles */}
      {isSelected && handles.map((handle) => (
        <circle
          key={handle.corner}
          cx={handle.x}
          cy={handle.y}
          r={5}
          fill={technical ? technical.ink.accent : '#3b82f6'}
          className={handle.cursor}
          onMouseDown={(e) => handleResizeMouseDown(e, handle.corner)}
        />
      ))}
    </g>
  )
}

export default function GroupLayer({
  layout,
  groups,
  selectedGroupId,
  onGroupClick,
  onGroupUpdate,
  screenToCanvas,
  isoOrigin,
  isoStyle,
}: {
  layout: { width: number; height: number }
  groups: Group[]
  selectedGroupId: string | null
  onGroupClick: (groupId: string) => void
  onGroupUpdate: (groupId: string, updates: Partial<Group>) => void
  screenToCanvas: (point: { x: number; y: number }) => { x: number; y: number }
  isoOrigin?: IsoOrigin | null
  isoStyle?: IsoStyleSpec | null
}) {
  const [dragState, setDragState] = useState<GroupDragState | null>(null)

  const pointerToWorld = useCallback((e: React.MouseEvent) => {
    const canvas = screenToCanvas({ x: e.clientX, y: e.clientY })
    if (!isoOrigin) return canvas
    return canvasToIsoFloor(canvas.x, canvas.y, isoOrigin.x, isoOrigin.y)
  }, [screenToCanvas, isoOrigin])

  const handleDragStart = useCallback((groupId: string, e: React.MouseEvent) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return

    const point = pointerToWorld(e)
    setDragState({
      groupId,
      type: 'move',
      startX: point.x,
      startY: point.y,
      originalX: group.x,
      originalY: group.y,
    })
  }, [groups, pointerToWorld])

  const handleResizeStart = useCallback((groupId: string, corner: string, e: React.MouseEvent) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return

    const point = pointerToWorld(e)
    setDragState({
      groupId,
      type: 'resize',
      corner,
      startX: point.x,
      startY: point.y,
      originalX: group.x,
      originalY: group.y,
      originalWidth: group.width,
      originalHeight: group.height,
    })
  }, [groups, pointerToWorld])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState) return

    const point = pointerToWorld(e)
    const dx = point.x - dragState.startX
    const dy = point.y - dragState.startY

    if (dragState.type === 'move') {
      onGroupUpdate(dragState.groupId, {
        x: Math.round(dragState.originalX + dx),
        y: Math.round(dragState.originalY + dy),
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

      // Minimum size
      if (newWidth >= 40 && newHeight >= 40) {
        onGroupUpdate(dragState.groupId, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        })
      }
    }
  }, [dragState, pointerToWorld, onGroupUpdate])

  const handleMouseUp = useCallback(() => {
    setDragState(null)
  }, [])

  if (!groups || groups.length === 0) return null

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={isoOrigin ? undefined : `0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio={isoOrigin ? undefined : 'none'}
      onMouseMove={dragState ? handleMouseMove : undefined}
      onMouseUp={dragState ? handleMouseUp : undefined}
      onMouseLeave={dragState ? handleMouseUp : undefined}
      style={{ overflow: 'visible', pointerEvents: dragState ? 'auto' : 'none' }}
    >
      <g className="pointer-events-auto">
        {groups.map((group) => (
          <GroupShape
            key={group.id}
            group={group}
            isSelected={selectedGroupId === group.id}
            onClick={onGroupClick}
            onDragStart={handleDragStart}
            onResize={handleResizeStart}
            isoOrigin={isoOrigin}
            isoStyle={isoStyle}
          />
        ))}
      </g>
    </svg>
  )
}
