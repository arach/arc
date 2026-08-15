// Shared <defs> for the technical isometric styles: hatch patterns aligned to
// the three isometric face axes, paper treatment, and open-chevron arrowheads.
//
// Each consumer renders its own copy with a unique `uid` so several canvases
// (or several styles) can coexist on one page without id collisions.

import type { IsoStyleSpec, HatchKind } from '../../utils/isoStyles'

export type IsoFace = 'top' | 'right' | 'left'

// Screen-space direction of each face axis under the 30° projection.
//   +X projects up-right (-30°), +Y up-left (+30°), +Z straight up (90°).
const FACE_AXES: Record<IsoFace, [string, string]> = {
  top: ['n30', 'p30'],
  right: ['n30', 'v'],
  left: ['p30', 'v'],
}

const DIR_ANGLE: Record<string, number> = { n30: -30, p30: 30, v: 90 }

interface HatchType {
  key: string
  spacing: number
  strokeWidth: number
  dash?: string
}

const HATCH_TYPES: HatchType[] = [
  { key: 'line', spacing: 6.2, strokeWidth: 0.55 },
  { key: 'dense', spacing: 3.1, strokeWidth: 0.45 },
  { key: 'dash', spacing: 6.2, strokeWidth: 0.55, dash: '2.6 2.6' },
]

const GRID_SPACING = 22

/** Pattern ids to paint over a face, one layer per hatch direction. */
export function hatchPatternIds(uid: string, kind: HatchKind, face: IsoFace): string[] {
  const [primary, secondary] = FACE_AXES[face]
  switch (kind) {
    case 'plain':
      return []
    case 'lines':
      return [`${uid}-line-${primary}`]
    case 'cross':
      return [`${uid}-line-${primary}`, `${uid}-line-${secondary}`]
    case 'dense':
      return [`${uid}-dense-${primary}`]
    case 'dashes':
      return [`${uid}-dash-${primary}`]
    case 'dots':
      return [`${uid}-dot`]
    default:
      return [`${uid}-line-${primary}`]
  }
}

export const paperGradientId = (uid: string) => `${uid}-paper`
export const grainFilterId = (uid: string) => `${uid}-grain`
export const arrowMarkerId = (uid: string, variant: 'line' | 'accent' = 'line') =>
  `${uid}-arrow-${variant}`
export const gridPatternIds = (uid: string) => [`${uid}-grid-n30`, `${uid}-grid-p30`]

export default function TechnicalDefs({
  uid,
  style,
  /** Extra transform applied to the graph-paper grid, so it can be pinned to
   *  panned/zoomed content while the paper itself fills the viewport. */
  gridTransform = '',
}: {
  uid: string
  style: IsoStyleSpec
  gridTransform?: string
}) {
  return (
    <defs>
      {/* Face hatching, one pattern per (type, direction) pair */}
      {HATCH_TYPES.flatMap((type) =>
        Object.entries(DIR_ANGLE).map(([dir, angle]) => (
          <pattern
            key={`${type.key}-${dir}`}
            id={`${uid}-${type.key}-${dir}`}
            width={type.spacing}
            height={type.spacing}
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${angle})`}
          >
            <line
              x1={-1}
              y1={type.spacing / 2}
              x2={type.spacing + 1}
              y2={type.spacing / 2}
              stroke={style.ink.hatch}
              strokeWidth={type.strokeWidth}
              strokeDasharray={type.dash}
            />
          </pattern>
        ))
      )}

      {/* Stipple */}
      <pattern id={`${uid}-dot`} width={4.5} height={4.5} patternUnits="userSpaceOnUse">
        <circle cx={2.25} cy={2.25} r={0.55} fill={style.ink.hatch} />
      </pattern>

      {/* Isometric graph-paper grid for the sheet */}
      {[
        { id: `${uid}-grid-n30`, angle: -30 },
        { id: `${uid}-grid-p30`, angle: 30 },
      ].map(({ id, angle }) => (
        <pattern
          key={id}
          id={id}
          width={GRID_SPACING}
          height={GRID_SPACING}
          patternUnits="userSpaceOnUse"
          patternTransform={`${gridTransform} rotate(${angle})`.trim()}
        >
          <line
            x1={-1}
            y1={GRID_SPACING / 2}
            x2={GRID_SPACING + 1}
            y2={GRID_SPACING / 2}
            stroke={style.paper.grid}
            strokeWidth={0.5}
          />
        </pattern>
      ))}

      {/* Sheet stock */}
      <linearGradient id={paperGradientId(uid)} x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0%" stopColor={style.paper.from} />
        <stop offset="100%" stopColor={style.paper.to} />
      </linearGradient>

      {/* Paper grain */}
      <filter id={grainFilterId(uid)} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>

      {/* Open chevron arrowheads — drawn, not filled, like a plotted drawing */}
      {(['line', 'accent'] as const).map((variant) => (
        <marker
          key={variant}
          id={arrowMarkerId(uid, variant)}
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="4"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 1 1 L 8 4 L 1 7"
            fill="none"
            stroke={variant === 'accent' ? style.ink.accent : style.ink.line}
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      ))}
    </defs>
  )
}
