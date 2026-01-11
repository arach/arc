import React, { useMemo } from 'react'

/**
 * Renders an infinite grid pattern that tiles based on viewport position.
 * Uses CSS background patterns for efficient rendering.
 */
export default function InfiniteGrid({
  grid,
  viewportBounds, // { x, y, width, height } - visible area in canvas coords
  containerSize,  // { width, height } - actual container dimensions in pixels
  zoom,
}) {
  if (!grid?.enabled) return null

  const { size = 24, color = '#71717a', opacity = 0.1, type = 'dots' } = grid

  // Calculate the scaled grid size based on zoom
  const scaledSize = size * zoom

  // Calculate background position offset to align grid with canvas coordinates
  const offsetX = (viewportBounds.x % size) * zoom
  const offsetY = (viewportBounds.y % size) * zoom

  const style = useMemo(() => {
    const baseStyle = {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      opacity,
      backgroundPosition: `${-offsetX}px ${-offsetY}px`,
      backgroundSize: `${scaledSize}px ${scaledSize}px`,
    }

    if (type === 'dots') {
      return {
        ...baseStyle,
        backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
      }
    } else {
      return {
        ...baseStyle,
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
      }
    }
  }, [type, color, scaledSize, offsetX, offsetY, opacity])

  return <div className="infinite-grid" style={style} />
}
