/**
 * iso-stagger-demo — shows the new declarative per-layer `offset` (staggered layers).
 * Renders the SAME config twice: pure vertical stack vs. staggered picture-plane offsets.
 * Headless: SVG -> PNG via sharp (no browser).
 *
 * Run:  bunx tsx scripts/iso-stagger-demo.ts
 * Out:  /tmp/arc-iterate/iso-stack.png   (elevation only)
 *       /tmp/arc-iterate/iso-stagger.png (elevation + declarative offset)
 */
import { renderToString } from '../src/iso/vanilla'
import type { DiagramConfig, DiagramNode } from '../src/iso/types'
import sharp from 'sharp'

const nodes: DiagramNode[] = [
  // COMPONENTS (foundation — tier 0 / ground)
  { tier: 0, x: 24, y: 24, width: 60, depth: 44, height: 12, color: 'slate', label: 'Postgres' },
  { tier: 0, x: 104, y: 34, width: 54, depth: 40, height: 12, color: 'slate', label: 'Redis' },
  { tier: 0, x: 60, y: 92, width: 62, depth: 44, height: 12, color: 'slate', label: 'S3' },
  // SERVICES (tier 1)
  { tier: 1, x: 30, y: 40, width: 68, depth: 46, height: 14, color: 'cyan', label: 'Auth' },
  { tier: 1, x: 118, y: 46, width: 64, depth: 44, height: 14, color: 'emerald', label: 'API' },
  { tier: 1, x: 72, y: 100, width: 64, depth: 44, height: 14, color: 'amber', label: 'Queue' },
  // APPLICATIONS (tier 2)
  { tier: 2, x: 44, y: 54, width: 80, depth: 50, height: 16, color: 'violet', label: 'Web App' },
  { tier: 2, x: 138, y: 60, width: 70, depth: 46, height: 16, color: 'blue', label: 'Mobile' },
]

const base: DiagramConfig = {
  id: 'iso-stack',
  title: 'Layered architecture',
  theme: 'dark',
  canvas: { width: 860, height: 660 },
  origin: { x: 300, y: 452 },
  cornerRadius: 2,
  floorSize: { width: 220, depth: 156 },
  tiers: [
    { name: 'COMPONENTS', elevation: 0, floorColor: '#0b1220', floorOpacity: 0.96, borderColor: '#a16207' },
    { name: 'SERVICES', elevation: 115, floorColor: '#111a2e', floorOpacity: 0.3, borderColor: '#475569' },
    { name: 'APPLICATIONS', elevation: 230, floorColor: '#16233d', floorOpacity: 0.22, borderColor: '#64748b' },
  ],
  nodes,
}

// Declarative staggered layers: translate each tier in the picture plane.
// Foundation stays put; services + apps step up (−Y) and out (+X).
const stagger: DiagramConfig = {
  ...base,
  id: 'iso-stagger',
  tiers: base.tiers.map((t, i) => ({
    ...t,
    offset: [{ x: 0, y: 0 }, { x: 58, y: -26 }, { x: 116, y: -52 }][i],
  })),
}

async function render(cfg: DiagramConfig, out: string) {
  await sharp(Buffer.from(renderToString(cfg)), { density: 200 }).png().toFile(out)
  console.log('wrote', out)
}

await render(base, '/tmp/arc-iterate/iso-stack.png')
await render(stagger, '/tmp/arc-iterate/iso-stagger.png')
