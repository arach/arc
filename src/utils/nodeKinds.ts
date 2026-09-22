// Semantic node kinds — a fixed vocabulary so generated diagrams describe
// *what a box is* rather than which icon happened to be picked. Setting
// `nodeData.kind` supplies default `icon` and `color`; explicit fields remain
// the override, and the resolved color still flows through the theme palette.

import type { DiagramColor, NodeKind } from '../types/diagram'

export type { NodeKind }

export const NODE_KINDS: NodeKind[] = [
  'frontend', 'backend', 'service',
  'database', 'cache', 'queue', 'storage',
  'gateway', 'security', 'user',
  'external', 'observability',
]

export const NODE_KIND_DEFAULTS: Record<NodeKind, { color: DiagramColor; icon: string }> = {
  frontend:      { color: 'violet',  icon: 'Monitor' },
  backend:       { color: 'blue',    icon: 'Server' },
  service:       { color: 'blue',    icon: 'Box' },
  database:      { color: 'emerald', icon: 'Database' },
  cache:         { color: 'amber',   icon: 'Zap' },
  queue:         { color: 'amber',   icon: 'Layers' },
  storage:       { color: 'emerald', icon: 'HardDrive' },
  gateway:       { color: 'sky',     icon: 'Globe' },
  security:      { color: 'rose',    icon: 'Shield' },
  user:          { color: 'sky',     icon: 'User' },
  external:      { color: 'zinc',    icon: 'Cloud' },
  observability: { color: 'orange',  icon: 'Activity' },
}

export function isNodeKind(value: unknown): value is NodeKind {
  return typeof value === 'string' && (NODE_KINDS as string[]).includes(value)
}

type NodeStyleFields = { color?: string; icon?: string; kind?: string } | undefined

/** Effective palette color: explicit `color`, then the kind default, then zinc.
 * Palette lookups still tolerate a color outside DiagramColor — renderers fall
 * back on a missing palette entry exactly as before. */
export function resolveNodeColor(data: NodeStyleFields): DiagramColor {
  if (data?.color) return data.color as DiagramColor
  if (data?.kind && isNodeKind(data.kind)) return NODE_KIND_DEFAULTS[data.kind].color
  return 'zinc'
}

/** Effective icon name: explicit `icon`, then the kind default, then Box. */
export function resolveNodeIcon(data: NodeStyleFields): string {
  if (data?.icon) return data.icon
  if (data?.kind && isNodeKind(data.kind)) return NODE_KIND_DEFAULTS[data.kind].icon
  return 'Box'
}

const KIND_KEYWORDS: [RegExp, NodeKind][] = [
  [/front|web|client|browser|ui\b|spa|react/i, 'frontend'],
  [/api|server|backend|svc|service|compute/i, 'backend'],
  [/db|database|postgres|mysql|sql|mongo|dynamo|warehouse/i, 'database'],
  [/cache|redis|memcache/i, 'cache'],
  [/queue|kafka|sqs|pubsub|bus|stream|topic/i, 'queue'],
  [/s3|bucket|blob|storage|disk|volume|lake|archive/i, 'storage'],
  [/gateway|proxy|ingress|nginx|lb|balancer|edge/i, 'gateway'],
  [/auth|security|iam|shield|waf|kms|vault/i, 'security'],
  [/user|human|admin|customer|person|team/i, 'user'],
  [/external|third|partner|saas|webhook|cloud(?!flare)/i, 'external'],
  [/monitor|metric|observ|log|grafana|datadog|alarm|sentry/i, 'observability'],
]

/** Best-guess kind from a node name — used by diagnostics to suggest a repair. */
export function suggestKind(name: unknown): NodeKind | undefined {
  if (typeof name !== 'string') return undefined
  for (const [pattern, kind] of KIND_KEYWORDS) {
    if (pattern.test(name)) return kind
  }
  return undefined
}
