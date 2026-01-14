import React, { useState, useEffect } from 'react'
import { isoToScreen, isoBox } from '../utils/isometric'
import { configToYaml } from '../utils/yamlConfig'

// =============================================================================
// TYPOGRAPHY - JetBrains Mono for technical aesthetic
// =============================================================================
const MONO_FONT = '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace'

// =============================================================================
// TIER SYSTEM - Declarative layer definitions
// =============================================================================
interface TierConfig {
  name: string
  elevation: number
  floorColor?: string
  floorOpacity?: number
  borderColor?: string
  // Declarative visual options
  nodeOpacity?: number      // Default opacity for nodes in this tier (0-1)
  blur?: number             // Blur amount for depth effect (px)
}

// =============================================================================
// NODE OPTIONS - Declarative visual properties
// =============================================================================
interface NodeStyle {
  opacity?: number          // Override tier opacity (0-1)
  blur?: number             // Blur for depth effect (px)
  translucent?: boolean     // Glass-like effect with backdrop
}

// =============================================================================
// EXAMPLE 1: Layered Design System
// =============================================================================
const DESIGN_SYSTEM = {
  id: 'ARC.ISO.001',
  title: 'Design System',
  description: 'UI component hierarchy',
  theme: 'dark' as const,
  canvas: { width: 1100, height: 700 },
  origin: { x: 550, y: 620 },
  cornerRadius: 14,

  tiers: [
    { name: 'Documents', elevation: 0, floorColor: '#0f172a', floorOpacity: 0.95, borderColor: '#334155' },
    { name: 'Components', elevation: 150, floorColor: '#1e293b', floorOpacity: 0.7, borderColor: '#475569' },
    { name: 'Application', elevation: 300, floorColor: '#334155', floorOpacity: 0.5, borderColor: '#64748b' },
  ] as TierConfig[],

  floorSize: { width: 380, depth: 260 },

  nodes: [
    // Tier 0: Documents - 2x2 grid with generous spacing
    { tier: 0, x: 25, y: 25, width: 150, depth: 100, height: 14, color: 'slate', label: 'Doc' },
    { tier: 0, x: 200, y: 25, width: 150, depth: 100, height: 14, color: 'slate', label: 'Chart' },
    { tier: 0, x: 25, y: 145, width: 150, depth: 100, height: 14, color: 'emerald', label: 'Data' },
    { tier: 0, x: 200, y: 145, width: 150, depth: 100, height: 14, color: 'slate', label: 'Report' },

    // Tier 1: Components - 2x2 grid
    { tier: 1, x: 25, y: 25, width: 150, depth: 100, height: 26, color: 'slate', label: 'Card' },
    { tier: 1, x: 200, y: 25, width: 150, depth: 100, height: 26, color: 'blue', label: 'Button' },
    { tier: 1, x: 25, y: 145, width: 150, depth: 100, height: 26, color: 'slate', label: 'Input' },
    { tier: 1, x: 200, y: 145, width: 150, depth: 100, height: 26, color: 'violet', label: 'Modal' },

    // Tier 2: Application - 2x2 grid
    { tier: 2, x: 25, y: 25, width: 150, depth: 100, height: 24, color: 'slate', label: 'Nav' },
    { tier: 2, x: 200, y: 25, width: 150, depth: 100, height: 32, color: 'blue', label: 'Dashboard' },
    { tier: 2, x: 25, y: 145, width: 150, depth: 100, height: 24, color: 'cyan', label: 'Sidebar' },
    { tier: 2, x: 200, y: 145, width: 150, depth: 100, height: 24, color: 'amber', label: 'Panel' },
  ]
}

// =============================================================================
// EXAMPLE 2: Data Platform Architecture
// =============================================================================
const DATA_PLATFORM = {
  id: 'ARC.ISO.002',
  title: 'Data Platform',
  description: 'Domain-driven architecture',
  theme: 'light' as const,
  canvas: { width: 1100, height: 720 },
  origin: { x: 550, y: 640 },
  cornerRadius: 14,

  tiers: [
    { name: 'Data', elevation: 0, floorColor: '#f1f5f9', floorOpacity: 0.9, borderColor: '#94a3b8' },
    { name: 'Services', elevation: 150, floorColor: '#e0f2fe', floorOpacity: 0.7, borderColor: '#7dd3fc' },
    { name: 'Domains', elevation: 300, floorColor: '#dbeafe', floorOpacity: 0.5, borderColor: '#93c5fd' },
  ] as TierConfig[],

  floorSize: { width: 460, depth: 280 },

  nodes: [
    // Tier 0: Data - 2x3 grid with generous space
    { tier: 0, x: 25, y: 25, width: 120, depth: 90, height: 34, color: 'blue', label: 'SQL' },
    { tier: 0, x: 165, y: 25, width: 120, depth: 90, height: 34, color: 'blue', label: 'NoSQL' },
    { tier: 0, x: 305, y: 25, width: 120, depth: 90, height: 34, color: 'blue', label: 'S3' },
    { tier: 0, x: 25, y: 135, width: 170, depth: 90, height: 32, color: 'cyan', label: 'Data Lake' },
    { tier: 0, x: 215, y: 135, width: 170, depth: 90, height: 32, color: 'cyan', label: 'Warehouse' },
    { tier: 0, x: 405, y: 25, width: 35, depth: 200, height: 30, color: 'emerald', label: 'Stream' },

    // Tier 1: Services - 2x4 grid
    { tier: 1, x: 20, y: 20, width: 100, depth: 80, height: 40, color: 'violet', label: 'Ingest' },
    { tier: 1, x: 130, y: 20, width: 100, depth: 80, height: 42, color: 'violet', label: 'Transform' },
    { tier: 1, x: 240, y: 20, width: 100, depth: 80, height: 40, color: 'violet', label: 'Model' },
    { tier: 1, x: 350, y: 20, width: 90, depth: 80, height: 38, color: 'violet', label: 'Serve' },
    { tier: 1, x: 35, y: 120, width: 130, depth: 90, height: 44, color: 'cyan', label: 'Ontology' },
    { tier: 1, x: 185, y: 120, width: 130, depth: 90, height: 42, color: 'cyan', label: 'Logic' },
    { tier: 1, x: 335, y: 120, width: 105, depth: 90, height: 40, color: 'cyan', label: 'Actions' },

    // Tier 2: Domains - 1x3 panels
    { tier: 2, x: 25, y: 70, width: 135, depth: 130, height: 22, color: 'blue', label: 'Customers' },
    { tier: 2, x: 175, y: 70, width: 135, depth: 130, height: 22, color: 'blue', label: 'Channels' },
    { tier: 2, x: 325, y: 70, width: 115, depth: 130, height: 22, color: 'blue', label: 'Products' },
  ],

  pillars: [
    { x: 90, y: 240, fromTier: 0, toTier: 2 },
    { x: 230, y: 240, fromTier: 0, toTier: 2 },
    { x: 380, y: 240, fromTier: 0, toTier: 2 },
  ]
}

// =============================================================================
// EXAMPLE 3: Enterprise Architecture
// =============================================================================
const ENTERPRISE = {
  id: 'ARC.ISO.003',
  title: 'Enterprise System',
  description: 'Multi-tier architecture',
  theme: 'light' as const,
  canvas: { width: 1100, height: 760 },
  origin: { x: 550, y: 680 },
  cornerRadius: 14,

  tiers: [
    { name: 'Infrastructure', elevation: 0, floorColor: '#f8fafc', floorOpacity: 0.95, borderColor: '#cbd5e1' },
    { name: 'Platform', elevation: 160, floorColor: '#ede9fe', floorOpacity: 0.7, borderColor: '#c4b5fd' },
    { name: 'Applications', elevation: 320, floorColor: '#fef3c7', floorOpacity: 0.5, borderColor: '#fcd34d' },
  ] as TierConfig[],

  floorSize: { width: 480, depth: 300 },

  nodes: [
    // Tier 0: Infrastructure - 2x4 grid with generous breathing room
    { tier: 0, x: 20, y: 20, width: 110, depth: 85, height: 36, color: 'slate', label: 'Compute' },
    { tier: 0, x: 145, y: 20, width: 110, depth: 85, height: 36, color: 'slate', label: 'Storage' },
    { tier: 0, x: 270, y: 20, width: 110, depth: 85, height: 36, color: 'slate', label: 'Network' },
    { tier: 0, x: 395, y: 20, width: 65, depth: 85, height: 36, color: 'emerald', label: 'Security' },
    { tier: 0, x: 20, y: 125, width: 145, depth: 95, height: 34, color: 'blue', label: 'Kubernetes' },
    { tier: 0, x: 185, y: 125, width: 145, depth: 95, height: 34, color: 'blue', label: 'Database' },
    { tier: 0, x: 350, y: 125, width: 110, depth: 95, height: 34, color: 'blue', label: 'Message Q' },

    // Tier 1: Platform - 2x4 grid
    { tier: 1, x: 20, y: 20, width: 110, depth: 85, height: 42, color: 'violet', label: 'Auth' },
    { tier: 1, x: 145, y: 20, width: 110, depth: 85, height: 44, color: 'violet', label: 'API GW' },
    { tier: 1, x: 270, y: 20, width: 110, depth: 85, height: 40, color: 'violet', label: 'Events' },
    { tier: 1, x: 395, y: 20, width: 65, depth: 85, height: 38, color: 'violet', label: 'Cache' },
    { tier: 1, x: 20, y: 125, width: 145, depth: 95, height: 46, color: 'cyan', label: 'Workflows' },
    { tier: 1, x: 185, y: 125, width: 145, depth: 95, height: 44, color: 'cyan', label: 'Analytics' },
    { tier: 1, x: 350, y: 125, width: 110, depth: 95, height: 42, color: 'cyan', label: 'ML Engine' },

    // Tier 2: Applications - 2x3 grid
    { tier: 2, x: 25, y: 40, width: 145, depth: 105, height: 28, color: 'amber', label: 'CRM' },
    { tier: 2, x: 190, y: 40, width: 145, depth: 105, height: 28, color: 'amber', label: 'ERP' },
    { tier: 2, x: 355, y: 40, width: 105, depth: 105, height: 28, color: 'amber', label: 'BI' },
    { tier: 2, x: 25, y: 165, width: 145, depth: 105, height: 26, color: 'rose', label: 'Portal' },
    { tier: 2, x: 190, y: 165, width: 145, depth: 105, height: 26, color: 'rose', label: 'Mobile' },
    { tier: 2, x: 355, y: 165, width: 105, depth: 105, height: 26, color: 'rose', label: 'Admin' },
  ],
}

// =============================================================================
// Color utilities
// =============================================================================

/**
 * Interpolate between two hex colors based on intensity (0-1)
 * Used for Lambert shading on curved surfaces
 */
function interpolateColor(darkColor: string, lightColor: string, intensity: number): string {
  // Parse hex colors
  const parseHex = (hex: string) => {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  };

  const dark = parseHex(darkColor);
  const light = parseHex(lightColor);

  // Lerp between dark and light based on intensity
  const r = Math.round(dark.r + (light.r - dark.r) * intensity);
  const g = Math.round(dark.g + (light.g - dark.g) * intensity);
  const b = Math.round(dark.b + (light.b - dark.b) * intensity);

  return `rgb(${r},${g},${b})`;
}

// =============================================================================
// Color palettes
// =============================================================================
const DARK_COLORS: Record<string, { top: string; side: string; front: string }> = {
  blue: { top: '#3b82f6', side: '#2563eb', front: '#1d4ed8' },
  violet: { top: '#8b5cf6', side: '#7c3aed', front: '#6d28d9' },
  cyan: { top: '#06b6d4', side: '#0891b2', front: '#0e7490' },
  emerald: { top: '#10b981', side: '#059669', front: '#047857' },
  amber: { top: '#f59e0b', side: '#d97706', front: '#b45309' },
  rose: { top: '#f43f5e', side: '#e11d48', front: '#be123c' },
  slate: { top: '#475569', side: '#334155', front: '#1e293b' },
  zinc: { top: '#52525b', side: '#3f3f46', front: '#27272a' },
}

const LIGHT_COLORS: Record<string, { top: string; side: string; front: string }> = {
  blue: { top: '#93c5fd', side: '#60a5fa', front: '#3b82f6' },
  violet: { top: '#c4b5fd', side: '#a78bfa', front: '#8b5cf6' },
  cyan: { top: '#67e8f9', side: '#22d3ee', front: '#06b6d4' },
  emerald: { top: '#6ee7b7', side: '#34d399', front: '#10b981' },
  amber: { top: '#fcd34d', side: '#fbbf24', front: '#f59e0b' },
  rose: { top: '#fda4af', side: '#fb7185', front: '#f43f5e' },
  slate: { top: '#e2e8f0', side: '#cbd5e1', front: '#94a3b8' },
  zinc: { top: '#e4e4e7', side: '#d4d4d8', front: '#a1a1aa' },
}

// =============================================================================
// Isometric Text Component - technical mono font
// =============================================================================
function IsoText({
  x, y, z,
  children,
  fontSize = 8,
  color = '#1e293b',
}: {
  x: number; y: number; z: number;
  children: string;
  fontSize?: number;
  color?: string;
}) {
  const pos = isoToScreen(x, y, z)

  return (
    <g transform={`translate(${pos.screenX}, ${pos.screenY})`}>
      <g transform="matrix(0.866, -0.5, 0.866, 0.5, 0, 0)">
        <text
          x={0}
          y={0}
          textAnchor="middle"
          fill={color}
          fontSize={fontSize}
          fontWeight={500}
          fontFamily={MONO_FONT}
          style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          {children}
        </text>
      </g>
    </g>
  )
}

// =============================================================================
// Floor Grid Component - Isometric grid lines on floor plane
// =============================================================================
function FloorGrid({
  width, depth, elevation, theme, spacing = 40, offsetX = 0, offsetY = 0
}: {
  width: number; depth: number; elevation: number;
  theme: 'dark' | 'light'; spacing?: number;
  offsetX?: number; offsetY?: number;
}) {
  const gridColor = theme === 'dark' ? '#334155' : '#cbd5e1'
  const lines: React.ReactNode[] = []

  // Lines parallel to Y axis (going from front-left to back-right in iso view)
  for (let x = offsetX; x <= width + offsetX; x += spacing) {
    const start = isoToScreen(x, offsetY, elevation)
    const end = isoToScreen(x, depth + offsetY, elevation)
    lines.push(
      <line
        key={`x-${x}`}
        x1={start.screenX}
        y1={start.screenY}
        x2={end.screenX}
        y2={end.screenY}
        stroke={gridColor}
        strokeWidth={0.5}
        opacity={0.5}
      />
    )
  }

  // Lines parallel to X axis (going from front-right to back-left in iso view)
  for (let y = offsetY; y <= depth + offsetY; y += spacing) {
    const start = isoToScreen(offsetX, y, elevation)
    const end = isoToScreen(width + offsetX, y, elevation)
    lines.push(
      <line
        key={`y-${y}`}
        x1={start.screenX}
        y1={start.screenY}
        x2={end.screenX}
        y2={end.screenY}
        stroke={gridColor}
        strokeWidth={0.5}
        opacity={0.5}
      />
    )
  }

  return <g>{lines}</g>
}

// =============================================================================
// Floor Plane with border
// =============================================================================
function FloorPlane({
  width, depth, elevation, color, opacity, borderColor, theme, isGround, showGrid = false
}: {
  width: number; depth: number; elevation: number;
  color: string; opacity: number; borderColor?: string;
  theme: 'dark' | 'light'; isGround?: boolean; showGrid?: boolean
}) {
  const thickness = isGround ? 8 : 2
  const box = isoBox(width, depth, thickness, 0, 0)
  const pos = isoToScreen(0, 0, elevation)

  return (
    <g transform={`translate(${pos.screenX}, ${pos.screenY})`}>
      {/* Shadow for ground plane */}
      {isGround && (
        <g transform="translate(4, 4)" opacity={0.2}>
          <path d={box.top} fill="#000" />
        </g>
      )}

      {/* Floor surfaces */}
      <path d={box.top} fill={color} opacity={opacity} />

      {/* Grid lines on floor (rendered relative to floor position) */}
      {showGrid && (
        <g transform={`translate(${-pos.screenX}, ${-pos.screenY})`}>
          <FloorGrid width={width} depth={depth} elevation={elevation} theme={theme} spacing={50} />
        </g>
      )}

      {/* Side faces for ground */}
      {isGround && (
        <>
          <path d={box.left} fill={theme === 'dark' ? '#0f172a' : '#cbd5e1'} opacity={0.8} />
          <path d={box.right} fill={theme === 'dark' ? '#1e293b' : '#94a3b8'} opacity={0.8} />
        </>
      )}

      {/* Border */}
      <path
        d={box.top}
        fill="none"
        stroke={borderColor || (theme === 'dark' ? '#475569' : '#94a3b8')}
        strokeWidth={isGround ? 1.5 : 0.75}
        opacity={isGround ? 1 : 0.6}
      />
    </g>
  )
}

// =============================================================================
// Pillar Component
// =============================================================================
function Pillar({
  x, y, fromElevation, toElevation, colors
}: {
  x: number; y: number; fromElevation: number; toElevation: number;
  colors: typeof LIGHT_COLORS
}) {
  const height = toElevation - fromElevation
  const pos = isoToScreen(x, y, fromElevation)
  const box = isoBox(6, 6, height, pos.screenX, pos.screenY)
  const c = colors.slate

  return (
    <g opacity={0.5}>
      <path d={box.left} fill={c.side} />
      <path d={box.right} fill={c.front} />
      <path d={box.top} fill={c.top} />
    </g>
  )
}

// =============================================================================
// Effects Panel Component
// =============================================================================
interface EffectOption {
  key: string
  label: string
  enabled: boolean
}

function EffectsPanel({
  effects,
  onToggle,
  theme
}: {
  effects: EffectOption[]
  onToggle: (key: string) => void
  theme: 'dark' | 'light'
}) {
  const bg = theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 250, 252, 0.95)'
  const border = theme === 'dark' ? '#334155' : '#e2e8f0'
  const text = theme === 'dark' ? '#94a3b8' : '#64748b'
  const activeText = theme === 'dark' ? '#e2e8f0' : '#1e293b'
  const activeBg = theme === 'dark' ? '#3b82f6' : '#3b82f6'

  return (
    <div
      className="absolute top-14 right-3 flex flex-col gap-1 rounded-md overflow-hidden z-10"
      style={{ backgroundColor: bg, border: `1px solid ${border}`, padding: '6px' }}
    >
      <div style={{ fontFamily: MONO_FONT, fontSize: '8px', color: text, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>
        Effects
      </div>
      {effects.map(effect => (
        <button
          key={effect.key}
          onClick={() => onToggle(effect.key)}
          className="flex items-center gap-2 px-2 py-1 rounded transition-colors text-left"
          style={{
            fontFamily: MONO_FONT,
            fontSize: '9px',
            color: effect.enabled ? activeText : text,
            backgroundColor: effect.enabled ? (theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)') : 'transparent',
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: effect.enabled ? activeBg : (theme === 'dark' ? '#475569' : '#cbd5e1'),
              transition: 'background-color 0.15s',
            }}
          />
          {effect.label}
        </button>
      ))}
    </div>
  )
}

// =============================================================================
// Zoom Controls Component
// =============================================================================
function ZoomControls({
  zoom, onZoomIn, onZoomOut, onReset, theme
}: {
  zoom: number; onZoomIn: () => void; onZoomOut: () => void; onReset: () => void;
  theme: 'dark' | 'light'
}) {
  const bg = theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 250, 252, 0.95)'
  const border = theme === 'dark' ? '#334155' : '#e2e8f0'
  const text = theme === 'dark' ? '#94a3b8' : '#64748b'
  const active = theme === 'dark' ? '#60a5fa' : '#3b82f6'
  const isModified = zoom !== 1

  return (
    <div
      className="absolute bottom-3 right-3 flex items-center gap-0.5 rounded-md overflow-hidden"
      style={{ backgroundColor: bg, border: `1px solid ${border}` }}
    >
      <button
        onClick={onZoomOut}
        className="px-2 py-1.5 hover:bg-black/10 transition-colors"
        title="Zoom out"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={text} strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35M8 11h6" />
        </svg>
      </button>
      <button
        onClick={onReset}
        className="px-2 py-1 hover:bg-black/10 transition-colors min-w-[44px]"
        style={{ color: isModified ? active : text, fontFamily: MONO_FONT, fontSize: '11px', fontWeight: 500 }}
        title="Reset view"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        onClick={onZoomIn}
        className="px-2 py-1.5 hover:bg-black/10 transition-colors"
        title="Zoom in"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={text} strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
        </svg>
      </button>
    </div>
  )
}

// =============================================================================
// Main Diagram Renderer
// =============================================================================
interface DiagramNode {
  tier: number
  x: number
  y: number
  width: number
  depth: number
  height: number
  color: string
  label: string
  // Declarative visual options
  opacity?: number          // Node opacity (0-1)
  blur?: number             // Blur for depth effect (px)
  translucent?: boolean     // Glass-like effect
}

interface DiagramConfig {
  id?: string             // Diagram identifier (e.g., 'ARC.ISO.001')
  title: string
  description: string
  theme: 'dark' | 'light'
  canvas: { width: number; height: number }
  origin: { x: number; y: number }
  cornerRadius?: number   // Rounded corner radius for boxes
  tiers: TierConfig[]
  floorSize: { width: number; depth: number }
  nodes: DiagramNode[]
  pillars?: { x: number; y: number; fromTier: number; toTier: number }[]
}

function IsometricDiagram({ config, drawerOpen = false }: { config: DiagramConfig; drawerOpen?: boolean }) {
  const { theme, canvas, origin, tiers, floorSize, nodes, pillars, cornerRadius = 0 } = config
  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS
  const bgColor = theme === 'dark' ? '#0f172a' : '#fafafa'
  const textColor = theme === 'dark' ? '#e2e8f0' : '#1e293b'
  const labelColor = theme === 'dark' ? '#64748b' : '#94a3b8'

  // Canvas interaction state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 })

  // Tier hover state with debounce
  const [hoveredTier, setHoveredTierRaw] = useState<number | null>(null)
  const tierHoverTimeout = React.useRef<NodeJS.Timeout | null>(null)
  const setHoveredTier = (tier: number | null) => {
    if (tierHoverTimeout.current) clearTimeout(tierHoverTimeout.current)
    if (tier === null) {
      // Delay clearing hover to prevent flicker
      tierHoverTimeout.current = setTimeout(() => setHoveredTierRaw(null), 50)
    } else {
      setHoveredTierRaw(tier)
    }
  }

  // Node hover state with debounce
  const [hoveredNode, setHoveredNodeRaw] = useState<{ tier: number; index: number } | null>(null)
  const nodeHoverTimeout = React.useRef<NodeJS.Timeout | null>(null)
  const setHoveredNode = (node: { tier: number; index: number } | null) => {
    if (nodeHoverTimeout.current) clearTimeout(nodeHoverTimeout.current)
    if (node === null) {
      nodeHoverTimeout.current = setTimeout(() => setHoveredNodeRaw(null), 50)
    } else {
      setHoveredNodeRaw(node)
    }
  }

  // Entrance animation state - each tier animates in staggered
  const [animatedTiers, setAnimatedTiers] = useState<Set<number>>(new Set())

  // Effect toggles - controlled by the effects panel
  const [effects, setEffects] = useState({
    entranceAnimation: true,
    tierHover: true,
    nodeHover: true,
    explodeView: false,
    gridLines: false,
    breathingPulse: false,
    wireframe: false,
    floatingLabels: false,
    spotlight: false,
    monochrome: false,
    xray: false,
    traySlide: false,
  })

  const toggleEffect = (key: keyof typeof effects) => {
    setEffects(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Explode factor - controlled by toggle (0 = compact, 1 = exploded)
  const explodeFactor = effects.explodeView ? 1 : 0

  useEffect(() => {
    if (effects.entranceAnimation) {
      // Reset and re-animate
      setAnimatedTiers(new Set())
      // Stagger tier entrance: each tier appears 150ms after the previous
      tiers.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedTiers(prev => new Set([...prev, index]))
        }, index * 150 + 100) // 100ms initial delay, then 150ms stagger
      })
    } else {
      // Show all tiers immediately
      setAnimatedTiers(new Set(tiers.map((_, i) => i)))
    }

    // Cleanup on unmount or config change
    return () => setAnimatedTiers(new Set())
  }, [config.id, effects.entranceAnimation]) // Re-trigger on diagram change or toggle

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }
  const zoomIn = () => setZoom(z => Math.min(3, z * 1.2))
  const zoomOut = () => setZoom(z => Math.max(0.3, z / 1.2))

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.max(0.3, Math.min(3, z * delta)))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: panStart.panX + e.clientX - panStart.x, y: panStart.panY + e.clientY - panStart.y })
    }
  }

  const handleMouseUp = () => setIsPanning(false)

  // ==========================================================================
  // PAINTER'S ALGORITHM - Sort nodes back-to-front for proper occlusion
  // ==========================================================================
  // In isometric projection:
  //   - Objects with HIGHER (x + y) are FURTHER from the viewer (back-left)
  //   - Objects with LOWER (x + y) are CLOSER to the viewer (front-right)
  //   - Lower tiers are behind upper tiers
  //
  // Paint order: back objects FIRST, front objects LAST (so front overlaps back)
  // Sort: ascending by tier elevation, then DESCENDING by (x + y)
  // ==========================================================================
  const sortedNodes = [...nodes].sort((a, b) => {
    const aElev = tiers[a.tier]?.elevation || 0
    const bElev = tiers[b.tier]?.elevation || 0
    // Lower tiers paint first (they're behind)
    if (aElev !== bElev) return aElev - bElev
    // Within same tier: higher (x + y) paint first (they're in the back)
    // Also factor in the node's far corner for more accurate sorting
    const aDepth = (a.x + a.width) + (a.y + a.depth)
    const bDepth = (b.x + b.width) + (b.y + b.depth)
    return bDepth - aDepth  // DESCENDING - back objects first
  })

  return (
    <div
      className="overflow-hidden shadow-2xl border border-slate-700/30 relative transition-all duration-300"
      style={{ borderRadius: drawerOpen ? '8px 8px 0 0' : '8px' }}
    >
      {/* Compact header */}
      <div
        className="px-3 py-2 border-b flex items-center justify-between"
        style={{
          backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc',
          borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0'
        }}
      >
        <span style={{ color: textColor, fontFamily: MONO_FONT, fontSize: '12px', fontWeight: 600, letterSpacing: '0.02em' }}>
          {config.title}
        </span>
        <span style={{
          color: labelColor,
          fontFamily: MONO_FONT,
          fontSize: '10px',
          padding: '2px 6px',
          backgroundColor: theme === 'dark' ? '#1e293b' : '#f1f5f9',
          borderRadius: '4px'
        }}>
          {tiers.length} tiers
        </span>
      </div>

      <svg
        width={canvas.width}
        height={canvas.height}
        style={{ backgroundColor: bgColor, cursor: isPanning ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Definitions for grid and blur filters */}
        <defs>
          <pattern id={`grid-${config.title}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.5" fill={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
          </pattern>
          {/* Blur filters for depth effect */}
          <filter id={`blur-1-${config.title}`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1" />
          </filter>
          <filter id={`blur-2-${config.title}`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
          <filter id={`blur-3-${config.title}`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          {/* Glass effect for translucent nodes */}
          <filter id={`glass-${config.title}`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
          {/* Hover glow effect */}
          <filter id={`hover-glow-${config.title}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor={theme === 'dark' ? '#60a5fa' : '#3b82f6'} floodOpacity="0.3" />
          </filter>
          {/* Node drop shadow */}
          <filter id={`node-shadow-${config.title}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="3" dy="6" stdDeviation="4" floodColor="#000" floodOpacity="0.35" />
          </filter>
          {/* Monochrome filter */}
          <filter id={`monochrome-${config.title}`}>
            <feColorMatrix type="saturate" values="0" />
          </filter>
          {/* Animations */}
          <style>{`
            @keyframes pulse-breathe {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.03); opacity: 0.9; }
            }
            @keyframes float-label {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-3px); }
            }
            @keyframes spin-sway {
              0%, 100% { transform: scaleX(1) translateX(0); }
              25% { transform: scaleX(0.98) translateX(-8px); }
              75% { transform: scaleX(0.98) translateX(8px); }
            }
          `}</style>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${config.title})`} opacity="0.5" />

        {/* Transform group */}
        <g transform={`translate(${canvas.width / 2}, ${canvas.height / 2}) scale(${zoom}) translate(${-canvas.width / 2 + pan.x}, ${-canvas.height / 2 + pan.y})`}>
          <g
            transform={`translate(${origin.x}, ${origin.y})`}
            style={{ filter: effects.monochrome ? 'grayscale(100%)' : 'none' }}
          >
            {/* ================================================================
                LAYERED RENDERING - Each tier is painted as a complete unit
                Order: Floor → Pillars → Nodes → Label, then next tier
                This ensures upper tiers are ALWAYS on top of lower tiers
            ================================================================ */}

            {/* Ground reference grid - at tier 0 elevation */}
            {effects.gridLines && (
              <g opacity={0.4}>
                <FloorGrid
                  width={floorSize.width}
                  depth={floorSize.depth}
                  elevation={tiers[0]?.elevation ?? 0}
                  theme={theme}
                  spacing={40}
                  offsetX={0}
                  offsetY={0}
                />
              </g>
            )}

            {tiers.map((tier, tierIndex) => {
              // Get nodes for this tier, sorted by depth (back-to-front)
              const tierNodes = sortedNodes.filter(n => n.tier === tierIndex)
              const isHovered = hoveredTier === tierIndex

              // Explode effect: spread tiers further apart
              const explodeMultiplier = 1 + explodeFactor * 0.8 // Up to 1.8x spacing
              const effectiveElevation = tier.elevation * explodeMultiplier

              // Entrance animation: tier slides up from below
              const hasEntered = animatedTiers.has(tierIndex)
              const entranceOffset = hasEntered ? 0 : 60
              const entranceOpacity = hasEntered ? 1 : 0

              // Hover effects: slight scale, lift, and focus (when enabled)
              const hoverActive = effects.tierHover && isHovered
              const hoverScale = hoverActive ? 1.02 : 1
              const hoverLift = hoverActive ? 8 : 0
              const hoverOpacityBoost = hoverActive ? 0.15 : 0

              // Spotlight: dramatic dim when anything is hovered
              const spotlightActive = effects.spotlight && (hoveredTier !== null || hoveredNode !== null)
              const isSpotlit = effects.spotlight && (isHovered || (hoveredNode?.tier === tierIndex))

              // Dim other tiers when one is hovered
              const dimmed = (effects.tierHover && hoveredTier !== null && !isHovered) ||
                             (spotlightActive && !isSpotlit)
              const dimAmount = effects.spotlight ? 0.15 : 0.5
              const baseOpacity = dimmed ? dimAmount : 1
              const tierOpacity = entranceOpacity * baseOpacity

              // Tray slide: each tier slides in a different direction
              // Directions cycle: right-up, left-up, right-down, left-down
              const trayDirections = [
                { x: 60, y: -30 },   // Tier 0: slide right-up (along X axis in iso)
                { x: -60, y: -30 },  // Tier 1: slide left-up (along Y axis in iso)
                { x: 80, y: 20 },    // Tier 2: slide right-down (opposite of Y)
                { x: -80, y: 20 },   // Tier 3: slide left-down (opposite of X)
              ]
              const trayDir = trayDirections[tierIndex % trayDirections.length]
              const trayOffset = effects.traySlide && isHovered
                ? { x: trayDir.x, y: trayDir.y }
                : { x: 0, y: 0 }

              // Calculate transform origin for scaling (center of floor at effective elevation)
              const floorCenter = isoToScreen(floorSize.width / 2, floorSize.depth / 2, effectiveElevation)

              // Tier filter (hover glow)
              const tierFilter = isHovered ? `url(#hover-glow-${config.title})` : 'none'

              return (
                <g
                  key={`tier-group-${tierIndex}`}
                  onMouseEnter={(e) => {
                    e.stopPropagation()
                    // Only hover if no higher tier is already hovered
                    if (hoveredTier === null || tierIndex >= hoveredTier) {
                      setHoveredTier(tierIndex)
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation()
                    if (hoveredTier === tierIndex) {
                      setHoveredTier(null)
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Visual group - this moves, but hit area stays in place */}
                  <g
                    style={{
                      transform: `translate(${floorCenter.screenX + trayOffset.x}px, ${floorCenter.screenY + entranceOffset + trayOffset.y}px) scale(${hoverScale}) translate(${-floorCenter.screenX}px, ${-floorCenter.screenY - hoverLift}px)`,
                      transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out, filter 0.25s ease-out',
                      filter: tierFilter,
                      opacity: tierOpacity,
                      pointerEvents: 'none',
                    }}
                  >
                  {/* 1. Floor plane for this tier */}
                  <FloorPlane
                    width={floorSize.width}
                    depth={floorSize.depth}
                    elevation={tierIndex === 0 ? -2 : effectiveElevation}
                    color={tier.floorColor || (theme === 'dark' ? '#0f172a' : '#f8fafc')}
                    opacity={Math.min(1, (tier.floorOpacity || (tierIndex === 0 ? 0.95 : 0.5)) + hoverOpacityBoost)}
                    borderColor={tier.borderColor}
                    theme={theme}
                    isGround={tierIndex === 0}
                  />

                  {/* 2. Pillars that START from this tier */}
                  {pillars?.filter(p => p.fromTier === tierIndex).map((pillar, i) => (
                    <Pillar
                      key={`pillar-${tierIndex}-${i}`}
                      x={pillar.x}
                      y={pillar.y}
                      fromElevation={tiers[pillar.fromTier]?.elevation || 0}
                      toElevation={tiers[pillar.toTier]?.elevation || 0}
                      colors={colors}
                    />
                  ))}

                  {/* 3. Nodes for this tier (already sorted by depth) */}
                  {tierNodes.map((node, i) => {
                    const nodeElevation = effectiveElevation + 5
                    const pos = isoToScreen(node.x, node.y, nodeElevation)
                    const box = isoBox(node.width, node.depth, node.height, pos.screenX, pos.screenY, cornerRadius)
                    const nodeColors = colors[node.color] || colors.slate

                    // Declarative visual properties (node overrides tier defaults)
                    const baseNodeOpacity = node.opacity ?? tier.nodeOpacity ?? 1
                    const nodeBlur = node.blur ?? tier.blur ?? 0

                    // Node blur filter
                    const nodeFilter = nodeBlur > 0
                      ? `url(#blur-${Math.min(3, Math.ceil(nodeBlur))}-${config.title})`
                      : undefined

                    // Node hover effects (when enabled)
                    const isNodeHovered = effects.nodeHover && hoveredNode?.tier === tierIndex && hoveredNode?.index === i
                    const anotherNodeHovered = effects.nodeHover && hoveredNode !== null && !isNodeHovered
                    const nodeHoverScale = isNodeHovered ? 1.06 : 1

                    // X-ray: semi-transparent nodes
                    const xrayOpacity = effects.xray ? 0.6 : 1

                    // Spotlight logic:
                    // - If a tier is hovered, all nodes in that tier stay lit
                    // - If a specific node is hovered, only that node stays lit
                    const tierIsSpotlit = effects.spotlight && hoveredTier === tierIndex
                    const nodeIsSpotlit = effects.spotlight && isNodeHovered
                    const somethingHovered = hoveredTier !== null || hoveredNode !== null
                    const shouldDimForSpotlight = effects.spotlight && somethingHovered && !tierIsSpotlit && !nodeIsSpotlit

                    let nodeOpacity = baseNodeOpacity * xrayOpacity
                    if (anotherNodeHovered && !tierIsSpotlit) nodeOpacity *= 0.4
                    if (shouldDimForSpotlight) nodeOpacity *= 0.15

                    // Breathing pulse animation - staggered by node position
                    const pulseDelay = (tierIndex * 0.3 + i * 0.15) % 2 // Stagger within 2s cycle
                    const pulseAnimation = effects.breathingPulse
                      ? `pulse-breathe 2.5s ease-in-out ${pulseDelay}s infinite`
                      : 'none'

                    // Calculate node center for transform origin (center of top face)
                    const nodeCenter = isoToScreen(
                      node.x + node.width / 2,
                      node.y + node.depth / 2,
                      nodeElevation + node.height
                    )

                    return (
                      <g
                        key={`node-${tierIndex}-${i}`}
                        style={{
                          transform: `scale(${nodeHoverScale})`,
                          transformOrigin: `${nodeCenter.screenX}px ${nodeCenter.screenY}px`,
                          transition: effects.breathingPulse ? 'none' : 'transform 0.15s ease-out, opacity 0.15s ease-out',
                          animation: pulseAnimation,
                          cursor: 'pointer',
                        }}
                        opacity={nodeOpacity}
                        filter={nodeFilter}
                        onMouseEnter={(e) => {
                          e.stopPropagation()
                          setHoveredNode({ tier: tierIndex, index: i })
                        }}
                        onMouseLeave={(e) => {
                          e.stopPropagation()
                          setHoveredNode(null)
                        }}
                      >
                        {/* Box faces - render back to front for proper occlusion */}
                        {/* Wireframe mode: transparent fill with colored stroke */}
                        {effects.wireframe ? (
                          <>
                            <path d={box.left} fill="none" stroke={nodeColors.side} strokeWidth="1.5" />
                            <path d={box.right} fill="none" stroke={nodeColors.front} strokeWidth="1.5" />
                            <path d={box.top} fill="none" stroke={nodeColors.top} strokeWidth="1.5" />
                          </>
                        ) : (
                          <>
                            {/* Back corners first (furthest from viewer) - with shading */}
                            {box.cornerBackRight?.map((seg: { path: string; intensity: number }, idx: number) => (
                              <path
                                key={`cbr-${idx}`}
                                d={seg.path}
                                fill={interpolateColor(nodeColors.front, nodeColors.side, seg.intensity)}
                              />
                            ))}
                            {box.cornerBackLeft?.map((seg: { path: string; intensity: number }, idx: number) => (
                              <path
                                key={`cbl-${idx}`}
                                d={seg.path}
                                fill={interpolateColor(nodeColors.side, nodeColors.front, seg.intensity)}
                              />
                            ))}

                            {/* Flat side faces */}
                            <path d={box.left} fill={nodeColors.side} />
                            <path d={box.right} fill={nodeColors.front} />

                            {/* Front corners (closer to viewer) - with shading */}
                            {box.cornerFrontRight?.map((seg: { path: string; intensity: number }, idx: number) => (
                              <path
                                key={`cfr-${idx}`}
                                d={seg.path}
                                fill={interpolateColor(nodeColors.front, nodeColors.side, seg.intensity)}
                              />
                            ))}
                            {box.cornerFrontLeft?.map((seg: { path: string; intensity: number }, idx: number) => (
                              <path
                                key={`cfl-${idx}`}
                                d={seg.path}
                                fill={interpolateColor(nodeColors.front, nodeColors.side, seg.intensity)}
                              />
                            ))}

                            {/* Top face (always on top) */}
                            <path d={box.top} fill={nodeColors.top} />

                            {/* Subtle edge highlight on top */}
                            <path d={box.top} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" strokeLinejoin="round" />
                          </>
                        )}

                        {node.label && (
                          <g style={{
                            animation: effects.floatingLabels ? `float-label 3s ease-in-out ${i * 0.2}s infinite` : 'none'
                          }}>
                            <IsoText
                              x={node.x + node.width / 2}
                              y={node.y + node.depth / 2}
                              z={nodeElevation + node.height + 2}
                              fontSize={node.width > 70 ? 8 : 7}
                              color={theme === 'dark' ? '#e2e8f0' : '#1e293b'}
                            >
                              {node.label}
                            </IsoText>
                          </g>
                        )}
                      </g>
                    )
                  })}

                  {/* 4. Tier label */}
                  <text
                    x={isoToScreen(-25, floorSize.depth / 2, tier.elevation + 15).screenX - 35}
                    y={isoToScreen(-25, floorSize.depth / 2, tier.elevation + 15).screenY}
                    fill={labelColor}
                    fontSize={9}
                    fontWeight={500}
                    fontFamily={MONO_FONT}
                    opacity={0.6}
                    style={{ letterSpacing: '0.05em' }}
                  >
                    {tier.name}
                  </text>
                  </g>
                  {/* Invisible hit area that stays in place when tray slides */}
                  {effects.traySlide && (() => {
                    const hitElevation = tierIndex === 0 ? -2 : effectiveElevation
                    const hitPos = isoToScreen(0, 0, hitElevation)
                    const hitBox = isoBox(floorSize.width, floorSize.depth, 8, hitPos.screenX, hitPos.screenY)
                    return (
                      <path
                        d={hitBox.top}
                        fill="black"
                        fillOpacity={0}
                        pointerEvents="all"
                      />
                    )
                  })()}
                </g>
              )
            })}
          </g>
        </g>
      </svg>

      {/* Effects panel */}
      <EffectsPanel
        effects={[
          { key: 'entranceAnimation', label: 'Entrance', enabled: effects.entranceAnimation },
          { key: 'tierHover', label: 'Tier Hover', enabled: effects.tierHover },
          { key: 'nodeHover', label: 'Node Hover', enabled: effects.nodeHover },
          { key: 'explodeView', label: 'Explode', enabled: effects.explodeView },
          { key: 'gridLines', label: 'Grid Lines', enabled: effects.gridLines },
          { key: 'breathingPulse', label: 'Breathing', enabled: effects.breathingPulse },
          { key: 'wireframe', label: 'Wireframe', enabled: effects.wireframe },
          { key: 'floatingLabels', label: 'Float Labels', enabled: effects.floatingLabels },
          { key: 'spotlight', label: 'Spotlight', enabled: effects.spotlight },
          { key: 'monochrome', label: 'Monochrome', enabled: effects.monochrome },
          { key: 'xray', label: 'X-Ray', enabled: effects.xray },
          { key: 'traySlide', label: 'Tray Slide', enabled: effects.traySlide },
        ]}
        onToggle={(key) => toggleEffect(key as keyof typeof effects)}
        theme={theme}
      />

      {/* Zoom controls */}
      <ZoomControls
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
        theme={theme}
      />

      {/* Diagram ID - clean mono text like ArcDiagram */}
      {config.id && (
        <div
          className="absolute bottom-3 left-3 z-10"
          style={{
            fontFamily: MONO_FONT,
            fontSize: '9px',
            letterSpacing: '0.1em',
            color: theme === 'dark' ? '#64748b' : '#94a3b8',
          }}
        >
          {config.id}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// YAML Syntax Highlighter - Warm theme with high contrast
// =============================================================================
function highlightYAML(yaml: string): React.ReactNode[] {
  const lines = yaml.split('\n')

  // Warm color palette for stone-900 background
  const colors = {
    key: '#fef3c7',      // amber-100 - warm cream for keys
    string: '#fdba74',   // orange-300 - warm orange for strings
    number: '#fb923c',   // orange-400 - bright orange for numbers
    anchor: '#f9a8d4',   // pink-300 - for &anchors and *refs
    comment: '#78716c',  // stone-500 - muted for comments
    colon: '#a8a29e',    // stone-400 - slightly brighter for colons
    dash: '#a8a29e',     // stone-400 - list markers
    dimension: '#67e8f9', // cyan-300 - for WxDxH patterns
    escape: '#c4b5fd',   // violet-300 - for { } escape hatches
  }

  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = []
    let remaining = line
    let partIdx = 0

    // Check for full-line comment first
    if (remaining.trim().startsWith('#')) {
      const wsMatch = remaining.match(/^(\s*)/)
      if (wsMatch && wsMatch[1]) {
        parts.push(<span key={`${lineIdx}-${partIdx++}`}>{wsMatch[1]}</span>)
        remaining = remaining.slice(wsMatch[1].length)
      }
      parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.comment }}>{remaining}</span>)
      return <div key={lineIdx}>{parts}</div>
    }

    while (remaining.length > 0) {
      // Leading whitespace
      const wsMatch = remaining.match(/^(\s+)/)
      if (wsMatch) {
        parts.push(<span key={`${lineIdx}-${partIdx++}`}>{wsMatch[1]}</span>)
        remaining = remaining.slice(wsMatch[1].length)
        continue
      }

      // List dash
      const dashMatch = remaining.match(/^(-\s)/)
      if (dashMatch) {
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.dash }}>{dashMatch[1]}</span>)
        remaining = remaining.slice(dashMatch[1].length)
        continue
      }

      // Anchor definition &name or reference *name
      const anchorMatch = remaining.match(/^([&*][a-zA-Z_][a-zA-Z0-9_]*)/)
      if (anchorMatch) {
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.anchor }}>{anchorMatch[1]}</span>)
        remaining = remaining.slice(anchorMatch[1].length)
        continue
      }

      // Escape hatch { ... }
      const escapeMatch = remaining.match(/^(\{[^}]*\})/)
      if (escapeMatch) {
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.escape }}>{escapeMatch[1]}</span>)
        remaining = remaining.slice(escapeMatch[1].length)
        continue
      }

      // Dimension patterns: 120x90x34 or 1100x720
      const dimMatch = remaining.match(/^(\d+x\d+(?:x\d+)?)/)
      if (dimMatch) {
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.dimension }}>{dimMatch[1]}</span>)
        remaining = remaining.slice(dimMatch[1].length)
        continue
      }

      // Position patterns: 25,25 or -10,20
      const posMatch = remaining.match(/^(-?\d+,-?\d+)/)
      if (posMatch) {
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.number }}>{posMatch[1]}</span>)
        remaining = remaining.slice(posMatch[1].length)
        continue
      }

      // Key: value (at start of meaningful content)
      const keyMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(\s*:\s*)/)
      if (keyMatch) {
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.key }}>{keyMatch[1]}</span>)
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.colon }}>{keyMatch[2]}</span>)
        remaining = remaining.slice(keyMatch[0].length)
        continue
      }

      // Tier pattern: Name @ 150
      const tierMatch = remaining.match(/^([A-Z][a-zA-Z]*)\s*(@)\s*(\d+)/)
      if (tierMatch) {
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.string }}>{tierMatch[1]}</span>)
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.colon }}> {tierMatch[2]} </span>)
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.number }}>{tierMatch[3]}</span>)
        remaining = remaining.slice(tierMatch[0].length)
        continue
      }

      // Arrow patterns: 0->2
      const arrowMatch = remaining.match(/^(\d+)(->)(\d+)/)
      if (arrowMatch) {
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.number }}>{arrowMatch[1]}</span>)
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.colon }}>{arrowMatch[2]}</span>)
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.number }}>{arrowMatch[3]}</span>)
        remaining = remaining.slice(arrowMatch[0].length)
        continue
      }

      // Inline comment
      const commentMatch = remaining.match(/^(#.*)$/)
      if (commentMatch) {
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.comment }}>{commentMatch[1]}</span>)
        remaining = ''
        continue
      }

      // Plain number
      const numMatch = remaining.match(/^(\d+\.?\d*)/)
      if (numMatch) {
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.number }}>{numMatch[1]}</span>)
        remaining = remaining.slice(numMatch[1].length)
        continue
      }

      // Word/identifier (labels, color names)
      const wordMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/)
      if (wordMatch) {
        parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: colors.string }}>{wordMatch[1]}</span>)
        remaining = remaining.slice(wordMatch[1].length)
        continue
      }

      // Anything else (single char fallback)
      parts.push(<span key={`${lineIdx}-${partIdx++}`} style={{ color: '#a8a29e' }}>{remaining[0]}</span>)
      remaining = remaining.slice(1)
    }

    return <div key={lineIdx}>{parts}</div>
  })
}

// =============================================================================
// Markup Viewer Component - Slides out from below the diagram
// =============================================================================
function MarkupViewer({ config, isOpen, onToggle }: { config: DiagramConfig; isOpen: boolean; onToggle: () => void }) {
  // Convert config to YAML format
  const yamlString = configToYaml(config)

  return (
    <div className="relative">
      {/* Toggle tab - sticks out from bottom of diagram */}
      <button
        onClick={onToggle}
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-b-md transition-all z-10"
        style={{
          top: 0,
          padding: '4px 12px',
          backgroundColor: isOpen ? '#f59e0b' : '#292524',
          color: isOpen ? '#1c1917' : '#a8a29e',
          border: `1px solid ${isOpen ? '#fbbf24' : '#44403c'}`,
          borderTop: 'none',
          fontFamily: MONO_FONT,
          fontSize: '10px',
          fontWeight: 500,
        }}
        title="View declarative config"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        YAML
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Sliding drawer content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? '400px' : '0',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div
          className="rounded-b-lg border-x border-b overflow-auto"
          style={{
            maxHeight: '400px',
            backgroundColor: '#1c1917', // warm dark (stone-900)
            borderColor: '#44403c', // warm border (stone-700)
            borderTop: '1px solid #44403c',
          }}
        >
          {/* Panel header */}
          <div
            className="sticky top-0 px-4 py-2 border-b flex items-center justify-between"
            style={{
              backgroundColor: '#292524', // stone-800
              borderColor: '#44403c',
              zIndex: 1
            }}
          >
            <span style={{ fontFamily: MONO_FONT, fontSize: '10px', color: '#d6d3d1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Declarative Config
            </span>
            <span style={{
              fontFamily: MONO_FONT,
              fontSize: '9px',
              color: '#78716c',
              backgroundColor: '#1c1917',
              padding: '2px 6px',
              borderRadius: '3px',
            }}>
              YAML
            </span>
          </div>

          {/* Syntax highlighted YAML */}
          <div className="p-3">
            <pre
              style={{
                fontFamily: MONO_FONT,
                fontSize: '10px',
                lineHeight: '1.5',
                margin: 0,
              }}
            >
              <code>
                {highlightYAML(yamlString)}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Examples Page
// =============================================================================
export default function IsometricExamples() {
  const [selectedExample, setSelectedExample] = useState(0)
  const [showMarkup, setShowMarkup] = useState(false)

  const examples = [DESIGN_SYSTEM, DATA_PLATFORM, ENTERPRISE]
  const current = examples[selectedExample]

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 style={{ fontFamily: MONO_FONT, fontSize: '24px', fontWeight: 600, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            Isometric Examples
          </h1>
          <p style={{ fontFamily: MONO_FONT, fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            production-ready architecture visualizations
          </p>
        </div>

        {/* Selector */}
        <div className="flex justify-center gap-2 mb-6">
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => setSelectedExample(i)}
              style={{
                fontFamily: MONO_FONT,
                fontSize: '11px',
                fontWeight: 500,
                padding: '6px 14px',
                borderRadius: '6px',
                transition: 'all 0.15s',
                backgroundColor: selectedExample === i ? '#3b82f6' : '#1e293b',
                color: selectedExample === i ? '#fff' : '#94a3b8',
                border: `1px solid ${selectedExample === i ? '#3b82f6' : '#334155'}`
              }}
            >
              {ex.title}
            </button>
          ))}
        </div>

        {/* Diagram with slide-out drawer below */}
        <div className="flex justify-center">
          <div className="inline-block">
            <IsometricDiagram config={current} drawerOpen={showMarkup} />
            <MarkupViewer config={current} isOpen={showMarkup} onToggle={() => setShowMarkup(!showMarkup)} />
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { title: 'Rounded Corners', desc: 'Soft edges on isometric boxes' },
            { title: 'Tier System', desc: 'Clear visual layer separation' },
            { title: 'Declarative Config', desc: 'JSON markup for diagrams' },
          ].map((f, i) => (
            <div key={i} className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
              <div style={{ fontFamily: MONO_FONT, fontSize: '11px', fontWeight: 600, color: '#60a5fa', marginBottom: '4px' }}>
                {f.title}
              </div>
              <p style={{ fontFamily: MONO_FONT, fontSize: '10px', color: '#64748b' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <a href="/iso-demo" style={{ fontFamily: MONO_FONT, fontSize: '11px', color: '#475569' }}>
            ← interactive demo
          </a>
        </div>
      </div>
    </div>
  )
}
