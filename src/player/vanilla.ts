/**
 * Vanilla JS renderer for non-React environments
 * Renders diagram to static SVG string or DOM element
 */
import { isoToScreen, isoBox } from '../utils/isometric'
import type { DiagramConfig } from './types'

const MONO_FONT = '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace'

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

/**
 * Render diagram to SVG string (for SSR or static export)
 */
export function renderToString(config: DiagramConfig): string {
  const { theme, canvas, origin, tiers, floorSize, nodes, cornerRadius = 0 } = config
  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS
  const bgColor = theme === 'dark' ? '#0f172a' : '#fafafa'
  const textColor = theme === 'dark' ? '#e2e8f0' : '#1e293b'
  const labelColor = theme === 'dark' ? '#64748b' : '#94a3b8'

  // Sort nodes back-to-front
  const sortedNodes = [...nodes].sort((a, b) => {
    const aElev = tiers[a.tier]?.elevation || 0
    const bElev = tiers[b.tier]?.elevation || 0
    if (aElev !== bElev) return aElev - bElev
    return ((b.x + b.width) + (b.y + b.depth)) - ((a.x + a.width) + (a.y + a.depth))
  })

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" style="background:${bgColor}">`

  // Defs
  svg += `<defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="0.5" fill="${theme === 'dark' ? '#1e293b' : '#e2e8f0'}"/>
    </pattern>
  </defs>`

  svg += `<rect width="100%" height="100%" fill="url(#grid)" opacity="0.5"/>`
  svg += `<g transform="translate(${origin.x},${origin.y})">`

  // Render each tier
  for (let tierIndex = 0; tierIndex < tiers.length; tierIndex++) {
    const tier = tiers[tierIndex]
    const tierNodes = sortedNodes.filter(n => n.tier === tierIndex)

    // Floor
    const floorThickness = tierIndex === 0 ? 8 : 2
    const floorBox = isoBox(floorSize.width, floorSize.depth, floorThickness, 0, 0)
    const floorPos = isoToScreen(0, 0, tierIndex === 0 ? -2 : tier.elevation)
    const floorColor = tier.floorColor || (theme === 'dark' ? '#0f172a' : '#f8fafc')
    const floorOpacity = tier.floorOpacity || (tierIndex === 0 ? 0.95 : 0.5)

    svg += `<g transform="translate(${floorPos.screenX},${floorPos.screenY})">`
    if (tierIndex === 0) {
      svg += `<g transform="translate(4,4)" opacity="0.2"><path d="${floorBox.top}" fill="#000"/></g>`
    }
    svg += `<path d="${floorBox.top}" fill="${floorColor}" opacity="${floorOpacity}"/>`
    if (tierIndex === 0) {
      svg += `<path d="${floorBox.left}" fill="${theme === 'dark' ? '#0f172a' : '#cbd5e1'}" opacity="0.8"/>`
      svg += `<path d="${floorBox.right}" fill="${theme === 'dark' ? '#1e293b' : '#94a3b8'}" opacity="0.8"/>`
    }
    svg += `<path d="${floorBox.top}" fill="none" stroke="${tier.borderColor || (theme === 'dark' ? '#475569' : '#94a3b8')}" stroke-width="${tierIndex === 0 ? 1.5 : 0.75}" opacity="${tierIndex === 0 ? 1 : 0.6}"/>`
    svg += `</g>`

    // Nodes
    for (const node of tierNodes) {
      const nodeElevation = tier.elevation + 5
      const pos = isoToScreen(node.x, node.y, nodeElevation)
      const box = isoBox(node.width, node.depth, node.height, pos.screenX, pos.screenY, cornerRadius)
      const nodeColors = colors[node.color] || colors.slate
      const opacity = node.opacity ?? 1

      svg += `<g opacity="${opacity}">`

      // Corners
      if (box.cornerBackRight) {
        for (const seg of box.cornerBackRight) {
          svg += `<path d="${seg.path}" fill="${interpolateColor(nodeColors.front, nodeColors.side, seg.intensity)}"/>`
        }
      }
      if (box.cornerBackLeft) {
        for (const seg of box.cornerBackLeft) {
          svg += `<path d="${seg.path}" fill="${interpolateColor(nodeColors.side, nodeColors.front, seg.intensity)}"/>`
        }
      }

      // Faces
      svg += `<path d="${box.left}" fill="${nodeColors.side}"/>`
      svg += `<path d="${box.right}" fill="${nodeColors.front}"/>`

      if (box.cornerFrontRight) {
        for (const seg of box.cornerFrontRight) {
          svg += `<path d="${seg.path}" fill="${interpolateColor(nodeColors.front, nodeColors.side, seg.intensity)}"/>`
        }
      }
      if (box.cornerFrontLeft) {
        for (const seg of box.cornerFrontLeft) {
          svg += `<path d="${seg.path}" fill="${interpolateColor(nodeColors.front, nodeColors.side, seg.intensity)}"/>`
        }
      }

      svg += `<path d="${box.top}" fill="${nodeColors.top}"/>`
      svg += `<path d="${box.top}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" stroke-linejoin="round"/>`

      // Label
      if (node.label) {
        const labelPos = isoToScreen(node.x + node.width / 2, node.y + node.depth / 2, nodeElevation + node.height + 2)
        const fontSize = node.width > 70 ? 8 : 7
        svg += `<g transform="translate(${labelPos.screenX},${labelPos.screenY})">`
        svg += `<g transform="matrix(0.866,-0.5,0.866,0.5,0,0)">`
        svg += `<text x="0" y="0" text-anchor="middle" fill="${textColor}" font-size="${fontSize}" font-weight="500" font-family="${MONO_FONT}" style="text-transform:uppercase;letter-spacing:0.08em">${node.label}</text>`
        svg += `</g></g>`
      }

      svg += `</g>`
    }

    // Tier label
    const tierLabelPos = isoToScreen(-25, floorSize.depth / 2, tier.elevation + 15)
    svg += `<text x="${tierLabelPos.screenX - 35}" y="${tierLabelPos.screenY}" fill="${labelColor}" font-size="9" font-weight="500" font-family="${MONO_FONT}" opacity="0.6" style="letter-spacing:0.05em">${tier.name}</text>`
  }

  svg += `</g></svg>`
  return svg
}

/**
 * Render diagram to a DOM element
 */
export function renderToElement(container: HTMLElement, config: DiagramConfig): void {
  container.innerHTML = renderToString(config)
}
