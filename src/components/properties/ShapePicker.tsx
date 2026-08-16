// Per-node silhouette.
//
// Node shape is normally the theme's business — it is part of what makes
// `engineering` look unlike `command`. But a single box sometimes wants to read
// differently from its neighbours (a queue, an external system), so a node can
// override it. Nothing selected means "follow the theme", and the theme's
// current shape is shown as the inherited one rather than left blank.

import { NODE_SHAPES, type NodeShape } from '../../utils/nodeShape'

/** Miniature of each silhouette, drawn on the same 26×16 box. */
function ShapeGlyph({ shape }: { shape: NodeShape }) {
  const w = 26
  const h = 16
  const cut = 5

  if (shape === 'chamfer') {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <path
          d={`M ${cut} 0 L ${w - cut} 0 L ${w} ${cut} L ${w} ${h - cut} L ${w - cut} ${h} L ${cut} ${h} L 0 ${h - cut} L 0 ${cut} Z`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
        />
      </svg>
    )
  }

  if (shape === 'notch') {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <path
          d={`M 0 0 L ${w - cut} 0 L ${w} ${cut} L ${w} ${h} L 0 ${h} Z`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
        />
      </svg>
    )
  }

  const rx = shape === 'square' ? 0 : shape === 'pill' ? h / 2 : 4
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <rect
        x={0.6}
        y={0.6}
        width={w - 1.2}
        height={h - 1.2}
        rx={rx}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
      />
    </svg>
  )
}

interface ShapePickerProps {
  /** The node's own override, if it has one. */
  value?: NodeShape
  /** What the theme would draw — shown as inherited when there is no override. */
  inherited: NodeShape
  onChange: (shape: NodeShape) => void
}

export default function ShapePicker({ value, inherited, onChange }: ShapePickerProps) {
  return (
    <div className="arc-insp-shape-row" role="group" aria-label="Node shape">
      {NODE_SHAPES.map(({ id, label }) => {
        const selected = value === id
        const isInherited = !value && inherited === id
        return (
          <button
            key={id}
            type="button"
            className={`arc-insp-shape${selected ? ' is-selected' : ''}${isInherited ? ' is-inherited' : ''}`}
            title={isInherited ? `${label} — from the theme` : label}
            aria-label={label}
            aria-pressed={selected}
            onClick={() => onChange(id)}
          >
            <ShapeGlyph shape={id} />
          </button>
        )
      })}
    </div>
  )
}
