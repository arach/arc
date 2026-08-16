import { Box, Layers, Ruler } from 'lucide-react'
import { getIsoStyle, nextTechnicalStyle, DEFAULT_TECHNICAL_STYLE } from '../../utils/isoStyles'
import type { IsoStyleId } from '../../utils/isoStyles'
import type { ViewMode } from '../../types/editor'

interface ViewModeToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  isoStyle?: IsoStyleId
  onIsoStyleChange?: (style: IsoStyleId) => void
}

/**
 * Three destinations, each one click away from either of the others:
 *
 *   2D · isometric (shaded) · isometric (technical plate)
 *
 * The third slot used to be a style cycler that only worked once you were
 * already in the isometric view, so reaching a plate from 2D took two clicks
 * through a button whose label gave no hint of that. It is a view now; clicking
 * it again while you are there swaps the plate's ink.
 */
export default function ViewModeToggle({
  viewMode,
  onViewModeChange,
  isoStyle = 'solid',
  onIsoStyleChange,
}: ViewModeToggleProps) {
  const current = getIsoStyle(isoStyle)
  const isIso = viewMode === 'isometric'
  const onPlate = isIso && current.technical
  const onSolidIso = isIso && !current.technical
  const nextPlate = getIsoStyle(onPlate ? nextTechnicalStyle(isoStyle) : DEFAULT_TECHNICAL_STYLE)

  const goSolid = () => {
    if (onIsoStyleChange && current.technical) onIsoStyleChange('solid')
    if (!isIso) onViewModeChange('isometric')
  }

  const goPlate = () => {
    onIsoStyleChange?.(onPlate ? nextTechnicalStyle(isoStyle) : DEFAULT_TECHNICAL_STYLE)
    if (!isIso) onViewModeChange('isometric')
  }

  return (
    <div className="arc-canvas-controls" role="group" aria-label="View">
      <button
        type="button"
        onClick={() => onViewModeChange('2d')}
        className={`arc-canvas-btn${viewMode === '2d' ? ' is-active' : ''}`}
        aria-pressed={viewMode === '2d'}
        title="Plan view"
      >
        <Layers size={13} strokeWidth={1.75} />
      </button>

      <button
        type="button"
        onClick={goSolid}
        className={`arc-canvas-btn${onSolidIso ? ' is-active' : ''}`}
        aria-pressed={onSolidIso}
        title="Isometric — shaded"
      >
        <Box size={13} strokeWidth={1.75} />
      </button>

      {onIsoStyleChange && (
        <button
          type="button"
          onClick={goPlate}
          className={`arc-canvas-btn${onPlate ? ' is-active' : ''}`}
          aria-pressed={onPlate}
          title={
            onPlate
              ? `Technical plate: ${current.name} — click for ${nextPlate.name}`
              : `Technical plate — ${nextPlate.name}`
          }
        >
          <Ruler size={13} strokeWidth={1.75} />
        </button>
      )}
    </div>
  )
}
