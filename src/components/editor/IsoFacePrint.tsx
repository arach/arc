import { isoTopFaceMatrix, resolveIsoLabelDir } from '../../utils/isometric'
import type { IsoFaceDir } from '../../utils/isometric'
import { getIconComponent } from '../../utils/iconRegistry'

const CHAR_W = 0.62

export function fitFacePrint(
  name: string,
  hasIcon: boolean,
  along: number,
  across: number
) {
  const padA = along * 0.14
  const padC = across * 0.14
  const innerAlong = Math.max(6, along - padA * 2)
  const innerAcross = Math.max(6, across - padC * 2)
  const chars = Math.max(name.trim().length, 1)

  let fontSize = Math.min(innerAlong / (chars * CHAR_W), innerAcross * (hasIcon ? 0.36 : 0.48), 15)
  fontSize = Math.max(5, fontSize)

  let iconSize = hasIcon ? fontSize * 1.3 : 0
  let gap = hasIcon ? fontSize * 0.2 : 0
  let stackH = iconSize + gap + (name.trim() ? fontSize : 0)

  if (hasIcon && stackH > innerAcross) {
    iconSize = 0
    gap = 0
    fontSize = Math.min(fontSize, innerAcross * 0.48)
    stackH = name.trim() ? fontSize : 0
  }
  if (stackH > innerAcross && stackH > 0) {
    const s = innerAcross / stackH
    fontSize *= s
    iconSize *= s
    gap *= s
    stackH = innerAcross
  }

  return { fontSize, iconSize, gap, stackH }
}

export default function IsoFacePrint({
  cx,
  cy,
  width,
  depth,
  name,
  icon,
  dir,
  flip,
  fontFamily = "'Inter', system-ui, sans-serif",
  uppercase = false,
  fill = '#fff',
}: {
  cx: number
  cy: number
  width: number
  depth: number
  name?: string
  icon?: string
  dir?: 'auto' | 'x' | 'y'
  flip?: boolean
  fontFamily?: string
  uppercase?: boolean
  fill?: string
}) {
  const label = (name || '').trim()
  if (!label && !icon) return null

  const faceDir: IsoFaceDir = resolveIsoLabelDir(dir, width, depth, flip)
  const alongY = faceDir === 'y' || faceDir === 'y-'
  const along = alongY ? depth : width
  const across = alongY ? width : depth

  const { fontSize, iconSize, gap, stackH } = fitFacePrint(label, Boolean(icon), along, across)
  const Icon = icon && iconSize > 0 ? getIconComponent(icon) : null
  const drawn = uppercase ? label.toUpperCase() : label

  let y = -stackH / 2
  const iconY = y
  if (Icon) y += iconSize + gap
  const textY = y + fontSize * 0.82

  return (
    <g
      transform={`translate(${cx}, ${cy}) matrix(${isoTopFaceMatrix(faceDir)})`}
      className="pointer-events-none"
    >
      {Icon && (
        <g
          transform={`translate(${-iconSize / 2}, ${iconY})`}
          color={fill}
        >
          <Icon width={iconSize} height={iconSize} strokeWidth={1.75} />
        </g>
      )}
      {drawn && (
        <text
          x={0}
          y={textY}
          textAnchor="middle"
          fill={fill}
          fontSize={fontSize}
          fontWeight={600}
          fontFamily={fontFamily}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={Math.max(0.8, fontSize * 0.16)}
          paintOrder="stroke"
          strokeLinejoin="round"
          style={{
            letterSpacing: uppercase ? '0.06em' : '-0.02em',
          }}
        >
          {drawn}
        </text>
      )}
    </g>
  )
}
