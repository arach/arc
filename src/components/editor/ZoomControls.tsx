import { useState, useRef, useEffect, useCallback } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

interface ZoomControlsProps {
  zoom: number
  minZoom: number
  maxZoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomChange: (zoom: number) => void
  onReset: () => void
  onFitToView: () => void
}

export default function ZoomControls({
  zoom,
  minZoom,
  maxZoom,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onReset,
  onFitToView,
}: ZoomControlsProps) {
  const zoomPercent = Math.round(zoom * 100)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const clickTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleConfirm = useCallback(() => {
    const parsed = parseInt(editValue, 10)
    if (!isNaN(parsed)) {
      const clampedPercent = Math.min(Math.max(parsed, minZoom * 100), maxZoom * 100)
      onZoomChange(clampedPercent / 100)
    }
    setIsEditing(false)
  }, [editValue, minZoom, maxZoom, onZoomChange])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setEditValue('')
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }, [handleConfirm, handleCancel])

  const handleClick = useCallback(() => {
    if (clickTimeoutRef.current !== null) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
      onReset()
      return
    }

    clickTimeoutRef.current = window.setTimeout(() => {
      clickTimeoutRef.current = null
      setEditValue(String(zoomPercent))
      setIsEditing(true)
    }, 200)
  }, [zoomPercent, onReset])

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current !== null) {
        clearTimeout(clickTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="arc-canvas-controls absolute bottom-3 right-3">
      <button
        type="button"
        className="arc-canvas-btn"
        onClick={onZoomOut}
        disabled={zoom <= minZoom}
        title="Zoom out"
      >
        <ZoomOut size={15} strokeWidth={1.75} />
      </button>

      {isEditing ? (
        <div className="arc-canvas-zoom-input-wrap">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleConfirm}
            className="arc-canvas-zoom-input"
            aria-label="Zoom percentage"
          />
          <span className="arc-canvas-zoom-input-suffix">%</span>
        </div>
      ) : (
        <button
          type="button"
          className="arc-canvas-zoom"
          onClick={handleClick}
          title="Click to edit, double-click to reset"
        >
          {zoomPercent}%
        </button>
      )}

      <button
        type="button"
        className="arc-canvas-btn"
        onClick={onZoomIn}
        disabled={zoom >= maxZoom}
        title="Zoom in"
      >
        <ZoomIn size={15} strokeWidth={1.75} />
      </button>

      <div className="arc-canvas-divider" />

      <button
        type="button"
        className="arc-canvas-btn"
        onClick={onFitToView}
        title="Fit to view"
      >
        <Maximize2 size={15} strokeWidth={1.75} />
      </button>
    </div>
  )
}