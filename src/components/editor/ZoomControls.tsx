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

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleConfirm = useCallback(() => {
    const parsed = parseInt(editValue, 10)
    if (!isNaN(parsed)) {
      // Clamp to valid range
      const clampedPercent = Math.min(Math.max(parsed, minZoom * 100), maxZoom * 100)
      const newZoom = clampedPercent / 100
      onZoomChange(newZoom)
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
    // If there's a pending double-click timeout, this is a double-click
    if (clickTimeoutRef.current !== null) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
      // Double-click: reset to initial zoom
      onReset()
      return
    }

    // Set a timeout to detect if this is a single or double click
    clickTimeoutRef.current = window.setTimeout(() => {
      clickTimeoutRef.current = null
      // Single click: start editing
      setEditValue(String(zoomPercent))
      setIsEditing(true)
    }, 200)
  }, [zoomPercent, onReset])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current !== null) {
        clearTimeout(clickTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 p-1">
      <button
        onClick={onZoomOut}
        disabled={zoom <= minZoom}
        className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Zoom out (scroll down)"
      >
        <ZoomOut className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
      </button>

      {isEditing ? (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleConfirm}
            className="w-[48px] px-1 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700 rounded border border-zinc-300 dark:border-zinc-600 text-center outline-none focus:border-blue-500"
            aria-label="Zoom percentage"
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none">
            %
          </span>
        </div>
      ) : (
        <button
          onClick={handleClick}
          className="px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded min-w-[48px] transition-colors"
          title="Click to edit, double-click to reset"
        >
          {zoomPercent}%
        </button>
      )}

      <button
        onClick={onZoomIn}
        disabled={zoom >= maxZoom}
        className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Zoom in (scroll up)"
      >
        <ZoomIn className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
      </button>

      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

      <button
        onClick={onFitToView}
        className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        title="Fit to view"
      >
        <Maximize2 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
      </button>
    </div>
  )
}
