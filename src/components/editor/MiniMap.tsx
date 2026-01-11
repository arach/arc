import React, { useCallback, useRef } from 'react'

// Colors for mini map node representation
const nodeColors = {
  violet: '#8b5cf6',
  emerald: '#34d399',
  blue: '#60a5fa',
  amber: '#fbbf24',
  zinc: '#71717a',
  sky: '#38bdf8',
}

export default function MiniMap({
  diagram,
  viewportBounds, // { x, y, width, height } in canvas coords
  onViewportChange, // callback when user clicks/drags minimap
  width = 160,
  height = 100,
}) {
  const mapRef = useRef(null)

  // Calculate scale to fit diagram in minimap
  const layout = diagram.layout
  const scaleX = width / layout.width
  const scaleY = height / layout.height
  const scale = Math.min(scaleX, scaleY)

  // Actual minimap dimensions maintaining aspect ratio
  const mapWidth = layout.width * scale
  const mapHeight = layout.height * scale

  // Convert viewport bounds to minimap coordinates
  const viewX = (viewportBounds?.x || 0) * scale
  const viewY = (viewportBounds?.y || 0) * scale
  const viewW = (viewportBounds?.width || layout.width) * scale
  const viewH = (viewportBounds?.height || layout.height) * scale

  // Handle click on minimap to pan viewport
  const handleClick = useCallback((e) => {
    if (!mapRef.current || !onViewportChange) return

    const rect = mapRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // Convert to canvas coordinates
    const canvasX = clickX / scale
    const canvasY = clickY / scale

    // Center viewport on clicked point
    onViewportChange({
      x: canvasX - (viewportBounds?.width || layout.width) / 2,
      y: canvasY - (viewportBounds?.height || layout.height) / 2,
    })
  }, [scale, onViewportChange, viewportBounds, layout])

  return (
    <div
      ref={mapRef}
      className="absolute bottom-4 left-4 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden cursor-pointer"
      style={{ width: mapWidth + 8, height: mapHeight + 8, padding: 4 }}
      onClick={handleClick}
    >
      <svg
        width={mapWidth}
        height={mapHeight}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="bg-zinc-50 dark:bg-zinc-800 rounded"
      >
        {/* Groups */}
        {(diagram.groups || []).map((group) => (
          <rect
            key={group.id}
            x={group.x}
            y={group.y}
            width={group.width}
            height={group.height}
            fill={nodeColors[group.color] || nodeColors.zinc}
            opacity={0.2}
            rx={4}
          />
        ))}

        {/* Images */}
        {(diagram.images || []).map((image) => (
          <rect
            key={image.id}
            x={image.x}
            y={image.y}
            width={image.width}
            height={image.height}
            fill="#9ca3af"
            opacity={0.3}
          />
        ))}

        {/* Connectors */}
        {diagram.connectors.map((connector, i) => {
          const fromNode = diagram.nodes[connector.from]
          const toNode = diagram.nodes[connector.to]
          if (!fromNode || !toNode) return null

          // Simple center-to-center lines for minimap
          const fromX = fromNode.x + 50
          const fromY = fromNode.y + 25
          const toX = toNode.x + 50
          const toY = toNode.y + 25

          return (
            <line
              key={i}
              x1={fromX}
              y1={fromY}
              x2={toX}
              y2={toY}
              stroke="#9ca3af"
              strokeWidth={2 / scale}
              opacity={0.5}
            />
          )
        })}

        {/* Nodes */}
        {Object.entries(diagram.nodes as Record<string, any>).map(([nodeId, node]) => {
          const data = diagram.nodeData[nodeId]
          if (!data) return null
          const color = nodeColors[data.color] || nodeColors.zinc
          const size = node.size || 'm'
          const w = size === 'l' ? 210 : size === 's' ? 95 : size === 'xs' ? 80 : 145
          const h = size === 'l' ? 85 : size === 's' ? 42 : size === 'xs' ? 36 : 68

          return (
            <rect
              key={nodeId}
              x={node.x}
              y={node.y}
              width={node.width || w}
              height={node.height || h}
              fill={color}
              rx={4}
            />
          )
        })}

        {/* Viewport rectangle */}
        <rect
          x={viewX / scale}
          y={viewY / scale}
          width={viewW / scale}
          height={viewH / scale}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2 / scale}
          strokeDasharray={`${4 / scale} ${2 / scale}`}
        />
      </svg>
    </div>
  )
}
