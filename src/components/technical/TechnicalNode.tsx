// A component drawn as an engineering-manual plate: hatched faces keyed to the
// node's color, solid visible edges, dashed hidden edges, and a monospace
// callout on a leader line.
//
// Callouts are a separate component on purpose — both renderers draw every box
// first and every callout second, so a nearer component never paints over a
// neighbour's label.

import { hatchPatternIds } from './TechnicalDefs'
import type { IsoFace } from './TechnicalDefs'
import { componentTag } from '../../utils/isoWire'
import type { WireBox } from '../../utils/isoWire'
import { materialFor, d } from '../../utils/isoStyles'
import type { IsoStyleSpec } from '../../utils/isoStyles'
import { getIconComponent } from '../../utils/iconRegistry'

interface TechnicalBoxProps {
  uid: string
  style: IsoStyleSpec
  box: WireBox
  /** Logical color name — selects the hatch signature, not a hue. */
  color?: string
  /** Component number shown on the top face. */
  tag?: number
  selected?: boolean
  opacity?: number
  onClick?: () => void
  onPointerDown?: (e: React.PointerEvent) => void
}

export function TechnicalBox({
  uid,
  style,
  box,
  color,
  tag,
  selected = false,
  opacity,
  onClick,
  onPointerDown,
}: TechnicalBoxProps) {
  const kind = materialFor(color)
  const edgeColor = selected ? style.ink.accent : style.ink.line
  const textColor = selected ? style.ink.accent : style.ink.text

  const faces: Array<{ face: IsoFace; path: string }> = [
    { face: 'left', path: box.left },
    { face: 'right', path: box.right },
    { face: 'top', path: box.top },
  ]

  return (
    <g
      className={onClick || onPointerDown ? 'cursor-pointer' : undefined}
      opacity={opacity}
      onClick={onClick}
      onPointerDown={onPointerDown}
    >
      {/* Faces: an opaque wash for occlusion, then the material hatching */}
      {faces.map(({ face, path }) => (
        <g key={face}>
          <path d={path} fill={style.face[face]} />
          {hatchPatternIds(uid, kind, face).map((id) => (
            <path key={id} d={path} fill={`url(#${id})`} opacity={style.hatchOpacity[face]} />
          ))}
        </g>
      ))}

      {/* Hidden edges */}
      <path
        d={box.hidden}
        fill="none"
        stroke={style.ink.hidden}
        strokeWidth={style.strokeWidth * 0.55}
        strokeDasharray="3.5 3"
        opacity={0.85}
      />

      {/* Visible edges */}
      <path
        d={box.visible}
        fill="none"
        stroke={edgeColor}
        strokeWidth={selected ? style.strokeWidth * 1.7 : style.strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Component tag on the top face */}
      {tag != null && (
        <text
          x={box.topCenter.x}
          y={box.topCenter.y + d(3)}
          textAnchor="middle"
          fill={textColor}
          fontSize={d(8)}
          fontWeight={600}
          fontFamily={style.font}
          style={{ letterSpacing: '0.1em' }}
          pointerEvents="none"
        >
          {componentTag(tag)}
        </text>
      )}
    </g>
  )
}

interface TechnicalCalloutProps {
  style: IsoStyleSpec
  box: WireBox
  name: string
  subtitle?: string
  icon?: string
  selected?: boolean
  opacity?: number
}

export function TechnicalCallout({
  style,
  box,
  name,
  subtitle,
  icon,
  selected = false,
  opacity,
}: TechnicalCalloutProps) {
  const edgeColor = selected ? style.ink.accent : style.ink.line
  const textColor = selected ? style.ink.accent : style.ink.text
  const Icon = icon ? getIconComponent(icon) : null

  const label = (name || '').toUpperCase()
  const spec = (subtitle || '').toUpperCase()
  // Callout stacks above a leader shelf: name on top, spec line beneath it.
  const shelfY = box.minY - d(11)
  const subtitleY = shelfY - d(4)
  const nameY = spec ? shelfY - d(15) : shelfY - d(4)
  const iconSize = d(9)
  const iconGap = d(3)
  const iconPad = Icon ? iconSize + iconGap : 0
  const labelWidth = Math.max(label.length * d(5.6) + iconPad, spec.length * d(4.4), d(24))
  const nameX = box.topCenter.x + iconPad / 2
  const iconX = nameX - (label.length * d(5.6)) / 2 - iconGap - iconSize
  const iconY = nameY - iconSize + d(1)

  return (
    <g pointerEvents="none" opacity={opacity}>
      <line
        x1={box.topCenter.x}
        y1={box.topCenter.y - d(6)}
        x2={box.topCenter.x}
        y2={shelfY}
        stroke={edgeColor}
        strokeWidth={style.strokeWidth * 0.6}
      />
      <line
        x1={box.topCenter.x - labelWidth / 2}
        y1={shelfY}
        x2={box.topCenter.x + labelWidth / 2}
        y2={shelfY}
        stroke={edgeColor}
        strokeWidth={style.strokeWidth * 0.6}
      />
      {Icon && (
        <g transform={`translate(${iconX}, ${iconY})`} color={textColor}>
          <Icon width={iconSize} height={iconSize} strokeWidth={1.75} />
        </g>
      )}
      <text
        x={nameX}
        y={nameY}
        textAnchor="middle"
        fill={textColor}
        fontSize={d(9.5)}
        fontWeight={600}
        fontFamily={style.font}
        stroke={style.paper.from}
        strokeWidth={d(3)}
        paintOrder="stroke"
        strokeLinejoin="round"
        style={{ letterSpacing: '0.12em' }}
      >
        {label}
      </text>
      {spec && (
        <text
          x={box.topCenter.x}
          y={subtitleY}
          textAnchor="middle"
          fill={style.ink.muted}
          fontSize={d(7.5)}
          fontFamily={style.font}
          stroke={style.paper.from}
          strokeWidth={d(2.5)}
          paintOrder="stroke"
          strokeLinejoin="round"
          style={{ letterSpacing: '0.1em' }}
        >
          {spec}
        </text>
      )}
    </g>
  )
}
