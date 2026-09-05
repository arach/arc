import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import {
  X, Check, Link, Image, FileImage,
  Loader2, Braces, RotateCcw, FileCode,
} from 'lucide-react'
import {
  generateSVG,
  generatePNG,
  createShareableLink,
  downloadFile,
  generateTypeScript,
} from '../../utils/exportUtils'
import { copyToClipboard } from '../../utils/fileOperations'
import { getContentBounds } from '../../utils/diagramHelpers'
import ArcDiagram from '../ArcDiagram'
import { useViewMode, useIsoStyle, useThemeId, useEditorState } from '../editor/EditorProvider'
import type { IsoStyleId } from '../../utils/isoStyles'
import type { ThemeId } from '../../utils/themes'

interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

function cropFromContent(diagram: any): CropRect {
  const content = getContentBounds(diagram.nodes, diagram.groups, diagram.images)
  const layout = diagram.layout || { width: 800, height: 400 }
  if (!content) {
    return { x: 0, y: 0, width: layout.width, height: layout.height }
  }
  const pad = 24
  const x = Math.max(0, Math.round(content.minX - pad))
  const y = Math.max(0, Math.round(content.minY - pad))
  return {
    x,
    y,
    width: Math.round(Math.min(layout.width, content.maxX + pad) - x),
    height: Math.round(Math.min(layout.height, content.maxY + pad) - y),
  }
}

function ShareOption({
  icon: Icon,
  label,
  description,
  onClick,
  loading = false,
  success = false,
  wide = false,
}: {
  icon: typeof Link
  label: string
  description: string
  onClick: () => void
  loading?: boolean
  success?: boolean
  wide?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`arc-share-option${success ? ' is-done' : ''}${wide ? ' is-wide' : ''}`}
    >
      <span className="arc-share-option-icon">
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : success ? (
          <Check />
        ) : (
          <Icon strokeWidth={1.75} />
        )}
      </span>
      <span className="arc-share-option-copy">
        <span className="arc-share-option-name">{success ? 'Done' : label}</span>
        <span className="arc-share-option-desc">{description}</span>
      </span>
    </button>
  )
}

/** Overlay in the same space ArcDiagram uses for a 2D fit: scale from top-left,
 *  zoom = min((w - 40) / layout.w, (h - 40) / layout.h, 1). */
function CropOverlay({
  layout,
  crop,
  onChange,
}: {
  layout: { width: number; height: number }
  crop: CropRect
  onChange: (next: CropRect) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 1, h: 1 })
  const drag = useRef<{
    type: string
    mouse: { x: number; y: number }
    bounds: CropRect
  } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      if (r.width > 0) setSize({ w: r.width, h: r.height })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const zoom = Math.min((size.w - 40) / layout.width, (size.h - 40) / layout.height, 1)
  const toLayout = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect()
    return { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom }
  }

  const onDown = (type: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    drag.current = { type, mouse: toLayout(e), bounds: { ...crop } }
  }

  const onMove = (e: React.MouseEvent) => {
    const d = drag.current
    if (!d) return
    const mouse = toLayout(e)
    const dx = mouse.x - d.mouse.x
    const dy = mouse.y - d.mouse.y
    const b = { ...d.bounds }
    if (d.type === 'move') {
      b.x = Math.max(0, Math.min(layout.width - b.width, b.x + dx))
      b.y = Math.max(0, Math.min(layout.height - b.height, b.y + dy))
    } else {
      if (d.type.includes('w')) {
        const x = b.x + dx
        const w = b.width - dx
        if (w >= 50 && x >= 0) { b.x = x; b.width = w }
      }
      if (d.type.includes('e')) {
        const w = b.width + dx
        if (w >= 50 && b.x + w <= layout.width) b.width = w
      }
      if (d.type.includes('n')) {
        const y = b.y + dy
        const h = b.height - dy
        if (h >= 50 && y >= 0) { b.y = y; b.height = h }
      }
      if (d.type.includes('s')) {
        const h = b.height + dy
        if (h >= 50 && b.y + h <= layout.height) b.height = h
      }
    }
    onChange({
      x: Math.round(b.x),
      y: Math.round(b.y),
      width: Math.round(b.width),
      height: Math.round(b.height),
    })
  }

  const onUp = () => { drag.current = null }

  const x = crop.x * zoom
  const y = crop.y * zoom
  const w = crop.width * zoom
  const h = crop.height * zoom

  return (
    <div
      ref={ref}
      className="arc-share-crop-layer"
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
    >
      <svg className="arc-share-crop-svg-layer">
        <path
          d={`M0 0H${size.w}V${size.h}H0Z M${x} ${y}h${w}v${h}h${-w}Z`}
          fill="rgba(12,16,20,0.4)"
          fillRule="evenodd"
          style={{ pointerEvents: 'none' }}
        />
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          className="arc-share-crop-frame"
          onMouseDown={onDown('move')}
        />
        {[
          { cx: x, cy: y, type: 'nw', cursor: 'nwse-resize' },
          { cx: x + w, cy: y, type: 'ne', cursor: 'nesw-resize' },
          { cx: x, cy: y + h, type: 'sw', cursor: 'nesw-resize' },
          { cx: x + w, cy: y + h, type: 'se', cursor: 'nwse-resize' },
        ].map((p) => (
          <circle
            key={p.type}
            cx={p.cx}
            cy={p.cy}
            r={5}
            className="arc-share-crop-handle"
            style={{ cursor: p.cursor }}
            onMouseDown={onDown(p.type)}
          />
        ))}
      </svg>
      <div className="arc-share-crop-size">
        {crop.width} × {crop.height}
      </div>
    </div>
  )
}

export default function ShareSheet({ diagram, onClose }: {
  diagram: any
  viewportBounds?: { x: number; y: number; width: number; height: number } | null
  onClose: () => void
}) {
  const viewMode = useViewMode()
  const isoStyle = useIsoStyle()
  const themeId = useThemeId()
  const editor = useEditorState()
  const isIso = viewMode === 'isometric'

  const [cropBounds, setCropBounds] = useState(() => cropFromContent(diagram))
  const [copiedJSON, setCopiedJSON] = useState(false)
  const [copiedTS, setCopiedTS] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [generatingSVG, setGeneratingSVG] = useState(false)
  const [generatingPNG, setGeneratingPNG] = useState(false)
  const [svgDone, setSvgDone] = useState(false)
  const [pngDone, setPngDone] = useState(false)

  const croppedDiagram = useMemo(() => ({
    ...diagram,
    exportZone: isIso ? undefined : cropBounds,
  }), [diagram, cropBounds, isIso])

  const jsonContent = useMemo(() => JSON.stringify(croppedDiagram, null, 2), [croppedDiagram])
  const tsContent = useMemo(() => generateTypeScript(croppedDiagram), [croppedDiagram])
  const shareableLink = useMemo(() => createShareableLink(croppedDiagram), [croppedDiagram])

  const flash = (set: (v: boolean) => void) => {
    set(true)
    setTimeout(() => set(false), 2000)
  }

  const handleCopyJSON = async () => {
    if (await copyToClipboard(jsonContent)) flash(setCopiedJSON)
  }
  const handleCopyTS = async () => {
    if (await copyToClipboard(tsContent)) flash(setCopiedTS)
  }
  const handleCopyLink = async () => {
    if (await copyToClipboard(shareableLink)) flash(setCopiedLink)
  }
  const handleDownloadSVG = async () => {
    setGeneratingSVG(true)
    try {
      downloadFile(generateSVG(croppedDiagram, { backgroundColor: '#ffffff' }), 'diagram.svg', 'image/svg+xml')
      flash(setSvgDone)
    } finally {
      setGeneratingSVG(false)
    }
  }
  const handleDownloadPNG = async () => {
    setGeneratingPNG(true)
    try {
      const pngBlob = await generatePNG(croppedDiagram, { scale: 2, backgroundColor: '#ffffff' })
      downloadFile(pngBlob, 'diagram.png', 'image/png')
      flash(setPngDone)
    } catch (err) {
      console.error('PNG generation failed:', err)
    } finally {
      setGeneratingPNG(false)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="arc-share-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="arc-share-dialog" role="dialog" aria-modal="true" aria-labelledby="arc-share-title">
        <div className="arc-share-head">
          <h2 id="arc-share-title" className="arc-share-title">Share</h2>
          {!isIso && (
            <button
              type="button"
              onClick={() => setCropBounds(cropFromContent(diagram))}
              className="arc-editor-btn-ghost"
              title="Fit crop to drawing"
            >
              <RotateCcw />
              Fit
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="arc-editor-btn"
            title="Close"
            aria-label="Close share"
          >
            <X />
          </button>
        </div>

        <div className="arc-share-stage">
          <ArcDiagram
            data={diagram}
            interactive={false}
            hoverEffects={false}
            showArcToggle={false}
            showControls={false}
            showMinimap={false}
            showLegend={false}
            defaultZoom="fit"
            maxFitZoom={1}
            defaultViewMode={viewMode as '2d' | 'isometric'}
            defaultIsoStyle={isoStyle as IsoStyleId}
            theme={(themeId as ThemeId) || 'command'}
            mode={editor.colorMode === 'light' ? 'light' : 'dark'}
            frame="none"
            className="arc-share-live"
          />
          {!isIso && (
            <CropOverlay
              layout={diagram.layout}
              crop={cropBounds}
              onChange={setCropBounds}
            />
          )}
        </div>

        <div className="arc-share-actions">
          <ShareOption
            icon={FileCode}
            label="TypeScript"
            description="Module"
            onClick={handleCopyTS}
            success={copiedTS}
          />
          <ShareOption
            icon={Braces}
            label="JSON"
            description="Document"
            onClick={handleCopyJSON}
            success={copiedJSON}
          />
          <ShareOption
            icon={FileImage}
            label="SVG"
            description="Vector"
            onClick={handleDownloadSVG}
            loading={generatingSVG}
            success={svgDone}
          />
          <ShareOption
            icon={Image}
            label="PNG"
            description="2× raster"
            onClick={handleDownloadPNG}
            loading={generatingPNG}
            success={pngDone}
          />
          <ShareOption
            icon={Link}
            label="Copy link"
            description="URL with the diagram embedded"
            onClick={handleCopyLink}
            success={copiedLink}
            wide
          />
        </div>
      </div>
    </div>
  )
}
