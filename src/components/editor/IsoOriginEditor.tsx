import { useState } from 'react'
import { isoToScreen } from '../../utils/isometric'
import type { NodePosition } from '../../types/editor'

const LEGEND = 26

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
    <label className="arc-iso-hud-field">
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

/** Tiny isometric triad — a legend, not a scene gizmo. */
function AxisLegend() {
  const o = { x: 34, y: 50 }
  const X = isoToScreen(LEGEND, 0, 0)
  const Y = isoToScreen(0, LEGEND, 0)
  const Z = isoToScreen(0, 0, LEGEND)
  const ink = 'var(--arc-ink-2)'
  const axes = [
    { key: 'X', x: o.x + X.screenX, y: o.y + X.screenY },
    { key: 'Y', x: o.x + Y.screenX, y: o.y + Y.screenY },
    { key: 'Z', x: o.x + Z.screenX, y: o.y + Z.screenY },
  ] as const

  return (
    <svg className="arc-iso-hud-legend" viewBox="0 0 68 58" aria-hidden="true">
      {axes.map((a) => (
        <g key={a.key}>
          <line
            x1={o.x}
            y1={o.y}
            x2={a.x}
            y2={a.y}
            stroke={ink}
            strokeWidth={1.25}
            strokeLinecap="round"
          />
          <text
            x={a.x}
            y={a.y - 4}
            textAnchor="middle"
            fill={ink}
            fontSize={8}
            fontFamily="var(--arc-font-mono, ui-monospace, monospace)"
            fontWeight={600}
          >
            {a.key}
          </text>
        </g>
      ))}
      <circle cx={o.x} cy={o.y} r={2.25} fill={ink} />
    </svg>
  )
}

export function IsoOriginHud({
  node,
  name,
  onChange,
}: {
  node: NodePosition
  name?: string
  onChange: (updates: { x?: number; y?: number; z?: number }) => void
}) {
  const z = node.z ?? 0

  return (
    <div
      className="arc-iso-hud"
      data-arc-float
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="arc-iso-hud-head">
        <span className="arc-iso-hud-kicker">Origin</span>
        {name && <span className="arc-iso-hud-name">{name}</span>}
      </div>
      <div className="arc-iso-hud-body">
        <AxisLegend />
        <div className="arc-iso-hud-fields">
          <CoordInput axis="X" value={node.x} onChange={(x) => onChange({ x })} />
          <CoordInput axis="Y" value={node.y} onChange={(y) => onChange({ y })} />
          <CoordInput axis="Z" value={z} onChange={(next) => onChange({ z: next })} />
        </div>
      </div>
    </div>
  )
}
