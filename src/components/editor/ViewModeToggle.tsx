import { Box, Layers } from 'lucide-react'
import type { ViewMode } from '../../types/editor'

interface ViewModeToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export default function ViewModeToggle({
  viewMode,
  onViewModeChange,
}: ViewModeToggleProps) {
  return (
    <div className="arc-canvas-controls absolute bottom-3 right-44">
      <button
        type="button"
        onClick={() => onViewModeChange('2d')}
        className={`arc-canvas-btn${viewMode === '2d' ? ' is-active' : ''}`}
        title="2D view"
      >
        <Layers size={15} strokeWidth={1.75} />
      </button>

      <button
        type="button"
        onClick={() => onViewModeChange('isometric')}
        className={`arc-canvas-btn${viewMode === 'isometric' ? ' is-active' : ''}`}
        title="Isometric view"
      >
        <Box size={15} strokeWidth={1.75} />
      </button>
    </div>
  )
}