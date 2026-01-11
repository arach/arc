import { useRef, useCallback, useState, useEffect } from 'react'
// @ts-expect-error - JS module, will migrate later
import { useEditor, useDiagram, useEditorState, useTemplate } from './EditorProvider'
// @ts-expect-error - JS module
import { NODE_SIZES } from '../../utils/constants'
// @ts-expect-error - JS module
import { getTemplate } from '../../utils/templates'
import { useCanvasTransform } from '../../hooks/useCanvasTransform'
// @ts-expect-error - JS module
import EditableNode from './EditableNode'
// @ts-expect-error - JS module
import ConnectorLayer from './ConnectorLayer'
// @ts-expect-error - JS module
import AnchorPoints from './AnchorPoints'
// @ts-expect-error - JS module
import GroupLayer from './GroupLayer'
// @ts-expect-error - JS module
import ImageLayer from './ImageLayer'
// @ts-expect-error - JS module
import MiniMap from './MiniMap'
// @ts-expect-error - JS module
import ExportZoneLayer from './ExportZoneLayer'
// @ts-expect-error - JS module
import InfiniteGrid from './InfiniteGrid'
import ZoomControls from './ZoomControls'

interface DiagramCanvasProps {
  onViewportChange?: (bounds: { x: number; y: number; width: number; height: number }) => void
}

export default function DiagramCanvas({ onViewportChange }: DiagramCanvasProps) {
  const { actions } = useEditor()
  const diagram = useDiagram()
  const editor = useEditorState()
  const templateId = useTemplate()
  const template = getTemplate(templateId)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  const {
    containerRef,
    zoom,
    pan,
    isPanning,
    zoomIn,
    zoomOut,
    resetTransform,
    fitToView,
    setPan,
    screenToCanvas,
    transformStyle,
  } = useCanvasTransform({
    initialZoom: 1,
    initialPan: { x: 0, y: 0 },
    panModeActive: editor.mode === 'pan',
  })

  const canvasRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, nodeId: string) => {
      if (editor.mode !== 'select' || isPanning) return

      e.target instanceof Element && (e.target as Element).setPointerCapture?.(e.pointerId)
      const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY })
      const isShiftHeld = e.shiftKey

      // Compute new selection based on shift state
      let newSelectedIds: string[]
      if (isShiftHeld) {
        // Toggle node in selection
        if (editor.selectedNodeIds.includes(nodeId)) {
          newSelectedIds = editor.selectedNodeIds.filter((id: string) => id !== nodeId)
        } else {
          newSelectedIds = [...editor.selectedNodeIds, nodeId]
        }
      } else {
        // If clicking on unselected node, select only it
        // If clicking on already-selected node, keep current selection (for multi-drag)
        newSelectedIds = editor.selectedNodeIds.includes(nodeId)
          ? editor.selectedNodeIds
          : [nodeId]
      }

      // Calculate offsets for all nodes that will be dragged
      const nodeOffsets: Record<string, { x: number; y: number }> = {}
      for (const id of newSelectedIds) {
        const node = diagram.nodes[id]
        if (node) {
          nodeOffsets[id] = {
            x: canvasPoint.x - node.x,
            y: canvasPoint.y - node.y,
          }
        }
      }

      const clickedNode = diagram.nodes[nodeId]
      actions.startDrag(nodeId, {
        x: canvasPoint.x - clickedNode.x,
        y: canvasPoint.y - clickedNode.y,
      }, nodeOffsets, newSelectedIds)
    },
    [editor.mode, editor.selectedNodeIds, isPanning, diagram.nodes, actions, screenToCanvas]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!editor.isDragging || editor.selectedNodeIds.length === 0 || isPanning) return

      const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY })

      // Move all selected nodes together - allow negative coords for infinite canvas
      const moves = editor.selectedNodeIds.map((nodeId: string) => {
        const offset = editor.dragNodeOffsets?.[nodeId] || editor.dragOffset

        // No bounds constraints - infinite canvas
        const x = Math.round(canvasPoint.x - offset.x)
        const y = Math.round(canvasPoint.y - offset.y)

        return { nodeId, x, y }
      })

      actions.moveNodes(moves)

      // Auto-expand canvas bounds if content moves near/past edges
      const padding = 200
      let maxWidth = diagram.layout.width
      let maxHeight = diagram.layout.height

      for (const move of moves) {
        const node = diagram.nodes[move.nodeId]
        const size = NODE_SIZES[node?.size as keyof typeof NODE_SIZES] || NODE_SIZES.m
        const nodeWidth = node?.width || size.width
        const nodeHeight = node?.height || size.height

        // Calculate required size
        const requiredWidth = move.x + nodeWidth + padding
        const requiredHeight = move.y + nodeHeight + padding

        if (requiredWidth > maxWidth) maxWidth = requiredWidth
        if (requiredHeight > maxHeight) maxHeight = requiredHeight
      }

      // Expand if needed (expandLayout only updates if larger)
      if (maxWidth > diagram.layout.width || maxHeight > diagram.layout.height) {
        actions.expandLayout(maxWidth, maxHeight)
      }
    },
    [
      editor.isDragging,
      editor.selectedNodeIds,
      editor.dragOffset,
      editor.dragNodeOffsets,
      isPanning,
      diagram.nodes,
      diagram.layout,
      actions,
      screenToCanvas,
    ]
  )

  const handlePointerUp = useCallback(() => {
    if (editor.isDragging) {
      actions.endDrag()
    }
  }, [editor.isDragging, actions])

  const handleNodeClick = useCallback(
    (nodeId: string, _e?: React.MouseEvent) => {
      if (isPanning) return

      // Selection is handled in pointerDown for proper shift+click support
      // Click handler only needed for addConnector mode
      if (editor.mode === 'addConnector') {
        setHoveredNodeId(nodeId)
      }
    },
    [editor.mode, isPanning]
  )

  const handleAnchorClick = useCallback(
    (nodeId: string, position: string) => {
      if (editor.mode !== 'addConnector') return

      if (!editor.pendingConnector) {
        actions.setPendingConnector({ from: nodeId, fromAnchor: position })
      } else if (editor.pendingConnector.from !== nodeId) {
        actions.addConnector(
          editor.pendingConnector.from,
          nodeId,
          editor.pendingConnector.fromAnchor,
          position,
          'http'
        )
        setHoveredNodeId(null)
      }
    },
    [editor.mode, editor.pendingConnector, actions]
  )

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) return
      const target = e.target as HTMLElement
      if (!target.classList.contains('canvas-bg') && target !== canvasRef.current) return

      // Selection is handled by mousedown/mouseup for marquee selection
      if (editor.mode === 'addNode') {
        const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY })
        const x = Math.round(canvasPoint.x - NODE_SIZES.normal.width / 2)
        const y = Math.round(canvasPoint.y - NODE_SIZES.normal.height / 2)
        actions.addNode({ x: Math.max(0, x), y: Math.max(0, y) })
      } else if (editor.mode === 'addConnector') {
        actions.clearPendingConnector()
        setHoveredNodeId(null)
      }
    },
    [editor.mode, isPanning, actions, screenToCanvas]
  )

  const handleConnectorClick = useCallback(
    (index: number) => {
      if (editor.mode === 'select' && !isPanning) {
        actions.selectConnector(index)
      }
    },
    [editor.mode, isPanning, actions]
  )

  const handleGroupClick = useCallback(
    (groupId: string) => {
      if (editor.mode === 'select' && !isPanning) {
        actions.selectGroup(groupId)
      }
    },
    [editor.mode, isPanning, actions]
  )

  const handleImageClick = useCallback(
    (imageId: string) => {
      if (editor.mode === 'select' && !isPanning) {
        actions.selectImage(imageId)
      }
    },
    [editor.mode, isPanning, actions]
  )

  // Handle image drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const files = Array.from(e.dataTransfer.files)
      const imageFiles = files.filter(file =>
        file.type.startsWith('image/') || file.name.endsWith('.svg')
      )

      if (imageFiles.length === 0) return

      const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY })

      imageFiles.forEach((file, index) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const src = event.target?.result as string

          // Create an image to get dimensions
          const img = new Image()
          img.onload = () => {
            // Scale down large images to fit reasonably
            let width = img.width
            let height = img.height
            const maxSize = 300

            if (width > maxSize || height > maxSize) {
              const ratio = Math.min(maxSize / width, maxSize / height)
              width = Math.round(width * ratio)
              height = Math.round(height * ratio)
            }

            actions.addImage({
              src,
              name: file.name,
              x: Math.round(canvasPoint.x + index * 20),
              y: Math.round(canvasPoint.y + index * 20),
              width,
              height,
              opacity: 1,
            })
          }
          img.src = src
        }
        reader.readAsDataURL(file)
      })
    },
    [screenToCanvas, actions]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // Calculate viewport bounds for minimap
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

  // Update container size on resize
  const updateContainerSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setContainerSize({ width: rect.width, height: rect.height })
    }
  }, [containerRef])

  // Initial size measurement
  useEffect(() => {
    updateContainerSize()
    window.addEventListener('resize', updateContainerSize)
    return () => window.removeEventListener('resize', updateContainerSize)
  }, [updateContainerSize])

  const viewportBounds = {
    x: -pan.x / zoom,
    y: -pan.y / zoom,
    width: containerSize.width / zoom,
    height: containerSize.height / zoom,
  }

  // Report viewport changes to parent
  useEffect(() => {
    onViewportChange?.(viewportBounds)
  }, [viewportBounds.x, viewportBounds.y, viewportBounds.width, viewportBounds.height, onViewportChange])

  // Auto-expand layout when viewport extends beyond current bounds
  useEffect(() => {
    const viewRight = viewportBounds.x + viewportBounds.width
    const viewBottom = viewportBounds.y + viewportBounds.height
    const padding = 100

    // Only expand if viewport goes significantly past current bounds
    if (viewRight > diagram.layout.width - padding || viewBottom > diagram.layout.height - padding) {
      const newWidth = Math.max(diagram.layout.width, viewRight + padding)
      const newHeight = Math.max(diagram.layout.height, viewBottom + padding)
      if (newWidth > diagram.layout.width || newHeight > diagram.layout.height) {
        actions.expandLayout(newWidth, newHeight)
      }
    }
  }, [viewportBounds.x, viewportBounds.y, viewportBounds.width, viewportBounds.height, diagram.layout.width, diagram.layout.height, actions])

  const handleMiniMapViewportChange = useCallback(
    (newCenter: { x: number; y: number }) => {
      // Pan so that newCenter is at the center of the viewport
      const newPanX = -(newCenter.x * zoom) + containerSize.width / 2
      const newPanY = -(newCenter.y * zoom) + containerSize.height / 2
      setPan({ x: newPanX, y: newPanY })
    },
    [zoom, containerSize, setPan]
  )

  // Export zone editing
  const handleExportZoneUpdate = useCallback(
    (zone: { x: number; y: number; width: number; height: number }) => {
      actions.setExportZone(zone)
    },
    [actions]
  )

  // State for drawing groups
  const [drawingGroup, setDrawingGroup] = useState<{
    type: 'rect' | 'circle'
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null>(null)

  // State for marquee selection
  const [marqueeSelection, setMarqueeSelection] = useState<{
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null>(null)

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      const isCanvasBg = target.classList.contains('canvas-bg') || target === canvasRef.current

      if (editor.mode === 'addRect' || editor.mode === 'addCircle') {
        const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY })
        setDrawingGroup({
          type: editor.mode === 'addRect' ? 'rect' : 'circle',
          startX: canvasPoint.x,
          startY: canvasPoint.y,
          currentX: canvasPoint.x,
          currentY: canvasPoint.y,
        })
      } else if (editor.mode === 'select' && isCanvasBg && !isPanning) {
        // Start marquee selection on empty canvas
        const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY })
        setMarqueeSelection({
          startX: canvasPoint.x,
          startY: canvasPoint.y,
          currentX: canvasPoint.x,
          currentY: canvasPoint.y,
        })
      }
    },
    [editor.mode, screenToCanvas, isPanning]
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (drawingGroup) {
        const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY })
        setDrawingGroup(prev => prev ? {
          ...prev,
          currentX: canvasPoint.x,
          currentY: canvasPoint.y,
        } : null)
      }
      if (marqueeSelection) {
        const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY })
        setMarqueeSelection(prev => prev ? {
          ...prev,
          currentX: canvasPoint.x,
          currentY: canvasPoint.y,
        } : null)
      }
    },
    [drawingGroup, marqueeSelection, screenToCanvas]
  )

  const handleCanvasMouseUp = useCallback(() => {
    if (drawingGroup) {
      const x = Math.min(drawingGroup.startX, drawingGroup.currentX)
      const y = Math.min(drawingGroup.startY, drawingGroup.currentY)
      const width = Math.abs(drawingGroup.currentX - drawingGroup.startX)
      const height = Math.abs(drawingGroup.currentY - drawingGroup.startY)

      if (width > 20 && height > 20) {
        actions.addGroup({
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
          type: drawingGroup.type === 'circle' ? 'circle' : 'rect',
          color: 'zinc',
          label: '',
          dashed: true,
        })
      }
      setDrawingGroup(null)
      actions.setMode('select')
    }

    if (marqueeSelection) {
      const x = Math.min(marqueeSelection.startX, marqueeSelection.currentX)
      const y = Math.min(marqueeSelection.startY, marqueeSelection.currentY)
      const width = Math.abs(marqueeSelection.currentX - marqueeSelection.startX)
      const height = Math.abs(marqueeSelection.currentY - marqueeSelection.startY)

      // Only select if we actually dragged (not just clicked)
      if (width > 5 || height > 5) {
        // Find all nodes that intersect with the marquee
        const selectedIds: string[] = []
        for (const [nodeId, node] of Object.entries(diagram.nodes)) {
          const nodeData = diagram.nodeData[nodeId]
          if (!nodeData) continue
          const size = NODE_SIZES[(node as { size?: string }).size as keyof typeof NODE_SIZES] || NODE_SIZES.m
          const nodeWidth = size.width
          const nodeHeight = size.height
          const nodeX = (node as { x: number }).x
          const nodeY = (node as { y: number }).y

          // Check if node intersects with marquee
          if (
            nodeX < x + width &&
            nodeX + nodeWidth > x &&
            nodeY < y + height &&
            nodeY + nodeHeight > y
          ) {
            selectedIds.push(nodeId)
          }
        }
        if (selectedIds.length > 0) {
          actions.selectNodes(selectedIds)
        } else {
          actions.clearSelection()
        }
      } else {
        // It was just a click, clear selection
        actions.clearSelection()
      }
      setMarqueeSelection(null)
    }
  }, [drawingGroup, marqueeSelection, diagram.nodes, diagram.nodeData, actions])

  const anchorNodeId =
    editor.mode === 'addConnector' ? hoveredNodeId || editor.pendingConnector?.from : null

  const getCursorClass = () => {
    if (isPanning) return 'cursor-grabbing'
    if (editor.mode === 'pan') return 'cursor-grab'
    if (editor.mode === 'addNode') return 'cursor-crosshair'
    if (editor.mode === 'addConnector') return 'cursor-pointer'
    if (editor.mode === 'addRect' || editor.mode === 'addCircle') return 'cursor-crosshair'
    return 'cursor-default'
  }

  const getModeLabel = () => {
    switch (editor.mode) {
      case 'addNode':
        return 'Click to place node'
      case 'addConnector':
        return 'Click nodes to connect'
      case 'pan':
        return 'Drag to pan canvas'
      case 'addRect':
        return 'Draw rectangle group'
      case 'addCircle':
        return 'Draw circle group'
      default:
        return null
    }
  }

  const modeLabel = getModeLabel()

  return (
    <div className="relative w-full h-full">
      {/* Transform container - handles wheel/pan events */}
      <div
        ref={containerRef}
        className={`
          w-full h-full overflow-hidden
          ${template.canvas.background}
          ${getCursorClass()}
        `}
        style={{ touchAction: 'none' }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Infinite grid - fills entire viewport */}
        <InfiniteGrid
          grid={diagram.grid}
          viewportBounds={viewportBounds}
          containerSize={containerSize}
          zoom={zoom}
        />

        {/* Transformed canvas content */}
        <div style={transformStyle}>
          <div
            ref={canvasRef}
            className="relative canvas-bg"
            style={{
              width: diagram.layout.width,
              height: diagram.layout.height,
            }}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >

            {/* Groups - render behind everything else */}
            <GroupLayer
              layout={diagram.layout}
              groups={diagram.groups || []}
              selectedGroupId={editor.selectedGroupId}
              onGroupClick={handleGroupClick}
              onGroupUpdate={actions.updateGroup}
              screenToCanvas={screenToCanvas}
            />

            {/* Images - render above groups but below nodes */}
            <ImageLayer
              layout={diagram.layout}
              images={diagram.images || []}
              selectedImageId={editor.selectedImageId}
              onImageClick={handleImageClick}
              onImageUpdate={actions.updateImage}
              screenToCanvas={screenToCanvas}
            />

            {/* Drawing preview for groups */}
            {drawingGroup && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 ${diagram.layout.width} ${diagram.layout.height}`}
              >
                {drawingGroup.type === 'circle' ? (
                  <ellipse
                    cx={(drawingGroup.startX + drawingGroup.currentX) / 2}
                    cy={(drawingGroup.startY + drawingGroup.currentY) / 2}
                    rx={Math.abs(drawingGroup.currentX - drawingGroup.startX) / 2}
                    ry={Math.abs(drawingGroup.currentY - drawingGroup.startY) / 2}
                    fill="rgba(113, 113, 122, 0.1)"
                    stroke="rgba(113, 113, 122, 0.5)"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                  />
                ) : (
                  <rect
                    x={Math.min(drawingGroup.startX, drawingGroup.currentX)}
                    y={Math.min(drawingGroup.startY, drawingGroup.currentY)}
                    width={Math.abs(drawingGroup.currentX - drawingGroup.startX)}
                    height={Math.abs(drawingGroup.currentY - drawingGroup.startY)}
                    rx={12}
                    fill="rgba(113, 113, 122, 0.1)"
                    stroke="rgba(113, 113, 122, 0.5)"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                  />
                )}
              </svg>
            )}

            {/* Marquee selection */}
            {marqueeSelection && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 ${diagram.layout.width} ${diagram.layout.height}`}
              >
                <rect
                  x={Math.min(marqueeSelection.startX, marqueeSelection.currentX)}
                  y={Math.min(marqueeSelection.startY, marqueeSelection.currentY)}
                  width={Math.abs(marqueeSelection.currentX - marqueeSelection.startX)}
                  height={Math.abs(marqueeSelection.currentY - marqueeSelection.startY)}
                  fill="rgba(59, 130, 246, 0.1)"
                  stroke="rgba(59, 130, 246, 0.8)"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                />
              </svg>
            )}

            {/* Connectors */}
            <ConnectorLayer
              layout={diagram.layout}
              nodes={diagram.nodes}
              connectors={diagram.connectors}
              connectorStyles={diagram.connectorStyles}
              selectedConnectorIndex={editor.selectedConnectorIndex}
              onConnectorClick={handleConnectorClick}
            />

            {/* Anchor points */}
            {anchorNodeId && (
              <AnchorPoints
                layout={diagram.layout}
                nodes={diagram.nodes}
                visibleNodeId={anchorNodeId}
                onAnchorClick={handleAnchorClick}
                pendingConnector={editor.pendingConnector}
              />
            )}

            {/* Nodes - pointer-events-none so clicks pass through to connectors */}
            <div className="absolute inset-0 pointer-events-none">
              {Object.entries(diagram.nodes).map(([nodeId, node]) => {
                const data = diagram.nodeData[nodeId]
                if (!data) return null
                return (
                  <EditableNode
                    key={nodeId}
                    nodeId={nodeId}
                    node={node}
                    data={data}
                    layout={diagram.layout}
                    template={template}
                    isSelected={editor.selectedNodeIds.includes(nodeId)}
                    onPointerDown={handlePointerDown}
                    onClick={handleNodeClick}
                    onMouseEnter={() => editor.mode === 'addConnector' && setHoveredNodeId(nodeId)}
                    onMouseLeave={() => editor.mode === 'addConnector' && setHoveredNodeId(null)}
                  />
                )
              })}
            </div>

            {/* Export zone overlay */}
            <ExportZoneLayer
              layout={diagram.layout}
              exportZone={diagram.exportZone}
              isEditing={editor.mode === 'select'}
              onZoneUpdate={handleExportZoneUpdate}
              onZoneClear={actions.clearExportZone}
              screenToCanvas={screenToCanvas}
            />
          </div>
        </div>
      </div>

      {/* Mode indicator */}
      {modeLabel && (
        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-white text-xs font-medium ${
          editor.mode === 'pan' ? 'bg-zinc-600' : 'bg-blue-500'
        }`}>
          {modeLabel}
        </div>
      )}

      {/* Pending connector indicator */}
      {editor.pendingConnector && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-amber-500 text-white text-xs font-medium">
          Select target anchor
        </div>
      )}

      {/* Zoom controls */}
      <ZoomControls
        zoom={zoom}
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onReset={resetTransform}
        onFitToView={() => fitToView(diagram.layout)}
      />

      {/* Mini map */}
      <MiniMap
        diagram={diagram}
        viewportBounds={viewportBounds}
        onViewportChange={handleMiniMapViewportChange}
      />
    </div>
  )
}
