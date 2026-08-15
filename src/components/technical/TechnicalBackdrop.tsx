// Paper stock for the technical isometric styles.
//
// The backdrop fills its whole surface — the editor viewport, or a fixed
// canvas in the packaged renderer — so the drawing sits on paper edge to edge
// rather than on a floating sheet. The graph-paper grid takes an optional
// transform so it stays pinned to the (panned, zoomed) drawing underneath it.

import { useId } from 'react'
import TechnicalDefs, { gridPatternIds, grainFilterId, paperGradientId } from './TechnicalDefs'
import type { IsoStyleSpec } from '../../utils/isoStyles'

interface TechnicalBackdropProps {
  style: IsoStyleSpec
  /** Explicit rect to cover; defaults to the full surface. */
  rect?: { x: number; y: number; width: number; height: number }
  /** Canvas transform, so the grid tracks the content. */
  pan?: { x: number; y: number }
  zoom?: number
  className?: string
}

export default function TechnicalBackdrop({
  style,
  rect,
  pan,
  zoom = 1,
  className = 'absolute inset-0 w-full h-full pointer-events-none',
}: TechnicalBackdropProps) {
  const uid = useId().replace(/:/g, '')

  const gridTransform = pan
    ? `translate(${pan.x} ${pan.y}) scale(${zoom})`
    : zoom !== 1
      ? `scale(${zoom})`
      : ''

  const box = rect
    ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    : { x: 0, y: 0, width: '100%' as const, height: '100%' as const }

  return (
    <svg className={className} aria-hidden="true">
      <TechnicalDefs uid={uid} style={style} gridTransform={gridTransform} />

      {/* Sheet stock */}
      <rect {...box} fill={`url(#${paperGradientId(uid)})`} />

      {/* Isometric graph paper */}
      {gridPatternIds(uid).map((id) => (
        <rect key={id} {...box} fill={`url(#${id})`} opacity={0.6} />
      ))}

      {/* Paper grain */}
      {style.paper.grain > 0 && (
        <rect {...box} filter={`url(#${grainFilterId(uid)})`} opacity={style.paper.grain} />
      )}
    </svg>
  )
}
