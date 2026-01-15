/**
 * ArcDiagram - Lightweight isometric diagram renderer
 * This is the core player component, optimized for embedding.
 */
import React, { useState, useEffect } from 'react'
import { isoToScreen, isoBox } from '../utils/isometric'
import type { DiagramConfig, PlayerOptions } from './types'

// Typography
const MONO_FONT = '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace'

// Color palettes
const DARK_COLORS: Record<string, { top: string; side: string; front: string }> = {
  blue: { top: '#3b82f6', side: '#2563eb', front: '#1d4ed8' },
  violet: { top: '#8b5cf6', side: '#7c3aed', front: '#6d28d9' },
  cyan: { top: '#06b6d4', side: '#0891b2', front: '#0e7490' },
  emerald: { top: '#10b981', side: '#059669', front: '#047857' },
  amber: { top: '#f59e0b', side: '#d97706', front: '#b45309' },
  rose: { top: '#f43f5e', side: '#e11d48', front: '#be123c' },
  slate: { top: '#475569', side: '#334155', front: '#1e293b' },
}

const LIGHT_COLORS: Record<string, { top: string; side: string; front: string }> = {
  blue: { top: '#93c5fd', side: '#60a5fa', front: '#3b82f6' },
  violet: { top: '#c4b5fd', side: '#a78bfa', front: '#8b5cf6' },
  cyan: { top: '#67e8f9', side: '#22d3ee', front: '#06b6d4' },
  emerald: { top: '#6ee7b7', side: '#34d399', front: '#10b981' },
  amber: { top: '#fcd34d', side: '#fbbf24', front: '#f59e0b' },
  rose: { top: '#fda4af', side: '#fb7185', front: '#f43f5e' },
  slate: { top: '#e2e8f0', side: '#cbd5e1', front: '#94a3b8' },
}

// Interpolate colors for rounded corner shading
function interpolateColor(darkColor: string, lightColor: string, intensity: number): string {
  const parseHex = (hex: string) => {
    const h = hex.replace('#', '')
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    }
  }
  const dark = parseHex(darkColor)
  const light = parseHex(lightColor)
  const r = Math.round(dark.r + (light.r - dark.r) * intensity)
  const g = Math.round(dark.g + (light.g - dark.g) * intensity)
  const b = Math.round(dark.b + (light.b - dark.b) * intensity)
  return `rgb(${r},${g},${b})`
}

// Isometric text on top face
function IsoText({ x, y, z, children, fontSize = 8, color = '#1e293b' }: {
  x: number; y: number; z: number; children: string; fontSize?: number; color?: string
}) {
  const pos = isoToScreen(x, y, z)
  return (
    <g transform={`translate(${pos.screenX}, ${pos.screenY})`}>
      <g transform="matrix(0.866, -0.5, 0.866, 0.5, 0, 0)">
        <text x={0} y={0} textAnchor="middle" fill={color} fontSize={fontSize}
          fontWeight={500} fontFamily={MONO_FONT}
          style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {children}
        </text>
      </g>
    </g>
  )
}

// Floor plane
function FloorPlane({ width, depth, elevation, color, opacity, borderColor, theme, isGround }: {
  width: number; depth: number; elevation: number; color: string; opacity: number;
  borderColor?: string; theme: 'dark' | 'light'; isGround?: boolean
}) {
  const thickness = isGround ? 8 : 2
  const box = isoBox(width, depth, thickness, 0, 0)
  const pos = isoToScreen(0, 0, elevation)

  return (
    <g transform={`translate(${pos.screenX}, ${pos.screenY})`}>
      {isGround && (
        <g transform="translate(4, 4)" opacity={0.2}>
          <path d={box.top} fill="#000" />
        </g>
      )}
      <path d={box.top} fill={color} opacity={opacity} />
      {isGround && (
        <>
          <path d={box.left} fill={theme === 'dark' ? '#0f172a' : '#cbd5e1'} opacity={0.8} />
          <path d={box.right} fill={theme === 'dark' ? '#1e293b' : '#94a3b8'} opacity={0.8} />
        </>
      )}
      <path d={box.top} fill="none"
        stroke={borderColor || (theme === 'dark' ? '#475569' : '#94a3b8')}
        strokeWidth={isGround ? 1.5 : 0.75} opacity={isGround ? 1 : 0.6} />
    </g>
  )
}

export interface ArcDiagramProps {
  config: DiagramConfig
  options?: PlayerOptions
  className?: string
  style?: React.CSSProperties
}

export default function ArcDiagram({ config, options = {}, className, style }: ArcDiagramProps) {
  const { interactive = true, animate = true, showLabels = true } = options
  const { theme, canvas, origin, tiers, floorSize, nodes, cornerRadius = 0 } = config

  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS
  const bgColor = theme === 'dark' ? '#0f172a' : '#fafafa'
  const textColor = theme === 'dark' ? '#e2e8f0' : '#1e293b'
  const labelColor = theme === 'dark' ? '#64748b' : '#94a3b8'

  // Entrance animation
  const [animatedTiers, setAnimatedTiers] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (animate) {
      setAnimatedTiers(new Set())
      tiers.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedTiers(prev => new Set([...prev, index]))
        }, index * 150 + 100)
      })
    } else {
      setAnimatedTiers(new Set(tiers.map((_, i) => i)))
    }
  }, [config.id, animate, tiers.length])

  // Hover state
  const [hoveredTier, setHoveredTier] = useState<number | null>(null)

  // Sort nodes back-to-front (painter's algorithm)
  const sortedNodes = [...nodes].sort((a, b) => {
    const aElev = tiers[a.tier]?.elevation || 0
    const bElev = tiers[b.tier]?.elevation || 0
    if (aElev !== bElev) return aElev - bElev
    const aDepth = (a.x + a.width) + (a.y + a.depth)
    const bDepth = (b.x + b.width) + (b.y + b.depth)
    return bDepth - aDepth
  })

  return (
    <div className={className} style={{ display: 'inline-block', ...style }}>
      <svg width={canvas.width} height={canvas.height} style={{ backgroundColor: bgColor }}>
        <defs>
          <pattern id={`grid-${config.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.5" fill={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
          </pattern>
          <filter id={`glow-${config.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8"
              floodColor={theme === 'dark' ? '#60a5fa' : '#3b82f6'} floodOpacity="0.3" />
          </filter>
        </defs>

        <rect width="100%" height="100%" fill={`url(#grid-${config.id})`} opacity="0.5" />

        <g transform={`translate(${origin.x}, ${origin.y})`}>
          {tiers.map((tier, tierIndex) => {
            const tierNodes = sortedNodes.filter(n => n.tier === tierIndex)
            const hasEntered = animatedTiers.has(tierIndex)
            const isHovered = interactive && hoveredTier === tierIndex

            const entranceOffset = hasEntered ? 0 : 60
            const entranceOpacity = hasEntered ? 1 : 0
            const hoverScale = isHovered ? 1.02 : 1
            const dimmed = interactive && hoveredTier !== null && !isHovered

            const floorCenter = isoToScreen(floorSize.width / 2, floorSize.depth / 2, tier.elevation)

            return (
              <g key={tierIndex}
                onMouseEnter={() => interactive && setHoveredTier(tierIndex)}
                onMouseLeave={() => interactive && setHoveredTier(null)}
                style={{
                  transform: `translate(${floorCenter.screenX}px, ${floorCenter.screenY + entranceOffset}px) scale(${hoverScale}) translate(${-floorCenter.screenX}px, ${-floorCenter.screenY}px)`,
                  transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out',
                  opacity: entranceOpacity * (dimmed ? 0.5 : 1),
                  filter: isHovered ? `url(#glow-${config.id})` : 'none',
                  cursor: interactive ? 'pointer' : 'default',
                }}>

                {/* Floor */}
                <FloorPlane
                  width={floorSize.width} depth={floorSize.depth}
                  elevation={tierIndex === 0 ? -2 : tier.elevation}
                  color={tier.floorColor || (theme === 'dark' ? '#0f172a' : '#f8fafc')}
                  opacity={tier.floorOpacity || (tierIndex === 0 ? 0.95 : 0.5)}
                  borderColor={tier.borderColor} theme={theme} isGround={tierIndex === 0}
                />

                {/* Nodes */}
                {tierNodes.map((node, i) => {
                  const nodeElevation = tier.elevation + 5
                  const pos = isoToScreen(node.x, node.y, nodeElevation)
                  const box = isoBox(node.width, node.depth, node.height, pos.screenX, pos.screenY, cornerRadius)
                  const nodeColors = colors[node.color] || colors.slate

                  return (
                    <g key={i} opacity={node.opacity ?? 1}>
                      {/* Corners and faces */}
                      {box.cornerBackRight?.map((seg: { path: string; intensity: number }, idx: number) => (
                        <path key={`cbr-${idx}`} d={seg.path}
                          fill={interpolateColor(nodeColors.front, nodeColors.side, seg.intensity)} />
                      ))}
                      {box.cornerBackLeft?.map((seg: { path: string; intensity: number }, idx: number) => (
                        <path key={`cbl-${idx}`} d={seg.path}
                          fill={interpolateColor(nodeColors.side, nodeColors.front, seg.intensity)} />
                      ))}
                      <path d={box.left} fill={nodeColors.side} />
                      <path d={box.right} fill={nodeColors.front} />
                      {box.cornerFrontRight?.map((seg: { path: string; intensity: number }, idx: number) => (
                        <path key={`cfr-${idx}`} d={seg.path}
                          fill={interpolateColor(nodeColors.front, nodeColors.side, seg.intensity)} />
                      ))}
                      {box.cornerFrontLeft?.map((seg: { path: string; intensity: number }, idx: number) => (
                        <path key={`cfl-${idx}`} d={seg.path}
                          fill={interpolateColor(nodeColors.front, nodeColors.side, seg.intensity)} />
                      ))}
                      <path d={box.top} fill={nodeColors.top} />
                      <path d={box.top} fill="none" stroke="rgba(255,255,255,0.15)"
                        strokeWidth="0.5" strokeLinejoin="round" />

                      {/* Label */}
                      {showLabels && node.label && (
                        <IsoText x={node.x + node.width / 2} y={node.y + node.depth / 2}
                          z={nodeElevation + node.height + 2}
                          fontSize={node.width > 70 ? 8 : 7} color={textColor}>
                          {node.label}
                        </IsoText>
                      )}
                    </g>
                  )
                })}

                {/* Tier label */}
                {showLabels && (
                  <text
                    x={isoToScreen(-25, floorSize.depth / 2, tier.elevation + 15).screenX - 35}
                    y={isoToScreen(-25, floorSize.depth / 2, tier.elevation + 15).screenY}
                    fill={labelColor} fontSize={9} fontWeight={500} fontFamily={MONO_FONT}
                    opacity={0.6} style={{ letterSpacing: '0.05em' }}>
                    {tier.name}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
