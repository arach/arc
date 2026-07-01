/**
 * Agent Fleet — Isometric
 *
 * Turns the live Scout agent roster into an Arc isometric diagram:
 *   Tier 0  BROKER    — the Scout hub everything routes through
 *   Tier 1  PROJECTS  — one plot per repo, agents stack above it
 *   Tier 2  AGENTS    — every running session, colored by harness
 *
 * Run:  bun scripts/agent-fleet-iso.ts
 * Out:  /tmp/agent-fleet.svg  +  public/agent-fleet.png
 */
import { renderToString } from '../src/iso/vanilla'
import type { DiagramConfig, DiagramNode } from '../src/iso/types'
import { isoToScreen } from '../src/utils/isometric.js'
import { writeFileSync } from 'fs'
import sharp from 'sharp'

// ── Live roster (Scout agents_search, running only) ─────────────────────────
// harness → color:  claude = violet · codex = blue · pi/grok = emerald
const HARNESS_COLOR: Record<string, string> = { claude: 'violet', codex: 'blue', pi: 'emerald' }
const HARNESS_HEIGHT: Record<string, number> = { claude: 30, codex: 24, pi: 20 }

type Agent = { label: string; harness: 'claude' | 'codex' | 'pi' }
type Project = { key: string; label: string; cell: { x: number; y: number; w: number; d: number }; cols: number; agents: Agent[] }

const PROJECTS: Project[] = [
  {
    key: 'openscout', label: 'OPENSCOUT', cell: { x: 20, y: 30, w: 165, d: 285 }, cols: 3,
    agents: [
      { label: 'OSCOUT', harness: 'codex' }, { label: 'OS-185', harness: 'codex' }, { label: 'OS-GROK', harness: 'pi' },
      { label: 'GROK', harness: 'pi' }, { label: 'CARD-2', harness: 'codex' }, { label: 'CARD-3a', harness: 'codex' },
      { label: 'CARD-3b', harness: 'codex' }, { label: 'CARD-C', harness: 'codex' }, { label: 'CARD-F', harness: 'codex' },
      { label: 'CARD-G', harness: 'codex' }, { label: 'CARD-P', harness: 'codex' },
    ],
  },
  {
    key: 'hudson', label: 'HUDSON', cell: { x: 205, y: 30, w: 120, d: 115 }, cols: 2,
    agents: [
      { label: 'HUDSON', harness: 'codex' }, { label: 'HUD-LITE', harness: 'pi' },
      { label: 'HUD-NONE', harness: 'pi' }, { label: 'HUD-CARD', harness: 'codex' },
    ],
  },
  {
    key: 'talkie', label: 'TALKIE', cell: { x: 345, y: 30, w: 120, d: 115 }, cols: 2,
    agents: [ { label: 'TALKIE', harness: 'claude' }, { label: 'TLK-MKUP', harness: 'codex' } ],
  },
  { key: 'pomo', label: 'POMO', cell: { x: 205, y: 165, w: 115, d: 75 }, cols: 2,
    agents: [ { label: 'POMO', harness: 'codex' }, { label: 'LANDING', harness: 'codex' } ] },
  { key: 'atelier', label: 'ATELIER', cell: { x: 340, y: 165, w: 70, d: 75 }, cols: 1,
    agents: [ { label: 'ATELIER', harness: 'codex' } ] },
  { key: 'scope', label: 'SCOPE', cell: { x: 205, y: 255, w: 70, d: 60 }, cols: 1,
    agents: [ { label: 'SCOPE', harness: 'codex' } ] },
  { key: 'lattices', label: 'LATTICES', cell: { x: 290, y: 255, w: 70, d: 60 }, cols: 1,
    agents: [ { label: 'LATTICE', harness: 'claude' } ] },
  { key: 'hl', label: 'HL', cell: { x: 430, y: 255, w: 60, d: 60 }, cols: 1,
    agents: [ { label: 'HL', harness: 'codex' } ] },
]

const FLOOR = { width: 500, depth: 345 }
const T_BROKER = 0, T_PROJECTS = 1, T_AGENTS = 2

// ── Build nodes ─────────────────────────────────────────────────────────────
const nodes: DiagramNode[] = []

// Tier 0 — the broker IS the base floor (amber-bordered). Its caption is drawn
// in the overlay pass below so it stays crisp instead of being occluded by the
// translucent floors the renderer paints on top of it.

let agentCount = 0
for (const p of PROJECTS) {
  // Tier 1 — project plot
  nodes.push({ tier: T_PROJECTS, x: p.cell.x, y: p.cell.y, width: p.cell.w, depth: p.cell.d, height: 10, color: 'slate', label: p.label, opacity: 0.92 })

  // Tier 2 — agents laid out in a mini-grid directly above the plot
  const n = p.agents.length
  const rows = Math.ceil(n / p.cols)
  const ip = 6
  const cw = (p.cell.w - 2 * ip) / p.cols
  const cd = (p.cell.d - 2 * ip) / rows
  const bw = Math.min(cw * 0.74, 46)
  const bd = Math.min(cd * 0.74, 46)
  p.agents.forEach((a, i) => {
    const col = i % p.cols, row = Math.floor(i / p.cols)
    nodes.push({
      tier: T_AGENTS,
      x: p.cell.x + ip + col * cw + (cw - bw) / 2,
      y: p.cell.y + ip + row * cd + (cd - bd) / 2,
      width: bw, depth: bd, height: HARNESS_HEIGHT[a.harness], color: HARNESS_COLOR[a.harness], label: a.label,
    })
    agentCount++
  })
}

const config: DiagramConfig = {
  id: 'ARC.FLEET.001',
  title: 'Agent Fleet',
  theme: 'dark',
  canvas: { width: 1240, height: 860 },
  origin: { x: 600, y: 726 },
  cornerRadius: 3,
  floorSize: FLOOR,
  tiers: [
    { name: 'BROKER',   elevation: 0,   floorColor: '#0b1220', floorOpacity: 0.96, borderColor: '#a16207' },
    { name: 'PROJECTS', elevation: 128, floorColor: '#111a2e', floorOpacity: 0.34, borderColor: '#475569' },
    { name: 'AGENTS',   elevation: 256, floorColor: '#16233d', floorOpacity: 0.24, borderColor: '#64748b' },
  ],
  nodes,
}

// ── Render + inject title & legend ──────────────────────────────────────────
let svg = renderToString(config)

const MONO = '"JetBrains Mono","SF Mono",Consolas,monospace'
const legend = [
  { c: '#8b5cf6', t: 'claude' },
  { c: '#3b82f6', t: 'codex' },
  { c: '#10b981', t: 'grok / pi' },
  { c: '#f59e0b', t: 'scout broker' },
]
let overlay = ''
overlay += `<text x="40" y="52" fill="#e2e8f0" font-size="24" font-weight="700" font-family="${MONO}" letter-spacing="0.04em">AGENT&#160;FLEET</text>`
overlay += `<text x="41" y="74" fill="#64748b" font-size="12" font-family="${MONO}" letter-spacing="0.06em">${agentCount} live sessions · ${PROJECTS.length} projects · one broker</text>`

// Broker caption, anchored on the base floor (front area, in the clear)
const bc = isoToScreen(FLOOR.width * 0.4, FLOOR.depth * 0.28, 0)
const bx = config.origin.x + bc.screenX, by = config.origin.y + bc.screenY
overlay += `<circle cx="${bx - 74}" cy="${by - 4}" r="4" fill="#f59e0b"/>`
overlay += `<text x="${bx - 62}" y="${by}" fill="#f59e0b" font-size="15" font-weight="700" font-family="${MONO}" letter-spacing="0.14em">SCOUT · BROKER</text>`
overlay += `<text x="${bx - 62}" y="${by + 17}" fill="#a16207" font-size="10" font-family="${MONO}" letter-spacing="0.06em">message bus — every agent routes here</text>`

legend.forEach((l, i) => {
  const x = 40 + i * 150
  const hollow = l.t === 'scout broker'
  overlay += `<rect x="${x}" y="${config.canvas.height - 44}" width="12" height="12" rx="2" fill="${hollow ? 'none' : l.c}" stroke="${l.c}" stroke-width="${hollow ? 2 : 0}"/>`
  overlay += `<text x="${x + 20}" y="${config.canvas.height - 34}" fill="#94a3b8" font-size="12" font-family="${MONO}">${l.t}</text>`
})
svg = svg.replace('</svg>', `${overlay}</svg>`)

// sharp's XML parser is strict: the renderer embeds a font list with inner
// double quotes inside a double-quoted attribute. Collapse to a safe family.
for (const f of [
  '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
  '"JetBrains Mono","SF Mono",Consolas,monospace',
]) svg = svg.split(`font-family="${f}"`).join('font-family="monospace"')

writeFileSync('/tmp/agent-fleet.svg', svg)
await sharp(Buffer.from(svg), { density: 200 }).png().toFile('public/agent-fleet.png')
console.log(`rendered ${agentCount} agents across ${PROJECTS.length} projects → public/agent-fleet.png`)
