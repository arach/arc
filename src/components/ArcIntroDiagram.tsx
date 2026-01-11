import React from 'react'
import { Monitor, Grid, Layers, Upload, FileCode } from 'lucide-react'

const layout = { width: 700, height: 340 }

const nodeSizes = {
  large: { width: 210, height: 85 },
  normal: { width: 145, height: 68 },
  small: { width: 95, height: 42 },
}

const nodes = {
  editor: { x: 25, y: 15, size: 'large' },
  templates: { x: 25, y: 125, size: 'normal' },
  model: { x: 280, y: 125, size: 'normal' },
  exporters: { x: 280, y: 220, size: 'normal' },
  docs: { x: 520, y: 125, size: 'normal' },
}

const nodeData = {
  editor: {
    icon: Monitor,
    name: 'Arc Editor',
    subtitle: 'Canvas UI',
    description: 'Drag nodes, connect systems, manage layers.',
    color: 'violet',
  },
  templates: {
    icon: Grid,
    name: 'Templates',
    subtitle: 'Themes',
    description: 'Presets for sizes, palettes, and typography.',
    color: 'amber',
  },
  model: {
    icon: Layers,
    name: 'Diagram Model',
    subtitle: 'JSON / TS',
    description: 'Layout, nodes, connectors, metadata.',
    color: 'blue',
  },
  exporters: {
    icon: Upload,
    name: 'Exporters',
    subtitle: 'SVG / PNG / TS',
    description: 'Render outputs for docs and decks.',
    color: 'emerald',
  },
  docs: {
    icon: FileCode,
    name: 'Docs + Apps',
    subtitle: 'Consumers',
    description: 'Embed configs in docs, wikis, and apps.',
    color: 'zinc',
  },
}

const colors = {
  emerald: {
    stroke: 'stroke-emerald-400',
    fill: 'fill-emerald-400',
    text: 'fill-emerald-600',
  },
  amber: {
    stroke: 'stroke-amber-400',
    fill: 'fill-amber-400',
    text: 'fill-amber-600',
  },
  zinc: {
    stroke: 'stroke-zinc-400',
    fill: 'fill-zinc-400',
    text: 'fill-zinc-500',
  },
  sky: {
    stroke: 'stroke-sky-400',
    fill: 'fill-sky-400',
    text: 'fill-sky-600',
  },
  violet: {
    stroke: 'stroke-violet-400',
    fill: 'fill-violet-400',
    text: 'fill-violet-600',
  },
  blue: {
    stroke: 'stroke-blue-400',
    fill: 'fill-blue-400',
    text: 'fill-blue-600',
  },
}

const connectorStyles = {
  diagram: { color: 'violet', strokeWidth: 2, label: 'diagram' },
  themes: { color: 'amber', strokeWidth: 1.8, label: 'themes' },
  export: { color: 'emerald', strokeWidth: 2, label: 'export' },
  publish: { color: 'blue', strokeWidth: 2, label: 'publish' },
}

const connectors: Array<{
  from: string
  to: string
  fromAnchor: string
  toAnchor: string
  style: string
}> = [
  { from: 'editor', to: 'model', fromAnchor: 'right', toAnchor: 'left', style: 'diagram' },
  { from: 'templates', to: 'model', fromAnchor: 'right', toAnchor: 'left', style: 'themes' },
  { from: 'model', to: 'docs', fromAnchor: 'right', toAnchor: 'left', style: 'publish' },
  { from: 'model', to: 'exporters', fromAnchor: 'bottom', toAnchor: 'top', style: 'export' },
]

const gap = 8

function getNode(id: keyof typeof nodes) {
  const node = nodes[id]
  const size = nodeSizes[node.size]
  return { ...node, ...size }
}

function anchor(nodeId: keyof typeof nodes, position: string) {
  const n = getNode(nodeId)
  switch (position) {
    case 'left':
      return { x: n.x - gap, y: n.y + n.height / 2 }
    case 'right':
      return { x: n.x + n.width + gap, y: n.y + n.height / 2 }
    case 'top':
      return { x: n.x + n.width / 2, y: n.y - gap }
    case 'bottom':
      return { x: n.x + n.width / 2, y: n.y + n.height + gap }
    default:
      return { x: n.x + n.width / 2, y: n.y + n.height / 2 }
  }
}

function midPoint(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
}

function straightPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
}

function ProcessBox({
  icon: Icon,
  name,
  subtitle,
  description,
  color = 'violet',
  size = 'normal',
}: {
  icon: React.ComponentType<{ className?: string }>
  name: string
  subtitle: string
  description?: string
  color?: keyof typeof colors
  size?: keyof typeof nodeSizes
}) {
  const boxColors = {
    violet:
      'border-violet-300 bg-gradient-to-br from-violet-50 to-violet-100/50',
    emerald:
      'border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100/50',
    blue: 'border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100/50',
    amber:
      'border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/50',
    zinc: 'border-zinc-300 bg-gradient-to-br from-zinc-50 to-zinc-100/50',
    sky: 'border-sky-300 bg-gradient-to-br from-sky-50 to-sky-100/50',
  }

  const iconColors = {
    violet: 'text-violet-600',
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    zinc: 'text-zinc-600',
    sky: 'text-sky-600',
  }

  const isLarge = size === 'large'
  const isSmall = size === 'small'

  return (
    <div
      className={`
        relative rounded-xl border-2 ${boxColors[color]}
        ${isLarge ? 'px-6 py-4' : isSmall ? 'px-3 py-2' : 'px-4 py-3'}
        shadow-sm bg-white/80 backdrop-blur-sm
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className={`
            flex-shrink-0 rounded-lg
            ${isLarge ? 'w-11 h-11' : isSmall ? 'w-7 h-7' : 'w-9 h-9'}
            flex items-center justify-center
            bg-white shadow-sm border border-zinc-200
          `}
        >
          <Icon
            className={`${
              isLarge ? 'w-5 h-5' : isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'
            } ${iconColors[color]}`}
          />
        </div>
        <div>
          <div
            className={`font-bold text-zinc-900 ${
              isLarge ? 'text-base' : isSmall ? 'text-xs' : 'text-sm'
            }`}
          >
            {name}
          </div>
          <div
            className={`font-mono text-zinc-500 ${
              isSmall ? 'text-[8px]' : 'text-[10px]'
            }`}
          >
            {subtitle}
          </div>
        </div>
      </div>
      {description && (
        <div
          className={`mt-2 text-zinc-600 ${isSmall ? 'text-[9px]' : 'text-[11px]'}`}
        >
          {description}
        </div>
      )}
    </div>
  )
}

function ArrowMarker({ id, color }: { id: string; color: keyof typeof colors }) {
  return (
    <marker
      id={id}
      markerWidth="6"
      markerHeight="4"
      refX="6"
      refY="2"
      orient="auto"
      markerUnits="userSpaceOnUse"
    >
      <polygon points="0 0, 6 2, 0 4" className={colors[color].fill} />
    </marker>
  )
}

function Connector({
  connector,
}: {
  connector: {
    from: string
    to: string
    fromAnchor: string
    toAnchor: string
    style: string
  }
}) {
  const style = connectorStyles[connector.style as keyof typeof connectorStyles]
  const from = anchor(connector.from as keyof typeof nodes, connector.fromAnchor)
  const to = anchor(connector.to as keyof typeof nodes, connector.toAnchor)
  const mid = midPoint(from, to)
  const colorSet = colors[style.color as keyof typeof colors]

  const isVertical = connector.fromAnchor === 'bottom' || connector.fromAnchor === 'top'
  const labelX = isVertical ? from.x + 10 : mid.x
  const labelY = isVertical ? mid.y + 4 : from.y - 10
  const textAnchor = isVertical ? 'start' : 'middle'

  return (
    <g>
      <path
        d={straightPath(from, to)}
        fill="none"
        className={colorSet.stroke}
        strokeWidth={style.strokeWidth}
        markerEnd={`url(#arrow-${style.color})`}
        vectorEffect="non-scaling-stroke"
      />
      {style.label && (
        <text
          x={labelX}
          y={labelY}
          textAnchor={textAnchor}
          className={`${colorSet.text} text-[10px] font-mono`}
        >
          {style.label}
        </text>
      )}
    </g>
  )
}

export default function ArcIntroDiagram() {
  const usedColors = [
    ...new Set(connectors.map((connector) => connectorStyles[connector.style].color)),
  ]

  return (
    <div className="arc-diagram-stage arc-reveal">
      <div className="relative min-w-[700px] h-[360px]">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {usedColors.map((color) => (
              <ArrowMarker key={color} id={`arrow-${color}`} color={color} />
            ))}
          </defs>
          {connectors.map((connector, index) => (
            <Connector key={index} connector={connector} />
          ))}
        </svg>

        {Object.entries(nodes).map(([id, pos]) => {
          const data = nodeData[id as keyof typeof nodeData]
          const node = getNode(id as keyof typeof nodes)
          return (
            <div key={id} className="absolute" style={{ left: node.x, top: node.y }}>
              <ProcessBox
                icon={data.icon}
                name={data.name}
                subtitle={data.subtitle}
                description={data.description}
                color={data.color as keyof typeof colors}
                size={pos.size as keyof typeof nodeSizes}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
