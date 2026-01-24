import { useState, useCallback } from 'react'

function ImageShape({ image, isSelected, onClick, onDragStart, onResize }) {
  const { x, y, width, height, src, opacity = 1 } = image

  const handleMouseDown = (e) => {
    e.stopPropagation()
    onClick(image.id)
    onDragStart(image.id, e)
  }

  const handleResizeMouseDown = (e, corner) => {
    e.stopPropagation()
    onResize(image.id, corner, e)
  }

  return (
    <g className="cursor-move">
      {/* Image element */}
      <image
        href={src}
        x={x}
        y={y}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        style={{ cursor: 'move', opacity }}
      />

      {/* Selection border */}
      {isSelected && (
        <>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="4 2"
            style={{ pointerEvents: 'none' }}
          />
          {/* Resize handles */}
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

export default function ImageLayer({
  layout,
  images,
  selectedImageId,
  onImageClick,
  onImageUpdate,
  screenToCanvas,
}) {
  const [dragState, setDragState] = useState(null)

  const handleDragStart = useCallback((imageId, e) => {
    const image = images.find(img => img.id === imageId)
    if (!image) return

    const point = screenToCanvas({ x: e.clientX, y: e.clientY })
    setDragState({
      imageId,
      type: 'move',
      startX: point.x,
      startY: point.y,
      originalX: image.x,
      originalY: image.y,
    })
  }, [images, screenToCanvas])

  const handleResizeStart = useCallback((imageId, corner, e) => {
    const image = images.find(img => img.id === imageId)
    if (!image) return

    const point = screenToCanvas({ x: e.clientX, y: e.clientY })
    setDragState({
      imageId,
      type: 'resize',
      corner,
      startX: point.x,
      startY: point.y,
      originalX: image.x,
      originalY: image.y,
      originalWidth: image.width,
      originalHeight: image.height,
      aspectRatio: image.width / image.height,
    })
  }, [images, screenToCanvas])

  const handleMouseMove = useCallback((e) => {
    if (!dragState) return

    const point = screenToCanvas({ x: e.clientX, y: e.clientY })
    const dx = point.x - dragState.startX
    const dy = point.y - dragState.startY

    if (dragState.type === 'move') {
      onImageUpdate(dragState.imageId, {
        x: Math.round(dragState.originalX + dx),
        y: Math.round(dragState.originalY + dy),
      })
    } else if (dragState.type === 'resize') {
      let newX = dragState.originalX
      let newY = dragState.originalY
      let newWidth = dragState.originalWidth
      let newHeight = dragState.originalHeight

      // Maintain aspect ratio while resizing
      const maintainRatio = !e.shiftKey // Default: maintain ratio, shift to free resize

      if (dragState.corner.includes('e')) {
        newWidth = dragState.originalWidth + dx
      }
      if (dragState.corner.includes('w')) {
        newX = dragState.originalX + dx
        newWidth = dragState.originalWidth - dx
      }
      if (dragState.corner.includes('s')) {
        newHeight = dragState.originalHeight + dy
      }
      if (dragState.corner.includes('n')) {
        newY = dragState.originalY + dy
        newHeight = dragState.originalHeight - dy
      }

      // Aspect ratio maintenance
      if (maintainRatio && dragState.aspectRatio) {
        if (dragState.corner === 'se' || dragState.corner === 'nw') {
          // Determine which dimension changed more
          const widthChange = Math.abs(newWidth - dragState.originalWidth)
          const heightChange = Math.abs(newHeight - dragState.originalHeight)
          if (widthChange > heightChange) {
            newHeight = newWidth / dragState.aspectRatio
          } else {
            newWidth = newHeight * dragState.aspectRatio
          }
        } else if (dragState.corner === 'sw' || dragState.corner === 'ne') {
          const widthChange = Math.abs(newWidth - dragState.originalWidth)
          const heightChange = Math.abs(newHeight - dragState.originalHeight)
          if (widthChange > heightChange) {
            newHeight = newWidth / dragState.aspectRatio
          } else {
            newWidth = newHeight * dragState.aspectRatio
          }
        }
      }

      // Minimum size
      if (newWidth >= 20 && newHeight >= 20) {
        onImageUpdate(dragState.imageId, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        })
      }
    }
  }, [dragState, screenToCanvas, onImageUpdate])

  const handleMouseUp = useCallback(() => {
    setDragState(null)
  }, [])

  if (!images || images.length === 0) return null

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
        {images.map((image) => (
          <ImageShape
            key={image.id}
            image={image}
            isSelected={selectedImageId === image.id}
            onClick={onImageClick}
            onDragStart={handleDragStart}
            onResize={handleResizeStart}
          />
        ))}
      </g>
    </svg>
  )
}
