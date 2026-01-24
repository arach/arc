import { useState, useMemo, useRef, useCallback } from 'react'
import {
  X, Check, Link, Image, FileImage,
  Loader2, Braces, RotateCcw, FileCode
} from 'lucide-react'
import {
  generateSVG,
  generatePNG,
  createShareableLink,
  downloadFile,
  generateTypeScript,
} from '../../utils/exportUtils'
import { copyToClipboard } from '../../utils/fileOperations'

function ShareOption({ icon: Icon, label, description, onClick, loading = false, success = false, secondary = false }: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors
        ${secondary
          ? 'bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600'
        }
        ${loading ? 'opacity-60 cursor-wait' : ''}
      `}
    >
      <div className={`
        p-2 rounded-lg
        ${success ? 'bg-green-100 dark:bg-green-900/30' : 'bg-zinc-100 dark:bg-zinc-700'}
      `}>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        ) : success ? (
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
        ) : (
          <Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
          {success ? 'Done!' : label}
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {description}
        </div>
      </div>
    </button>
  )
}

// Interactive crop preview
function CropPreview({ diagram, cropBounds, onCropChange }) {
  const containerRef = useRef(null)
  const [dragging, setDragging] = useState(null) // null | 'move' | 'nw' | 'ne' | 'sw' | 'se'
  const [dragStart, setDragStart] = useState(null)

  // Calculate scale to fit diagram in preview area
  const previewWidth = 450
  const previewHeight = 250
  const scale = Math.min(
    previewWidth / diagram.layout.width,
    previewHeight / diagram.layout.height
  ) * 0.9

  const scaledWidth = diagram.layout.width * scale
  const scaledHeight = diagram.layout.height * scale

  // Convert crop bounds to preview coordinates
  const cropX = cropBounds.x * scale
  const cropY = cropBounds.y * scale
  const cropW = cropBounds.width * scale
  const cropH = cropBounds.height * scale

  const getMousePos = useCallback((e) => {
    if (!containerRef.current) return { x: 0, y: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left - (previewWidth - scaledWidth) / 2) / scale,
      y: (e.clientY - rect.top - (previewHeight - scaledHeight) / 2) / scale,
    }
  }, [scale, scaledWidth, scaledHeight])

  const handleMouseDown = useCallback((e, type) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(type)
    setDragStart({
      mouse: getMousePos(e),
      bounds: { ...cropBounds },
    })
  }, [cropBounds, getMousePos])

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !dragStart) return

    const mouse = getMousePos(e)
    const dx = mouse.x - dragStart.mouse.x
    const dy = mouse.y - dragStart.mouse.y
    const { bounds } = dragStart

    let newBounds = { ...bounds }

    if (dragging === 'move') {
      newBounds.x = Math.max(0, Math.min(diagram.layout.width - bounds.width, bounds.x + dx))
      newBounds.y = Math.max(0, Math.min(diagram.layout.height - bounds.height, bounds.y + dy))
    } else {
      // Resize handles
      if (dragging.includes('w')) {
        const newX = bounds.x + dx
        const newW = bounds.width - dx
        if (newW >= 50 && newX >= 0) {
          newBounds.x = newX
          newBounds.width = newW
        }
      }
      if (dragging.includes('e')) {
        const newW = bounds.width + dx
        if (newW >= 50 && bounds.x + newW <= diagram.layout.width) {
          newBounds.width = newW
        }
      }
      if (dragging.includes('n')) {
        const newY = bounds.y + dy
        const newH = bounds.height - dy
        if (newH >= 50 && newY >= 0) {
          newBounds.y = newY
          newBounds.height = newH
        }
      }
      if (dragging.includes('s')) {
        const newH = bounds.height + dy
        if (newH >= 50 && bounds.y + newH <= diagram.layout.height) {
          newBounds.height = newH
        }
      }
    }

    onCropChange({
      x: Math.round(newBounds.x),
      y: Math.round(newBounds.y),
      width: Math.round(newBounds.width),
      height: Math.round(newBounds.height),
    })
  }, [dragging, dragStart, diagram.layout, getMousePos, onCropChange])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
    setDragStart(null)
  }, [])

  // Generate full diagram SVG for background
  const fullSVG = useMemo(() => {
    return generateSVG(diagram, { backgroundColor: '#f4f4f5', padding: 0 })
  }, [diagram])

  return (
    <div
      ref={containerRef}
      className="relative bg-zinc-200 dark:bg-zinc-700 rounded-lg overflow-hidden select-none"
      style={{ width: previewWidth, height: previewHeight }}
      onMouseMove={dragging ? handleMouseMove : undefined}
      onMouseUp={dragging ? handleMouseUp : undefined}
      onMouseLeave={dragging ? handleMouseUp : undefined}
    >
      {/* Centered diagram container */}
      <div
        className="absolute"
        style={{
          left: (previewWidth - scaledWidth) / 2,
          top: (previewHeight - scaledHeight) / 2,
          width: scaledWidth,
          height: scaledHeight,
        }}
      >
        {/* Full diagram (dimmed) */}
        <div
          className="w-full h-full opacity-40"
          dangerouslySetInnerHTML={{ __html: fullSVG }}
          style={{ pointerEvents: 'none' }}
        />

        {/* Crop overlay */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${scaledWidth} ${scaledHeight}`}
        >
          {/* Dim area outside crop */}
          <defs>
            <mask id="cropMask">
              <rect width="100%" height="100%" fill="white" />
              <rect x={cropX} y={cropY} width={cropW} height={cropH} fill="black" />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.5)"
            mask="url(#cropMask)"
          />

          {/* Crop selection border */}
          <rect
            x={cropX}
            y={cropY}
            width={cropW}
            height={cropH}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            className="cursor-move"
            onMouseDown={(e) => handleMouseDown(e, 'move')}
          />

          {/* Corner handles */}
          {[
            { x: cropX, y: cropY, cursor: 'nwse-resize', type: 'nw' },
            { x: cropX + cropW, y: cropY, cursor: 'nesw-resize', type: 'ne' },
            { x: cropX, y: cropY + cropH, cursor: 'nesw-resize', type: 'sw' },
            { x: cropX + cropW, y: cropY + cropH, cursor: 'nwse-resize', type: 'se' },
          ].map(({ x, y, cursor, type }) => (
            <circle
              key={type}
              cx={x}
              cy={y}
              r={6}
              fill="#3b82f6"
              className={`cursor-${cursor}`}
              style={{ cursor }}
              onMouseDown={(e) => handleMouseDown(e, type)}
            />
          ))}
        </svg>
      </div>

      {/* Size indicator */}
      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white font-mono">
        {Math.round(cropBounds.width)} × {Math.round(cropBounds.height)}
      </div>
    </div>
  )
}

export default function ShareSheet({ diagram, viewportBounds, onClose }) {
  // Initialize crop bounds from viewport or sensible default
  const [cropBounds, setCropBounds] = useState(() => {
    if (viewportBounds && viewportBounds.width > 0) {
      return {
        x: Math.max(0, Math.round(viewportBounds.x)),
        y: Math.max(0, Math.round(viewportBounds.y)),
        width: Math.round(Math.min(viewportBounds.width, diagram.layout.width)),
        height: Math.round(Math.min(viewportBounds.height, diagram.layout.height)),
      }
    }
    // Default to center portion of canvas
    const w = Math.min(800, diagram.layout.width * 0.8)
    const h = Math.min(600, diagram.layout.height * 0.8)
    return {
      x: Math.round((diagram.layout.width - w) / 2),
      y: Math.round((diagram.layout.height - h) / 2),
      width: Math.round(w),
      height: Math.round(h),
    }
  })

  const [copiedJSON, setCopiedJSON] = useState(false)
  const [copiedTS, setCopiedTS] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [generatingSVG, setGeneratingSVG] = useState(false)
  const [generatingPNG, setGeneratingPNG] = useState(false)
  const [svgDone, setSvgDone] = useState(false)
  const [pngDone, setPngDone] = useState(false)

  // Create diagram with crop bounds as export zone
  const croppedDiagram = useMemo(() => ({
    ...diagram,
    exportZone: cropBounds,
  }), [diagram, cropBounds])

  // Clean JSON export (with crop bounds)
  const jsonContent = useMemo(() => {
    return JSON.stringify(croppedDiagram, null, 2)
  }, [croppedDiagram])

  // TypeScript export
  const tsContent = useMemo(() => {
    return generateTypeScript(croppedDiagram)
  }, [croppedDiagram])

  // Shareable link
  const shareableLink = useMemo(() => {
    return createShareableLink(croppedDiagram)
  }, [croppedDiagram])

  const handleCopyJSON = async () => {
    const success = await copyToClipboard(jsonContent)
    if (success) {
      setCopiedJSON(true)
      setTimeout(() => setCopiedJSON(false), 2000)
    }
  }

  const handleCopyTS = async () => {
    const success = await copyToClipboard(tsContent)
    if (success) {
      setCopiedTS(true)
      setTimeout(() => setCopiedTS(false), 2000)
    }
  }

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareableLink)
    if (success) {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleDownloadSVG = async () => {
    setGeneratingSVG(true)
    try {
      const svg = generateSVG(croppedDiagram, { backgroundColor: '#ffffff' })
      downloadFile(svg, 'diagram.svg', 'image/svg+xml')
      setSvgDone(true)
      setTimeout(() => setSvgDone(false), 2000)
    } finally {
      setGeneratingSVG(false)
    }
  }

  const handleDownloadPNG = async () => {
    setGeneratingPNG(true)
    try {
      const pngBlob = await generatePNG(croppedDiagram, { scale: 2, backgroundColor: '#ffffff' })
      downloadFile(pngBlob, 'diagram.png', 'image/png')
      setPngDone(true)
      setTimeout(() => setPngDone(false), 2000)
    } catch (err) {
      console.error('PNG generation failed:', err)
    } finally {
      setGeneratingPNG(false)
    }
  }

  const handleResetCrop = () => {
    setCropBounds({
      x: 0,
      y: 0,
      width: diagram.layout.width,
      height: diagram.layout.height,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-xl bg-zinc-100 dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Share
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetCrop}
              className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
              title="Reset to full canvas"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive crop preview */}
        <div className="p-4 flex justify-center">
          <CropPreview
            diagram={diagram}
            cropBounds={cropBounds}
            onCropChange={setCropBounds}
          />
        </div>

        {/* Share options */}
        <div className="px-4 pb-4 space-y-2">
          {/* Code export */}
          <div className="grid grid-cols-2 gap-2">
            <ShareOption
              icon={FileCode}
              label="Copy TypeScript"
              description="ArcDiagram format"
              onClick={handleCopyTS}
              success={copiedTS}
            />
            <ShareOption
              icon={Braces}
              label="Copy JSON"
              description="Raw data"
              onClick={handleCopyJSON}
              success={copiedJSON}
            />
          </div>

          {/* Download actions */}
          <div className="grid grid-cols-2 gap-2">
            <ShareOption
              icon={FileImage}
              label="Download SVG"
              description="Vector"
              onClick={handleDownloadSVG}
              loading={generatingSVG}
              success={svgDone}
              secondary
            />
            <ShareOption
              icon={Image}
              label="Download PNG"
              description="2x resolution"
              onClick={handleDownloadPNG}
              loading={generatingPNG}
              success={pngDone}
              secondary
            />
          </div>

          {/* Link */}
          <ShareOption
            icon={Link}
            label="Copy Link"
            description="Shareable URL with embedded data"
            onClick={handleCopyLink}
            success={copiedLink}
            secondary
          />
        </div>
      </div>
    </div>
  )
}
