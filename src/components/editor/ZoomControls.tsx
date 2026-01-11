import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { ZOOM_MIN, ZOOM_MAX } from '../../types/editor'

interface ZoomControlsProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onFitToView: () => void
}

export default function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onFitToView,
}: ZoomControlsProps) {
  const zoomPercent = Math.round(zoom * 100)

  return (
    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 p-1">
      <button
        onClick={onZoomOut}
        disabled={zoom <= ZOOM_MIN}
        className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Zoom out (scroll down)"
      >
        <ZoomOut className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
      </button>

      <button
        onClick={onReset}
        className="px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded min-w-[48px] transition-colors"
        title="Reset to 100%"
      >
        {zoomPercent}%
      </button>

      <button
        onClick={onZoomIn}
        disabled={zoom >= ZOOM_MAX}
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
