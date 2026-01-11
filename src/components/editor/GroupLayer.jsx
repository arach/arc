import React, { useState, useCallback } from 'react'

// Group colors matching the node color palette
const groupColors = {
  violet: { fill: 'rgba(139, 92, 246, 0.1)', stroke: 'rgba(139, 92, 246, 0.5)' },
  emerald: { fill: 'rgba(52, 211, 153, 0.1)', stroke: 'rgba(52, 211, 153, 0.5)' },
  blue: { fill: 'rgba(96, 165, 250, 0.1)', stroke: 'rgba(96, 165, 250, 0.5)' },
  amber: { fill: 'rgba(251, 191, 36, 0.1)', stroke: 'rgba(251, 191, 36, 0.5)' },
  zinc: { fill: 'rgba(113, 113, 122, 0.1)', stroke: 'rgba(113, 113, 122, 0.5)' },
  sky: { fill: 'rgba(56, 189, 248, 0.1)', stroke: 'rgba(56, 189, 248, 0.5)' },
}

function GroupShape({ group, isSelected, onClick, onDragStart, onResize }) {
  const colors = groupColors[group.color] || groupColors.zinc
  const { x, y, width, height, type, label } = group

  const handleMouseDown = (e) => {
    e.stopPropagation()
    onClick(group.id)
    onDragStart(group.id, e)
  }

  const handleResizeMouseDown = (e, corner) => {
    e.stopPropagation()
    onResize(group.id, corner, e)
  }

  return (
    <g className="cursor-move">
      {type === 'circle' ? (
        <ellipse
          cx={x + width / 2}
          cy={y + height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={colors.fill}
          stroke={isSelected ? '#3b82f6' : colors.stroke}
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
          rx={12}
          ry={12}
          fill={colors.fill}
          stroke={isSelected ? '#3b82f6' : colors.stroke}
          strokeWidth={isSelected ? 2 : 1.5}
          strokeDasharray={group.dashed ? '8 4' : undefined}
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Label */}
      {label && (
        <text
          x={x + 12}
          y={y + 20}
          fill={colors.stroke}
          fontSize="12"
          fontWeight="500"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          style={{ pointerEvents: 'none' }}
        >
          {label}
        </text>
      )}

      {/* Selection/resize handles */}
      {isSelected && (
        <>
          <circle
            cx={x} cy={y} r={5} fill="#3b82f6"
            className="cursor-nwse-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          <circle
            cx={x + width} cy={y} r={5} fill="#3b82f6"
            className="cursor-nesw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          <circle
            cx={x} cy={y + height} r={5} fill="#3b82f6"
            className="cursor-nesw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />
          <circle
            cx={x + width} cy={y + height} r={5} fill="#3b82f6"
            className="cursor-nwse-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />
        </>
      )}
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
}) {
  const [dragState, setDragState] = useState(null)

  const handleDragStart = useCallback((groupId, e) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return

    const point = screenToCanvas({ x: e.clientX, y: e.clientY })
    setDragState({
      groupId,
      type: 'move',
      startX: point.x,
      startY: point.y,
      originalX: group.x,
      originalY: group.y,
    })
  }, [groups, screenToCanvas])

  const handleResizeStart = useCallback((groupId, corner, e) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return

    const point = screenToCanvas({ x: e.clientX, y: e.clientY })
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
  }, [groups, screenToCanvas])

  const handleMouseMove = useCallback((e) => {
    if (!dragState) return

    const point = screenToCanvas({ x: e.clientX, y: e.clientY })
    const dx = point.x - dragState.startX
    const dy = point.y - dragState.startY

    if (dragState.type === 'move') {
      onGroupUpdate(dragState.groupId, {
        x: Math.round(dragState.originalX + dx),
        y: Math.round(dragState.originalY + dy),
      })
    } else if (dragState.type === 'resize') {
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
  }, [dragState, screenToCanvas, onGroupUpdate])

  const handleMouseUp = useCallback(() => {
    setDragState(null)
  }, [])

  if (!groups || groups.length === 0) return null

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="none"
      onMouseMove={dragState ? handleMouseMove : undefined}
      onMouseUp={dragState ? handleMouseUp : undefined}
      onMouseLeave={dragState ? handleMouseUp : undefined}
      style={{ pointerEvents: dragState ? 'auto' : 'none' }}
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
          />
        ))}
      </g>
    </svg>
  )
}
