import { useState } from 'react'
import IsoDiagram from '../iso/ArcDiagram'
import type { DiagramConfig, DiagramNode } from '../iso/types'

// Staggered, layered architecture — the declarative `offset` per tier plus the
// interactive tools (hover → expand a layer, click a node → drill/focus, click a floor → solo).
const nodes: DiagramNode[] = [
  { tier: 0, x: 24, y: 24, width: 60, depth: 44, height: 12, color: 'slate', label: 'Postgres' },
  { tier: 0, x: 104, y: 34, width: 54, depth: 40, height: 12, color: 'slate', label: 'Redis' },
  { tier: 0, x: 60, y: 92, width: 62, depth: 44, height: 12, color: 'slate', label: 'S3' },
  { tier: 1, x: 30, y: 40, width: 68, depth: 46, height: 14, color: 'cyan', label: 'Auth' },
  { tier: 1, x: 118, y: 46, width: 64, depth: 44, height: 14, color: 'emerald', label: 'API' },
  { tier: 1, x: 72, y: 100, width: 64, depth: 44, height: 14, color: 'amber', label: 'Queue' },
  { tier: 2, x: 44, y: 54, width: 80, depth: 50, height: 16, color: 'violet', label: 'Web App', link: 'https://example.com' },
  { tier: 2, x: 138, y: 60, width: 70, depth: 46, height: 16, color: 'blue', label: 'Mobile' },
]

const config: DiagramConfig = {
  id: 'iso-interactive',
  title: 'Layered architecture',
  theme: 'dark',
  canvas: { width: 860, height: 660 },
  origin: { x: 300, y: 452 },
  cornerRadius: 2,
  floorSize: { width: 220, depth: 156 },
  tiers: [
    { name: 'COMPONENTS', elevation: 0, floorColor: '#0b1220', floorOpacity: 0.96, borderColor: '#a16207', offset: { x: 0, y: 0 } },
    { name: 'SERVICES', elevation: 115, floorColor: '#111a2e', floorOpacity: 0.3, borderColor: '#475569', offset: { x: 58, y: -26 } },
    { name: 'APPLICATIONS', elevation: 230, floorColor: '#16233d', floorOpacity: 0.22, borderColor: '#64748b', offset: { x: 116, y: -52 } },
  ],
  nodes,
}

export default function IsometricLayersDemo() {
  const [msg, setMsg] = useState('hover a layer to expand it · click a node to focus · click a floor to solo · click empty space to reset')

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingTop: 28 }}>
      <div style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>Isometric layers — interactive</div>
      <div id="event-readout" style={{ color: '#7dd3fc', fontFamily: 'monospace', fontSize: 12, minHeight: 16 }}>{msg}</div>
      <IsoDiagram
        config={config}
        options={{ interactive: true, animate: false, expandOnHover: true }}
        onNodeClick={(n, m) => setMsg(`node ▸ ${n.label}  ·  tier ${m.tier} #${m.index}${n.link ? `  ·  link ${n.link}` : ''}`)}
        onLayerClick={(t) => setMsg(`layer ▸ solo ${config.tiers[t].name}`)}
      />
    </div>
  )
}
