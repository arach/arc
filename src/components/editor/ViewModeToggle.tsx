import { Box, Layers, Ruler } from 'lucide-react'
import { getIsoStyle, nextIsoStyle } from '../../utils/isoStyles'
import type { IsoStyleId } from '../../utils/isoStyles'
import type { ViewMode } from '../../types/editor'

interface ViewModeToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  /** Isometric render style — the style button only shows in isometric view. */
  isoStyle?: IsoStyleId
  onIsoStyleChange?: (style: IsoStyleId) => void
}

export default function ViewModeToggle({
  viewMode,
  onViewModeChange,
  isoStyle = 'solid',
  onIsoStyleChange,
}: ViewModeToggleProps) {
  const current = getIsoStyle(isoStyle)
  const next = getIsoStyle(nextIsoStyle(isoStyle))

  return (
    <div className="arc-canvas-controls absolute bottom-3 right-44">
      <button
        type="button"
        onClick={() => onViewModeChange('2d')}
        className={`arc-canvas-btn${viewMode === '2d' ? ' is-active' : ''}`}
        title="2D view"
      >
        <Layers size={13} strokeWidth={1.75} />
      </button>

      <button
        type="button"
        onClick={() => onViewModeChange('isometric')}
        className={`arc-canvas-btn${viewMode === 'isometric' ? ' is-active' : ''}`}
        title="Isometric view"
      >
        <Box size={13} strokeWidth={1.75} />
      </button>

      {viewMode === 'isometric' && onIsoStyleChange && (
        <button
          type="button"
          onClick={() => onIsoStyleChange(nextIsoStyle(isoStyle))}
          className={`arc-canvas-btn${current.technical ? ' is-active' : ''}`}
          title={`Iso style: ${current.name} — click for ${next.name}`}
        >
          <Ruler size={13} strokeWidth={1.75} />
        </button>
      )}
    </div>
  )
}
