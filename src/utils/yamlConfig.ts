import yaml from 'js-yaml'

// =============================================================================
// YAML Config Parser
// Supports dimension shorthands, color anchors, tier sections, escape hatches
// =============================================================================

interface TierConfig {
  name: string
  elevation: number
  floorColor?: string
  floorOpacity?: number
  borderColor?: string
  nodeOpacity?: number
  blur?: number
}

interface DiagramNode {
  tier: number
  x: number
  y: number
  width: number
  depth: number
  height: number
  color: string
  label: string
  opacity?: number
  blur?: number
  translucent?: boolean
}

interface DiagramConfig {
  title: string
  description: string
  theme: 'dark' | 'light'
  canvas: { width: number; height: number }
  origin: { x: number; y: number }
  cornerRadius?: number
  tiers: TierConfig[]
  floorSize: { width: number; depth: number }
  nodes: DiagramNode[]
  pillars?: { x: number; y: number; fromTier: number; toTier: number }[]
}

// Parse dimension shorthand: "120x90x34" → { width: 120, depth: 90, height: 34 }
function parseDims(str: string): { width: number; depth: number; height: number } | null {
  const match = str.match(/^(\d+)x(\d+)x(\d+)$/)
  if (!match) return null
  return {
    width: parseInt(match[1], 10),
    depth: parseInt(match[2], 10),
    height: parseInt(match[3], 10),
  }
}

// Parse 2D shorthand: "1100x720" → { width: 1100, height: 720 }
function parse2D(str: string): { width: number; height: number } | null {
  const match = str.match(/^(\d+)x(\d+)$/)
  if (!match) return null
  return {
    width: parseInt(match[1], 10),
    height: parseInt(match[2], 10),
  }
}

// Parse position shorthand: "25,25" → { x: 25, y: 25 }
function parsePos(str: string): { x: number; y: number } | null {
  const match = str.match(/^(-?\d+),(-?\d+)$/)
  if (!match) return null
  return {
    x: parseInt(match[1], 10),
    y: parseInt(match[2], 10),
  }
}

// Parse tier shorthand: "Data @ 0" → { name: "Data", elevation: 0 }
function parseTierLine(str: string): { name: string; elevation: number } | null {
  const match = str.match(/^(.+?)\s*@\s*(\d+)$/)
  if (!match) return null
  return {
    name: match[1].trim(),
    elevation: parseInt(match[2], 10),
  }
}

// Parse node shorthand: "SQL blue 25,25 120x90x34" or with escape hatch
function parseNodeLine(line: string, tierIndex: number, colorAliases: Record<string, string>): DiagramNode | null {
  // Check for escape hatch: { ... } at end
  let escapeHatch: Record<string, unknown> = {}
  const escapeMatch = line.match(/\{([^}]+)\}\s*$/)
  if (escapeMatch) {
    // Parse escape hatch as key=value pairs
    const pairs = escapeMatch[1].split(/\s+/)
    for (const pair of pairs) {
      const [key, val] = pair.split('=')
      if (key && val) {
        // Try to parse as number, otherwise keep as string
        const numVal = parseFloat(val)
        escapeHatch[key] = isNaN(numVal) ? val : numVal
      }
    }
    line = line.replace(/\{[^}]+\}\s*$/, '').trim()
  }

  // Split remaining line into parts
  const parts = line.trim().split(/\s+/)
  if (parts.length < 4) return null

  const label = parts[0]
  const colorKey = parts[1]
  const posStr = parts[2]
  const dimsStr = parts[3]

  const pos = parsePos(posStr)
  const dims = parseDims(dimsStr)
  if (!pos || !dims) return null

  // Resolve color alias
  const color = colorAliases[colorKey] || colorKey

  return {
    tier: tierIndex,
    label,
    color,
    x: pos.x,
    y: pos.y,
    width: dims.width,
    depth: dims.depth,
    height: dims.height,
    ...(escapeHatch as Partial<DiagramNode>),
  }
}

/**
 * Parse YAML config into DiagramConfig
 *
 * Supported format:
 * ```yaml
 * title: Data Platform
 * description: Domain-driven architecture
 * theme: light
 * canvas: 1100x720
 * floor: 460x280
 * corner: 14
 *
 * colors:
 *   db: &db blue
 *   svc: &svc violet
 *
 * tiers:
 *   - Data @ 0
 *   - Services @ 150
 *   - Domains @ 300
 *
 * nodes:
 *   0:  # Tier 0
 *     - SQL       *db  25,25   120x90x34
 *     - NoSQL     *db  165,25  120x90x34
 *   1:  # Tier 1
 *     - Ingest    *svc 20,20   100x80x40 { opacity=0.8 }
 * ```
 */
export function parseYamlConfig(yamlStr: string): DiagramConfig {
  const raw = yaml.load(yamlStr) as Record<string, unknown>

  // Parse canvas dimensions
  let canvas = { width: 1100, height: 700 }
  if (typeof raw.canvas === 'string') {
    const parsed = parse2D(raw.canvas)
    if (parsed) canvas = parsed
  } else if (raw.canvas && typeof raw.canvas === 'object') {
    canvas = raw.canvas as { width: number; height: number }
  }

  // Parse floor dimensions
  let floorSize = { width: 400, depth: 280 }
  if (typeof raw.floor === 'string') {
    const parsed = parse2D(raw.floor)
    if (parsed) floorSize = { width: parsed.width, depth: parsed.height }
  } else if (raw.floor && typeof raw.floor === 'object') {
    floorSize = raw.floor as { width: number; depth: number }
  }

  // Calculate origin (center-bottom by default)
  let origin = { x: canvas.width / 2, y: canvas.height - 80 }
  if (raw.origin && typeof raw.origin === 'object') {
    origin = raw.origin as { x: number; y: number }
  }

  // Parse color aliases (for anchor references)
  const colorAliases: Record<string, string> = {}
  if (raw.colors && typeof raw.colors === 'object') {
    for (const [key, val] of Object.entries(raw.colors as Record<string, string>)) {
      colorAliases[key] = val
    }
  }

  // Parse tiers
  const tiers: TierConfig[] = []
  const tierFloorColors = {
    dark: ['#0f172a', '#1e293b', '#334155', '#475569'],
    light: ['#f1f5f9', '#e0f2fe', '#dbeafe', '#ede9fe'],
  }
  const tierBorderColors = {
    dark: ['#334155', '#475569', '#64748b', '#94a3b8'],
    light: ['#94a3b8', '#7dd3fc', '#93c5fd', '#c4b5fd'],
  }
  const theme = (raw.theme as 'dark' | 'light') || 'dark'

  if (Array.isArray(raw.tiers)) {
    raw.tiers.forEach((tierDef, i) => {
      if (typeof tierDef === 'string') {
        const parsed = parseTierLine(tierDef)
        if (parsed) {
          tiers.push({
            name: parsed.name,
            elevation: parsed.elevation,
            floorColor: tierFloorColors[theme][i] || tierFloorColors[theme][0],
            floorOpacity: i === 0 ? 0.95 : 0.7 - i * 0.1,
            borderColor: tierBorderColors[theme][i] || tierBorderColors[theme][0],
          })
        }
      } else if (tierDef && typeof tierDef === 'object') {
        // Full tier object
        const t = tierDef as Record<string, unknown>
        tiers.push({
          name: t.name as string || `Tier ${i}`,
          elevation: t.elevation as number || i * 150,
          floorColor: t.floorColor as string || tierFloorColors[theme][i],
          floorOpacity: t.floorOpacity as number ?? (i === 0 ? 0.95 : 0.7 - i * 0.1),
          borderColor: t.borderColor as string || tierBorderColors[theme][i],
        })
      }
    })
  }

  // Parse nodes
  const nodes: DiagramNode[] = []
  if (raw.nodes && typeof raw.nodes === 'object') {
    // Check if nodes is organized by tier index
    if (!Array.isArray(raw.nodes)) {
      const nodesByTier = raw.nodes as Record<string, unknown[]>
      for (const [tierKey, tierNodes] of Object.entries(nodesByTier)) {
        const tierIndex = parseInt(tierKey, 10)
        if (isNaN(tierIndex) || !Array.isArray(tierNodes)) continue

        for (const nodeDef of tierNodes) {
          if (typeof nodeDef === 'string') {
            const node = parseNodeLine(nodeDef, tierIndex, colorAliases)
            if (node) nodes.push(node)
          } else if (nodeDef && typeof nodeDef === 'object') {
            // Full node object (escape hatch)
            const n = nodeDef as Record<string, unknown>
            nodes.push({
              tier: tierIndex,
              label: n.label as string || '',
              color: colorAliases[n.color as string] || n.color as string || 'slate',
              x: n.x as number || 0,
              y: n.y as number || 0,
              width: n.width as number || 100,
              depth: n.depth as number || 80,
              height: n.height as number || 40,
              opacity: n.opacity as number,
              blur: n.blur as number,
              translucent: n.translucent as boolean,
            })
          }
        }
      }
    }
  }

  // Parse pillars
  const pillars: DiagramConfig['pillars'] = []
  if (Array.isArray(raw.pillars)) {
    for (const p of raw.pillars) {
      if (typeof p === 'string') {
        // Parse "90,240 0->2" format
        const match = p.match(/^(-?\d+),(-?\d+)\s+(\d+)->(\d+)$/)
        if (match) {
          pillars.push({
            x: parseInt(match[1], 10),
            y: parseInt(match[2], 10),
            fromTier: parseInt(match[3], 10),
            toTier: parseInt(match[4], 10),
          })
        }
      } else if (p && typeof p === 'object') {
        const pObj = p as Record<string, number>
        pillars.push({
          x: pObj.x || 0,
          y: pObj.y || 0,
          fromTier: pObj.fromTier || 0,
          toTier: pObj.toTier || 1,
        })
      }
    }
  }

  return {
    title: raw.title as string || 'Untitled',
    description: raw.description as string || '',
    theme,
    canvas,
    origin,
    cornerRadius: raw.corner as number ?? raw.cornerRadius as number ?? 14,
    tiers,
    floorSize,
    nodes,
    pillars: pillars.length > 0 ? pillars : undefined,
  }
}

/**
 * Convert a DiagramConfig back to YAML string
 */
export function configToYaml(config: DiagramConfig): string {
  const lines: string[] = []

  lines.push(`title: ${config.title}`)
  if (config.description) lines.push(`description: ${config.description}`)
  lines.push(`theme: ${config.theme}`)
  lines.push(`canvas: ${config.canvas.width}x${config.canvas.height}`)
  lines.push(`floor: ${config.floorSize.width}x${config.floorSize.depth}`)
  if (config.cornerRadius) lines.push(`corner: ${config.cornerRadius}`)
  lines.push('')

  // Collect unique colors and create aliases
  const colorUsage: Record<string, number> = {}
  config.nodes.forEach(n => {
    colorUsage[n.color] = (colorUsage[n.color] || 0) + 1
  })
  const frequentColors = Object.entries(colorUsage)
    .filter(([, count]) => count >= 2)
    .map(([color]) => color)

  if (frequentColors.length > 0) {
    lines.push('colors:')
    frequentColors.forEach(color => {
      const alias = color.slice(0, 3) // e.g., "blue" → "blu"
      lines.push(`  ${alias}: &${alias} ${color}`)
    })
    lines.push('')
  }

  // Tiers
  lines.push('tiers:')
  config.tiers.forEach(tier => {
    lines.push(`  - ${tier.name} @ ${tier.elevation}`)
  })
  lines.push('')

  // Nodes by tier
  lines.push('nodes:')
  config.tiers.forEach((tier, tierIndex) => {
    const tierNodes = config.nodes.filter(n => n.tier === tierIndex)
    if (tierNodes.length === 0) return

    lines.push(`  ${tierIndex}: # ${tier.name}`)
    tierNodes.forEach(node => {
      // Use alias if available
      let colorRef = node.color
      if (frequentColors.includes(node.color)) {
        colorRef = `*${node.color.slice(0, 3)}`
      }

      // Build escape hatch for extra properties
      const extras: string[] = []
      if (node.opacity !== undefined) extras.push(`opacity=${node.opacity}`)
      if (node.blur !== undefined) extras.push(`blur=${node.blur}`)
      if (node.translucent) extras.push(`translucent=true`)

      const escapeHatch = extras.length > 0 ? ` { ${extras.join(' ')} }` : ''
      const dims = `${node.width}x${node.depth}x${node.height}`
      const pos = `${node.x},${node.y}`

      // Pad for alignment
      const label = node.label.padEnd(12)
      const color = colorRef.padEnd(8)

      lines.push(`    - ${label} ${color} ${pos.padEnd(8)} ${dims}${escapeHatch}`)
    })
  })

  // Pillars
  if (config.pillars && config.pillars.length > 0) {
    lines.push('')
    lines.push('pillars:')
    config.pillars.forEach(p => {
      lines.push(`  - ${p.x},${p.y} ${p.fromTier}->${p.toTier}`)
    })
  }

  return lines.join('\n')
}
