/**
 * Agent Fleet — Isometric
 *
 * Turns a captured Scout agent roster into an Arc isometric diagram:
 *   Tier 0  RUNTIME   — the Scout hub everything routes through
 *   Tier 1  PROJECTS  — one plot per repo, agents stack above it
 *   Tier 2  AGENTS    — every running session, colored by harness
 *
 * Run:  bun scripts/agent-fleet-iso.ts
 * Out:  /tmp/agent-fleet.svg  +  public/agent-fleet.png
 */
import { renderToString } from '../src/iso/vanilla'
import type { DiagramConfig, DiagramNode } from '../src/iso/types'
import { writeFileSync } from 'fs'
import sharp from 'sharp'

// ── Example roster (captured from Scout agents_search) ─────────────────────────
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
    key: 'arc', label: 'ARC', cell: { x: 345, y: 30, w: 120, d: 115 }, cols: 2,
    agents: [ { label: 'ARC', harness: 'claude' }, { label: 'ARC-DOCS', harness: 'codex' } ],
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

const SCENE_SCALE = 0.78
const FLOOR = { width: 500 * SCENE_SCALE, depth: 345 * SCENE_SCALE }
const T_PROJECTS = 1, T_AGENTS = 2

// ── Build nodes ─────────────────────────────────────────────────────────────
const nodes: DiagramNode[] = []

// Tier 0 — the runtime is a raised slate foundation. Layer captions are drawn
// beside the stack so they remain readable and cannot be occluded.

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

// Keep the full roster geometry, but let readable layer annotations explain
// this overview. Individual session names are too small at README width.
const overviewNodes = nodes.map(node => ({
  ...node,
  x: node.x * SCENE_SCALE, y: node.y * SCENE_SCALE,
  width: node.width * SCENE_SCALE, depth: node.depth * SCENE_SCALE,
  height: node.height * SCENE_SCALE, label: '',
}))

const config: DiagramConfig = {
  id: 'ARC.FLEET.001',
  title: 'Agent Fleet',
  theme: 'light',
  canvas: { width: 1120, height: 850 },
  origin: { x: 660, y: 748 },
  cornerRadius: 3,
  floorSize: FLOOR,
  tiers: [
    { name: '', elevation: 0, floorColor: '#f1f5f9', floorOpacity: 0.45, borderColor: '#94a3b8', offset: { x: -40, y: 0 } },
    { name: '', elevation: 148, floorColor: '#e2e8f0', floorOpacity: 0.35, borderColor: '#64748b' },
    { name: '', elevation: 296, floorColor: '#dbeafe', floorOpacity: 0.18, borderColor: '#3b82f6', offset: { x: 40, y: 0 } },
  ],
  nodes: [
    // A shallow solid platform gives the runtime a visible edge and depth.
    { tier: 0, x: 12, y: 12, width: FLOOR.width - 24, depth: FLOOR.depth - 24,
      height: 20, color: 'slate', label: '' },
    ...overviewNodes,
  ],
}

// ── Render + inject title & legend ──────────────────────────────────────────
let svg = renderToString(config)

// Annotations stay in screen space, so they remain readable at article width.
const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
const INK = '#1e293b'
const SECONDARY = '#475569'
const legend = [
  { c: '#8b5cf6', t: 'Claude' },
  { c: '#3b82f6', t: 'Codex' },
  { c: '#10b981', t: 'Grok / Pi' },
  { c: '#64748b', t: 'Runtime' },
]
let overlay = `<g font-family="${FONT}">`
overlay += `<text x="40" y="48" fill="${INK}" font-size="28" font-weight="600">Agent fleet</text>`
overlay += `<text x="40" y="78" fill="${SECONDARY}" font-size="17">${agentCount} agent sessions · ${PROJECTS.length} projects · one shared runtime</text>`

const annotations = [
  { y: 298, title: 'Agents', detail: `${agentCount} sessions, three harnesses`, color: '#2563eb', endX: 467, endY: 314 },
  { y: 458, title: 'Projects', detail: `${PROJECTS.length} project workspaces`, color: '#475569', endX: 427, endY: 466 },
  { y: 618, title: 'Runtime', detail: 'A shared message bus', color: '#64748b', endX: 387, endY: 614 },
]
for (const item of annotations) {
  overlay += `<path d="M280 ${item.y - 7} H320 L${item.endX} ${item.endY}" fill="none" stroke="${item.color}" stroke-width="1.25"/>`
  overlay += `<circle cx="${item.endX}" cy="${item.endY}" r="3" fill="${item.color}"/>`
  overlay += `<text x="40" y="${item.y}" fill="${INK}" font-size="24" font-weight="500">${item.title}</text>`
  overlay += `<text x="40" y="${item.y + 28}" fill="${SECONDARY}" font-size="16">${item.detail}</text>`
}
legend.forEach((item, i) => {
  const x = 40 + i * 170
  overlay += `<rect x="${x}" y="806" width="12" height="12" rx="2" fill="${item.c}"/>`
  overlay += `<text x="${x + 22}" y="817" fill="${SECONDARY}" font-size="16">${item.t}</text>`
})
overlay += '</g>'
svg = svg.replace('</svg>', `${overlay}</svg>`)

writeFileSync('/tmp/agent-fleet.svg', svg)
// Flatten explicitly so the raster background remains correct in every host.
await sharp(Buffer.from(svg), { density: 144 })
  .flatten({ background: '#f8fafc' }).png().toFile('public/agent-fleet.png')
console.log(`rendered ${agentCount} agents across ${PROJECTS.length} projects → public/agent-fleet.png`)
