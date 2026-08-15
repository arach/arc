import { useMemo } from 'react'

/**
 * Renders an infinite grid pattern that tiles based on viewport position.
 * Uses CSS background patterns for efficient rendering.
 */
export default function InfiniteGrid({
  grid,
  viewportBounds, // { x, y, width, height } - visible area in canvas coords
  zoom,
}) {
  const enabled = !!grid?.enabled
  const { size = 24, color = '#71717a', opacity = 0.1, type = 'dots' } = grid || {}

  // Scaled to the current zoom, and offset so the pattern stays pinned to the
  // canvas origin rather than the viewport.
  const scaledSize = size * zoom
  const offsetX = ((viewportBounds?.x || 0) % size) * zoom
  const offsetY = ((viewportBounds?.y || 0) % size) * zoom

  // Every hook runs on every render — toggling the grid off must not change
  // the hook order, or React tears the component down mid-render.
  const style = useMemo(() => {
    const baseStyle: React.CSSProperties = {
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

  if (!enabled) return null

  return <div className="infinite-grid" style={style} />
}
