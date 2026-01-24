import { Monitor, Mic, Cpu, Server, Smartphone, Watch, Cloud } from 'lucide-react'

// ============================================
// LAYOUT CONFIGURATION - ADJUST VALUES HERE
// ============================================

const layout = { width: 700, height: 340 }

// Node size presets
const nodeSizes = {
  large:  { width: 210, height: 85 },
  normal: { width: 145, height: 68 },
  small:  { width: 95,  height: 42 },
}

// Box positions - adjust x, y to move boxes
const nodes = {
  talkie:       { x: 25,  y: 15,  size: 'large' },
  talkieLive:   { x: 25,  y: 125, size: 'normal' },
  talkieEngine: { x: 25,  y: 220, size: 'normal' },
  talkieServer: { x: 280, y: 15,  size: 'normal' },
  iCloud:       { x: 280, y: 220, size: 'normal' },
  iPhone:       { x: 520, y: 15,  size: 'normal' },
  watch:        { x: 548, y: 115, size: 'small' },
}

// Color palette for connectors and boxes
const colors = {
  emerald: {
    stroke: 'stroke-emerald-400 dark:stroke-emerald-500',
    fill: 'fill-emerald-400 dark:fill-emerald-500',
    text: 'fill-emerald-600 dark:fill-emerald-400',
  },
  amber: {
    stroke: 'stroke-amber-400 dark:stroke-amber-500',
    fill: 'fill-amber-400 dark:fill-amber-500',
    text: 'fill-amber-600 dark:fill-amber-400',
  },
  zinc: {
    stroke: 'stroke-zinc-400 dark:stroke-zinc-500',
    fill: 'fill-zinc-400 dark:fill-zinc-500',
    text: 'fill-zinc-500 dark:fill-zinc-400',
  },
  sky: {
    stroke: 'stroke-sky-400 dark:stroke-sky-500',
    fill: 'fill-sky-400 dark:fill-sky-500',
    text: 'fill-sky-600 dark:fill-sky-400',
  },
  violet: {
    stroke: 'stroke-violet-400 dark:stroke-violet-500',
    fill: 'fill-violet-400 dark:fill-violet-500',
    text: 'fill-violet-600 dark:fill-violet-400',
  },
  blue: {
    stroke: 'stroke-blue-400 dark:stroke-blue-500',
    fill: 'fill-blue-400 dark:fill-blue-500',
    text: 'fill-blue-600 dark:fill-blue-400',
  },
}

// Connector style presets
const connectorStyles = {
  xpc:       { color: 'emerald', strokeWidth: 2, label: 'XPC' },
  http:      { color: 'amber',   strokeWidth: 2, label: 'HTTP' },
  tailscale: { color: 'zinc',    strokeWidth: 2, label: 'Tailscale' },
  cloudkit:  { color: 'sky',     strokeWidth: 2, label: 'CloudKit', dashed: true },
  audio:     { color: 'emerald', strokeWidth: 3, label: 'audio' },
  peer:      { color: 'zinc',    strokeWidth: 1.5, dashed: true },
}

// Connector definitions - from/to use node IDs, anchors determine connection points
const connectors = [
  { from: 'talkie',       to: 'talkieLive',   fromAnchor: 'bottom', toAnchor: 'top',    style: 'xpc' },
  { from: 'talkieLive',   to: 'talkieEngine', fromAnchor: 'bottom', toAnchor: 'top',    style: 'audio' },
  { from: 'talkie',       to: 'talkieServer', fromAnchor: 'right',  toAnchor: 'left',   style: 'http' },
  { from: 'talkieServer', to: 'iPhone',       fromAnchor: 'right',  toAnchor: 'left',   style: 'tailscale' },
  { from: 'iPhone',       to: 'watch',        fromAnchor: 'bottom', toAnchor: 'top',    style: 'peer' },
  { from: 'talkie',       to: 'iCloud',       fromAnchor: 'bottomRight', toAnchor: 'left', style: 'cloudkit', curve: 'down' },
  { from: 'iPhone',       to: 'iCloud',       fromAnchor: 'bottomLeft',  toAnchor: 'right', style: 'cloudkit', curve: 'down' },
]

// Box metadata (icon, name, subtitle, description, color)
const nodeData = {
  talkie: {
    icon: Monitor,
    name: 'Talkie',
    subtitle: 'Swift/SwiftUI',
    description: 'UI, Workflows, Data, Orchestration',
    color: 'violet',
  },
  talkieLive: {
    icon: Mic,
    name: 'TalkieLive',
    subtitle: 'Swift',
    description: 'Ears & Hands',
    color: 'emerald',
  },
  talkieEngine: {
    icon: Cpu,
    name: 'TalkieEngine',
    subtitle: 'Swift',
    description: 'Local Brain',
    color: 'blue',
  },
  talkieServer: {
    icon: Server,
    name: 'TalkieServer',
    subtitle: 'TypeScript',
    description: 'iOS Bridge',
    color: 'amber',
  },
  iCloud: {
    icon: Cloud,
    name: 'iCloud',
    subtitle: 'CloudKit',
    description: 'Memo Sync',
    color: 'sky',
  },
  iPhone: {
    icon: Smartphone,
    name: 'iPhone',
    subtitle: 'iOS',
    description: 'Voice Capture',
    color: 'zinc',
  },
  watch: {
    icon: Watch,
    name: 'Watch',
    subtitle: 'watchOS',
    color: 'zinc',
  },
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const gap = 8 // Distance from box edge to arrow start/end

function getNode(id) {
  const node = nodes[id]
  const size = nodeSizes[node.size]
  return { ...node, ...size }
}

function anchor(nodeId, position) {
  const n = getNode(nodeId)
  switch (position) {
    case 'left':        return { x: n.x - gap, y: n.y + n.height / 2 }
    case 'right':       return { x: n.x + n.width + gap, y: n.y + n.height / 2 }
    case 'top':         return { x: n.x + n.width / 2, y: n.y - gap }
    case 'bottom':      return { x: n.x + n.width / 2, y: n.y + n.height + gap }
    case 'bottomRight': return { x: n.x + n.width + gap, y: n.y + n.height - 15 }
    case 'bottomLeft':  return { x: n.x - gap, y: n.y + n.height - 15 }
    default:            return { x: n.x + n.width / 2, y: n.y + n.height / 2 }
  }
}

function midPoint(p1, p2) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
}

function straightPath(from, to) {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
}

function curvedPath(from, to, direction = 'down') {
  const cp = 50
  if (direction === 'down') {
    return `M ${from.x} ${from.y} C ${from.x + cp} ${from.y + 50}, ${to.x - cp} ${to.y - 30}, ${to.x} ${to.y}`
  }
  return straightPath(from, to)
}

// ============================================
// COMPONENTS
// ============================================

// Process box component
function ProcessBox({ icon: Icon, name, subtitle, description, color = 'violet', size = 'normal' }) {
  const boxColors = {
    violet: 'border-violet-300 dark:border-violet-500/40 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-500/10 dark:to-violet-500/5',
    emerald: 'border-emerald-300 dark:border-emerald-500/40 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5',
    blue: 'border-blue-300 dark:border-blue-500/40 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5',
    amber: 'border-amber-300 dark:border-amber-500/40 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5',
    zinc: 'border-zinc-300 dark:border-zinc-600 bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-800/50 dark:to-zinc-800/30',
    sky: 'border-sky-300 dark:border-sky-500/40 bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-500/10 dark:to-sky-500/5',
  }

  const iconColors = {
    violet: 'text-violet-600 dark:text-violet-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
    zinc: 'text-zinc-600 dark:text-zinc-400',
    sky: 'text-sky-600 dark:text-sky-400',
  }

  const isLarge = size === 'large'
  const isSmall = size === 'small'

  return (
    <div className={`
      relative rounded-xl border-2 ${boxColors[color]}
      ${isLarge ? 'px-6 py-4' : isSmall ? 'px-3 py-2' : 'px-4 py-3'}
      shadow-sm bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm
    `}>
      <div className="flex items-center gap-3">
        <div className={`
          flex-shrink-0 rounded-lg
          ${isLarge ? 'w-11 h-11' : isSmall ? 'w-7 h-7' : 'w-9 h-9'}
          flex items-center justify-center
          bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-700
        `}>
          <Icon className={`${isLarge ? 'w-5 h-5' : isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${iconColors[color]}`} />
        </div>
        <div>
          <div className={`font-bold text-zinc-900 dark:text-white ${isLarge ? 'text-base' : isSmall ? 'text-xs' : 'text-sm'}`}>
            {name}
          </div>
          <div className={`font-mono text-zinc-500 dark:text-zinc-400 ${isSmall ? 'text-[8px]' : 'text-[10px]'}`}>
            {subtitle}
          </div>
        </div>
      </div>
      {description && (
        <div className={`mt-2 text-zinc-600 dark:text-zinc-400 ${isSmall ? 'text-[9px]' : 'text-[11px]'}`}>
          {description}
        </div>
      )}
    </div>
  )
}

// Arrow marker component
function ArrowMarker({ id, color }) {
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

// Connector path component
function Connector({ connector }) {
  const style = connectorStyles[connector.style]
  const from = anchor(connector.from, connector.fromAnchor)
  const to = anchor(connector.to, connector.toAnchor)
  const mid = midPoint(from, to)

  const path = connector.curve
    ? curvedPath(from, to, connector.curve)
    : straightPath(from, to)

  const colorSet = colors[style.color]

  // Determine label position
  const isVertical = connector.fromAnchor === 'bottom' || connector.fromAnchor === 'top'
  const labelX = isVertical ? from.x + 10 : mid.x
  const labelY = isVertical ? mid.y + 4 : from.y - 10
  const textAnchor = isVertical ? 'start' : 'middle'

  return (
    <g>
      <path
        d={path}
        fill="none"
        className={colorSet.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.dashed ? '6 3' : undefined}
        markerEnd={style.dashed ? undefined : `url(#arrow-${style.color})`}
        vectorEffect="non-scaling-stroke"
      />
      {style.label && !style.dashed && (
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

// ============================================
// MAIN DIAGRAM COMPONENT
// ============================================

export default function ArchitectureDiagram() {
  // Get unique colors used by connectors for marker definitions
  const usedColors = [...new Set(connectors.map(c => connectorStyles[c.style].color))]

  return (
    <div className="my-8 p-4 md:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
      <div className="relative min-w-[700px] h-[400px]">
        {/* SVG layer for curved connections */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Arrow marker definitions */}
          <defs>
            {usedColors.map(color => (
              <ArrowMarker key={color} id={`arrow-${color}`} color={color} />
            ))}
          </defs>

          {/* Render all connectors */}
          {connectors.map((connector, i) => (
            <Connector key={i} connector={connector} />
          ))}

          {/* CloudKit label (special case - appears once for both dashed lines) */}
          <text
            x={getNode('iCloud').x + getNode('iCloud').width / 2}
            y={getNode('iCloud').y - 8}
            textAnchor="middle"
            className={`${colors.sky.text} text-[9px] font-mono`}
          >
            CloudKit
          </text>
        </svg>

        {/* Process boxes positioned absolutely */}
        {Object.entries(nodes).map(([id, pos]) => {
          const data = nodeData[id]
          const node = getNode(id)
          return (
            <div
              key={id}
              className="absolute"
              style={{ left: node.x, top: node.y }}
            >
              <ProcessBox
                icon={data.icon}
                name={data.name}
                subtitle={data.subtitle}
                description={data.description}
                color={data.color}
                size={pos.size}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
