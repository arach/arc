import React from 'react'
import { Monitor, Layers, Grid, Upload, FileCode, Wand2 } from 'lucide-react'

const layout = { width: 880, height: 360 }

const sizeMap = {
  l: { width: 230, height: 120 },
  m: { width: 190, height: 98 },
  s: { width: 160, height: 86 },
}

type NodeKey = 'core' | 'editor' | 'templates' | 'exports' | 'consumers' | 'automation'

type DiagramNode = {
  x: number
  y: number
  size: keyof typeof sizeMap
  title: string
  subtitle: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  tone: {
    accent: string
    wash: string
    border: string
  }
}

const nodes: Record<NodeKey, DiagramNode> = {
  core: {
    x: 325,
    y: 120,
    size: 'l',
    title: 'Arc Core',
    subtitle: 'Reducer + Model',
    description: 'Single source of truth for diagrams.',
    icon: Layers,
    tone: {
      accent: '#1f7a65',
      wash: 'rgba(31, 122, 101, 0.12)',
      border: 'rgba(31, 122, 101, 0.35)',
    },
  },
  editor: {
    x: 80,
    y: 70,
    size: 'm',
    title: 'Editor UI',
    subtitle: 'Canvas',
    description: 'Tools, layers, and properties.',
    icon: Monitor,
    tone: {
      accent: '#f07c4f',
      wash: 'rgba(240, 124, 79, 0.12)',
      border: 'rgba(240, 124, 79, 0.35)',
    },
  },
  templates: {
    x: 90,
    y: 210,
    size: 's',
    title: 'Templates',
    subtitle: 'Themes',
    description: 'Palettes, sizes, defaults.',
    icon: Grid,
    tone: {
      accent: '#d09c36',
      wash: 'rgba(208, 156, 54, 0.12)',
      border: 'rgba(208, 156, 54, 0.32)',
    },
  },
  exports: {
    x: 610,
    y: 70,
    size: 'm',
    title: 'Exporters',
    subtitle: 'SVG / PNG / TS',
    description: 'Asset and config pipelines.',
    icon: Upload,
    tone: {
      accent: '#2e5fa5',
      wash: 'rgba(46, 95, 165, 0.12)',
      border: 'rgba(46, 95, 165, 0.32)',
    },
  },
  consumers: {
    x: 610,
    y: 210,
    size: 'm',
    title: 'Docs + Apps',
    subtitle: 'Consumers',
    description: 'Embed Arc models anywhere.',
    icon: FileCode,
    tone: {
      accent: '#3b3f45',
      wash: 'rgba(43, 51, 59, 0.1)',
      border: 'rgba(43, 51, 59, 0.25)',
    },
  },
  automation: {
    x: 340,
    y: 10,
    size: 's',
    title: 'Automation',
    subtitle: 'Workflows',
    description: 'Build steps, linting, CI hooks.',
    icon: Wand2,
    tone: {
      accent: '#3aa17e',
      wash: 'rgba(58, 161, 126, 0.12)',
      border: 'rgba(58, 161, 126, 0.3)',
    },
  },
}

const connectors = [
  { from: 'core', to: 'editor', dashed: false },
  { from: 'core', to: 'templates', dashed: true },
  { from: 'core', to: 'exports', dashed: false },
  { from: 'core', to: 'consumers', dashed: false },
  { from: 'core', to: 'automation', dashed: true },
] as const

function center(nodeKey: NodeKey) {
  const node = nodes[nodeKey]
  const size = sizeMap[node.size]
  return {
    x: node.x + size.width / 2,
    y: node.y + size.height / 2,
  }
}

function curvePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const cp1x = from.x + dx * 0.4
  const cp1y = from.y + dy * 0.1
  const cp2x = to.x - dx * 0.4
  const cp2y = to.y - dy * 0.1
  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`
}

export default function ArcArchitectureNext() {
  return (
    <div className="arc-next-stage arc-reveal">
      <div className="arc-next-scroll">
        <div className="arc-next-canvas">
          <svg
            className="arc-next-svg"
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            aria-hidden="true"
          >
            {connectors.map((connector) => {
              const from = center(connector.from)
              const to = center(connector.to)
              return (
                <path
                  key={`${connector.from}-${connector.to}`}
                  d={curvePath(from, to)}
                  stroke="var(--arc-next-line)"
                  strokeWidth="1.6"
                  strokeDasharray={connector.dashed ? '6 6' : undefined}
                  fill="none"
                />
              )
            })}
            {Object.entries(nodes).map(([key, node]) => {
              const size = sizeMap[node.size]
              return (
                <circle
                  key={key}
                  cx={node.x + size.width / 2}
                  cy={node.y + size.height / 2}
                  r={3}
                  fill="var(--arc-next-dot)"
                />
              )
            })}
          </svg>

          {Object.entries(nodes).map(([key, node]) => {
            const size = sizeMap[node.size]
            const Icon = node.icon
            return (
              <div
                key={key}
                className="arc-next-node"
                style={{
                  left: node.x,
                  top: node.y,
                  width: size.width,
                  height: size.height,
                  '--arc-next-accent': node.tone.accent,
                  '--arc-next-wash': node.tone.wash,
                  '--arc-next-border': node.tone.border,
                } as React.CSSProperties}
              >
                <div className="arc-next-node-header">
                  <div className="arc-next-icon">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="arc-next-title">{node.title}</div>
                    <div className="arc-next-subtitle">{node.subtitle}</div>
                  </div>
                </div>
                <div className="arc-next-desc">{node.description}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
