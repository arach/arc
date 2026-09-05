import { useState } from 'react'
import { isoToScreen } from '../../utils/isometric'
import type { NodePosition, Point } from '../../types/editor'
import type { IsoStyleSpec } from '../../utils/isoStyles'

const AXIS = 42

function CoordInput({
  axis,
  value,
  onChange,
}: {
  axis: 'X' | 'Y' | 'Z'
  value: number
  onChange: (n: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? String(Math.round(value * 10) / 10)

  return (
    <label className="arc-iso-xyz-field">
      <span>{axis}</span>
      <input
        type="text"
        inputMode="decimal"
        value={shown}
        onFocus={() => setDraft(String(Math.round(value * 10) / 10))}
        onChange={(e) => {
          setDraft(e.target.value)
          const n = Number(e.target.value)
          if (Number.isFinite(n)) onChange(n)
        }}
        onBlur={() => setDraft(null)}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      />
    </label>
  )
}

export function IsoAxisGizmo({
  node,
  originX,
  originY,
  isoStyle,
}: {
  node: NodePosition
  originX: number
  originY: number
  isoStyle?: IsoStyleSpec | null
}) {
  const z = node.z ?? 0
  const o = isoToScreen(node.x, node.y, z)
  const x1 = originX + o.screenX
  const y1 = originY + o.screenY
  const X = isoToScreen(node.x + AXIS, node.y, z)
  const Y = isoToScreen(node.x, node.y + AXIS, z)
  const Z = isoToScreen(node.x, node.y, z + AXIS)
  const ink = isoStyle?.technical ? isoStyle.ink.line : 'var(--arc-ink)'
  const acc = isoStyle?.technical ? isoStyle.ink.accent : 'var(--arc-acc)'
  const muted = isoStyle?.technical ? isoStyle.ink.muted : 'var(--arc-muted)'

  const axes = [
    { key: 'X', x2: originX + X.screenX, y2: originY + X.screenY, color: ink },
    { key: 'Y', x2: originX + Y.screenX, y2: originY + Y.screenY, color: muted },
    { key: 'Z', x2: originX + Z.screenX, y2: originY + Z.screenY, color: acc },
  ] as const

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      {axes.map((a) => (
        <g key={a.key}>
          <line
            x1={x1}
            y1={y1}
            x2={a.x2}
            y2={a.y2}
            stroke={a.color}
            strokeWidth={1.25}
            strokeLinecap="round"
          />
          <circle cx={a.x2} cy={a.y2} r={2} fill={a.color} />
          <text
            x={a.x2}
            y={a.y2 - 6}
            textAnchor="middle"
            fill={a.color}
            fontSize={9}
            fontFamily="var(--arc-font-mono, ui-monospace, monospace)"
            fontWeight={600}
          >
            {a.key}
          </text>
        </g>
      ))}
      <circle cx={x1} cy={y1} r={2.5} fill={acc} />
    </svg>
  )
}

export function IsoCoordHud({
  node,
  originX,
  originY,
  zoom,
  pan,
  onChange,
}: {
  node: NodePosition
  originX: number
  originY: number
  zoom: number
  pan: Point
  onChange: (updates: { x?: number; y?: number; z?: number }) => void
}) {
  const z = node.z ?? 0
  const o = isoToScreen(node.x, node.y, z)
  const left = (originX + o.screenX) * zoom + pan.x + 16
  const top = (originY + o.screenY) * zoom + pan.y - 18

  return (
    <div
      className="arc-iso-xyz"
      data-arc-float
      style={{ left, top }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <CoordInput axis="X" value={node.x} onChange={(x) => onChange({ x })} />
      <CoordInput axis="Y" value={node.y} onChange={(y) => onChange({ y })} />
      <CoordInput axis="Z" value={z} onChange={(next) => onChange({ z: next })} />
    </div>
  )
}
