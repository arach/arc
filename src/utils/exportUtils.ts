import { NODE_SIZES } from './constants'
import { resolveNodeDecor, resolveNodeShape, shapeCut, shapeFillPath } from './nodeShape'
import { getTheme, resolveNodeRadius, themeCanvas, type BrandSpec, type Theme, type ThemeId } from './themes'

// Helper: Calculate anchor position on a node
function getAnchorPosition(x: any, y: any, width: any, height: any, position: any) {
  switch (position) {
    case 'left':        return { x: x, y: y + height / 2 }
    case 'right':       return { x: x + width, y: y + height / 2 }
    case 'top':         return { x: x + width / 2, y: y }
    case 'bottom':      return { x: x + width / 2, y: y + height }
    case 'bottomRight': return { x: x + width, y: y + height - 15 }
    case 'bottomLeft':  return { x: x, y: y + height - 15 }
    case 'topRight':    return { x: x + width, y: y + 15 }
    case 'topLeft':     return { x: x, y: y + 15 }
    default:            return { x: x + width / 2, y: y + height / 2 }
  }
}

// Helper: Generate SVG path for connector
function getConnectorPath(from: any, to: any, fromAnchor: any, toAnchor: any) {
  // Simple curved path using bezier
  const dx = to.x - from.x
  const dy = to.y - from.y

  // Control point offset based on direction
  let cp1x = from.x
  let cp1y = from.y
  let cp2x = to.x
  let cp2y = to.y

  const offset = Math.min(Math.abs(dx), Math.abs(dy), 50)

  if (fromAnchor === 'right' || fromAnchor === 'bottomRight' || fromAnchor === 'topRight') {
    cp1x = from.x + offset
  } else if (fromAnchor === 'left' || fromAnchor === 'bottomLeft' || fromAnchor === 'topLeft') {
    cp1x = from.x - offset
  } else if (fromAnchor === 'bottom') {
    cp1y = from.y + offset
  } else if (fromAnchor === 'top') {
    cp1y = from.y - offset
  }

  if (toAnchor === 'left' || toAnchor === 'bottomLeft' || toAnchor === 'topLeft') {
    cp2x = to.x - offset
  } else if (toAnchor === 'right' || toAnchor === 'bottomRight' || toAnchor === 'topRight') {
    cp2x = to.x + offset
  } else if (toAnchor === 'top') {
    cp2y = to.y - offset
  } else if (toAnchor === 'bottom') {
    cp2y = to.y + offset
  }

  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`
}

// Node colors for SVG export
const nodeColors = {
  violet: { bg: '#8b5cf6', text: '#ffffff' },
  emerald: { bg: '#34d399', text: '#ffffff' },
  blue: { bg: '#60a5fa', text: '#ffffff' },
  amber: { bg: '#fbbf24', text: '#1f2937' },
  zinc: { bg: '#71717a', text: '#ffffff' },
  sky: { bg: '#38bdf8', text: '#ffffff' },
  rose: { bg: '#f43f5e', text: '#ffffff' },
  orange: { bg: '#f97316', text: '#ffffff' },
}

const groupColors = {
  violet: { fill: 'rgba(139, 92, 246, 0.1)', stroke: 'rgba(139, 92, 246, 0.5)' },
  emerald: { fill: 'rgba(52, 211, 153, 0.1)', stroke: 'rgba(52, 211, 153, 0.5)' },
  blue: { fill: 'rgba(96, 165, 250, 0.1)', stroke: 'rgba(96, 165, 250, 0.5)' },
  amber: { fill: 'rgba(251, 191, 36, 0.1)', stroke: 'rgba(251, 191, 36, 0.5)' },
  zinc: { fill: 'rgba(113, 113, 122, 0.1)', stroke: 'rgba(113, 113, 122, 0.5)' },
  sky: { fill: 'rgba(56, 189, 248, 0.1)', stroke: 'rgba(56, 189, 248, 0.5)' },
  rose: { fill: 'rgba(244, 63, 94, 0.1)', stroke: 'rgba(244, 63, 94, 0.5)' },
  orange: { fill: 'rgba(249, 115, 22, 0.1)', stroke: 'rgba(249, 115, 22, 0.5)' },
}

type ExportMode = 'light' | 'dark'

function classColor(className: string | undefined, fallback: string): string {
  const match = className?.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})/)
  if (match) return match[0]
  if (className?.includes('text-white')) return '#ffffff'
  if (className?.includes('text-zinc-700')) return '#334155'
  if (className?.includes('text-zinc-300')) return '#cbd5e1'
  return fallback
}

function hexWithAlpha(color: string, alpha: number): string {
  const hex = color.replace('#', '')
  if (hex.length !== 3 && hex.length !== 6) return color
  return `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
}

function svgGridPattern(gridType: string, color: string, size: number, x: number, y: number, w: number, h: number): string {
  if (gridType === 'none') return ''
  if (gridType === 'lines') {
    return `<defs><pattern id="grid" width="${size}" height="${size}" patternUnits="userSpaceOnUse"><path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${color}" stroke-width="1"/></pattern></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#grid)"/>`
  }
  if (gridType === 'crosshair') {
    return `<defs><pattern id="grid" width="${size}" height="${size}" patternUnits="userSpaceOnUse"><path d="M ${size / 2} ${size * 0.35} V ${size * 0.65} M ${size * 0.35} ${size / 2} H ${size * 0.65}" stroke="${color}" stroke-width="1"/></pattern></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#grid)"/>`
  }
  return `<defs><pattern id="grid" width="${size}" height="${size}" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="${color}"/></pattern></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#grid)"/>`
}

function svgFrame(frame: BrandSpec['frame'], x: number, y: number, w: number, h: number, color: string): string {
  const stroke = `stroke="${color}" stroke-width="1" fill="none"`
  if (!frame || frame === 'none') return ''
  if (frame === 'hairline' || frame === 'inset' || frame === 'sheet') {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${stroke}/>`
  }
  if (frame === 'brackets' || frame === 'corners') {
    const t = frame === 'brackets' ? 18 : 26
    return `<path d="M ${x} ${y + t} V ${y} H ${x + t} M ${x + w - t} ${y} H ${x + w} V ${y + t} M ${x + w} ${y + h - t} V ${y + h} H ${x + w - t} M ${x + t} ${y + h} H ${x} V ${y + h - t}" ${stroke}/>`
  }
  if (frame === 'ticks') {
    return `<path d="M ${x + w / 2} ${y} V ${y + 10} M ${x + w / 2} ${y + h} V ${y + h - 10} M ${x} ${y + h / 2} H ${x + 10} M ${x + w} ${y + h / 2} H ${x + w - 10}" ${stroke}/>`
  }
  if (frame === 'cropmarks') {
    const t = 14
    return `<path d="M ${x - 12} ${y} H ${x + t} M ${x} ${y - 12} V ${y + t} M ${x + w + 12} ${y} H ${x + w - t} M ${x + w} ${y - 12} V ${y + t} M ${x + w + 12} ${y + h} H ${x + w - t} M ${x + w} ${y + h + 12} V ${y + h - t} M ${x - 12} ${y + h} H ${x + t} M ${x} ${y + h + 12} V ${y + h - t}" ${stroke}/>`
  }
  if (frame === 'reticle') {
    const t = 18
    return `<path d="M ${x} ${y + t} V ${y} H ${x + t} M ${x + w - t} ${y} H ${x + w} V ${y + t} M ${x + w} ${y + h - t} V ${y + h} H ${x + w - t} M ${x + t} ${y + h} H ${x} V ${y + h - t} M ${x + w / 2 - 8} ${y + h / 2} H ${x + w / 2 + 8} M ${x + w / 2} ${y + h / 2 - 8} V ${y + h / 2 + 8}" ${stroke}/>`
  }
  return ''
}

function svgNodeDecor(decor: string, w: number, h: number, accent: string): string {
  if (decor === 'bar-left') return `<rect x="0" y="0" width="4" height="${h}" fill="${accent}"/>`
  if (decor === 'bar-top') return `<rect x="0" y="0" width="${w}" height="4" fill="${accent}"/>`
  if (decor === 'rule') return `<line x1="14" y1="${h - 10}" x2="${w - 14}" y2="${h - 10}" stroke="${accent}" stroke-width="1" opacity="0.45"/>`
  if (decor === 'dot') return `<circle cx="16" cy="16" r="3.5" fill="${accent}"/>`
  if (decor === 'ticks') {
    return `<path d="M 4 8 V 4 H 8 M ${w - 8} 4 H ${w - 4} V 8 M ${w - 4} ${h - 8} V ${h - 4} H ${w - 8} M 8 ${h - 4} H 4 V ${h - 8}" stroke="${accent}" stroke-width="1" fill="none" opacity="0.75"/>`
  }
  if (decor === 'stripe') {
    return `<path d="M ${w - 18} 6 L ${w - 6} 18 M ${w - 24} 6 L ${w - 6} 24" stroke="${accent}" stroke-width="1.5" opacity="0.45"/>`
  }
  return ''
}

function svgTitleBlock(theme: Theme | undefined, title: string, x: number, y: number, ink: string, muted: string, accent: string): string {
  if (!theme?.brand?.titleBlock) return ''
  const fontFamily = theme.brand.monoFamily || theme.brand.fontFamily || 'ui-monospace, monospace'
  return `<g><rect x="${x}" y="${y}" width="208" height="42" fill="none" stroke="${accent}" stroke-width="1"/><text x="${x + 12}" y="${y + 18}" font-family="${escapeXml(fontFamily)}" font-size="10" font-weight="600" letter-spacing="1.5" fill="${ink}">${escapeXml(title.toUpperCase())}</text><text x="${x + 12}" y="${y + 32}" font-family="${escapeXml(fontFamily)}" font-size="8" letter-spacing="1.2" fill="${muted}">ARC / MISSION PLATE</text></g>`
}

/**
 * Generate SVG string from diagram data
 */
export function generateSVG(diagram: any, options: any = {}) {
  const { padding = 20 } = options
  const theme = options.theme ? getTheme(options.theme as ThemeId) : undefined
  const mode = (options.mode ?? theme?.defaultMode ?? 'light') as ExportMode
  const themeColors = theme?.[mode]
  const brand = theme?.brand
  const fontFamily = brand?.fontFamily || 'ui-sans-serif, system-ui, sans-serif'
  const monoFamily = brand?.monoFamily || fontFamily
  const backgroundColor = options.backgroundColor ?? (theme ? themeCanvas(theme.id, mode) : '#ffffff')
  const ink = themeColors ? classColor(themeColors.text.primary, mode === 'dark' ? '#f4f4f5' : '#111827') : '#ffffff'
  const mutedInk = themeColors ? classColor(themeColors.text.secondary, mode === 'dark' ? '#a1a1aa' : '#475569') : '#ffffff'
  const accent = themeColors?.palette.zinc.stroke || '#71717a'
  const showGrid = options.includeGrid ?? Boolean(brand?.gridType && brand.gridType !== 'none')

  // Use export zone if defined, otherwise full layout
  const bounds = diagram.exportZone || {
    x: 0,
    y: 0,
    width: diagram.layout.width,
    height: diagram.layout.height,
  }

  const viewBox = `${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`
  const svgWidth = bounds.width + padding * 2
  const svgHeight = bounds.height + padding * 2

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="${viewBox}">\n`

  // Background
  svg += `  <rect x="${bounds.x - padding}" y="${bounds.y - padding}" width="${bounds.width + padding * 2}" height="${bounds.height + padding * 2}" fill="${backgroundColor}"/>\n`

  // Branded themes draw their grid by default; includeGrid can force or suppress it.
  if (showGrid && (themeColors || diagram.grid?.enabled)) {
    const gridSize = themeColors?.background.grid.size || diagram.grid?.size || 20
    const gridColor = themeColors?.background.grid.color || diagram.grid?.color || '#e5e7eb'
    const gridType = brand?.gridType || diagram.grid?.type || 'dots'
    svg += `  ${svgGridPattern(gridType, gridColor, gridSize, bounds.x - padding, bounds.y - padding, bounds.width + padding * 2, bounds.height + padding * 2)}\n`
  }

  // Groups (render first, behind everything)
  const groups = diagram.groups || []
  for (const group of groups) {
    const colors = groupColors[group.color] || groupColors.zinc
    const tone = themeColors?.palette[group.color]
    const groupFill = tone ? hexWithAlpha(tone.stroke, 0.08) : colors.fill
    const groupStroke = tone?.stroke || colors.stroke
    if (group.type === 'circle') {
      svg += `  <ellipse cx="${group.x + group.width / 2}" cy="${group.y + group.height / 2}" rx="${group.width / 2}" ry="${group.height / 2}" fill="${groupFill}" stroke="${groupStroke}" stroke-width="1.5"${group.dashed ? ' stroke-dasharray="8 4"' : ''}/>\n`
    } else {
      svg += `  <rect x="${group.x}" y="${group.y}" width="${group.width}" height="${group.height}" rx="12" fill="${groupFill}" stroke="${groupStroke}" stroke-width="1.5"${group.dashed ? ' stroke-dasharray="8 4"' : ''}/>\n`
    }
    if (group.label) {
      const label = brand?.upperLabels ? group.label.toUpperCase() : group.label
      svg += `  <text x="${group.x + 12}" y="${group.y + 20}" fill="${groupStroke}" font-size="12" font-weight="500" font-family="${escapeXml(monoFamily)}"${brand?.upperLabels ? ' letter-spacing="1"' : ''}>${escapeXml(label)}</text>\n`
    }
  }

  // Images
  const images = diagram.images || []
  for (const image of images) {
    svg += `  <image href="${image.src}" x="${image.x}" y="${image.y}" width="${image.width}" height="${image.height}" opacity="${image.opacity ?? 1}" preserveAspectRatio="xMidYMid meet"/>\n`
  }

  // Connectors
  for (const connector of diagram.connectors) {
    const fromNode = diagram.nodes[connector.from]
    const toNode = diagram.nodes[connector.to]
    if (!fromNode || !toNode) continue

    const fromSize = NODE_SIZES[fromNode.size] || NODE_SIZES.m
    const toSize = NODE_SIZES[toNode.size] || NODE_SIZES.m

    const style = diagram.connectorStyles?.[connector.style] || { color: 'zinc', strokeWidth: 2 }
    const strokeColor = themeColors?.palette[style.color]?.stroke || nodeColors[style.color]?.bg || accent

    const fromPos = getAnchorPosition(
      fromNode.x,
      fromNode.y,
      fromNode.width || fromSize.width,
      fromNode.height || fromSize.height,
      connector.fromAnchor
    )
    const toPos = getAnchorPosition(
      toNode.x,
      toNode.y,
      toNode.width || toSize.width,
      toNode.height || toSize.height,
      connector.toAnchor
    )

    const path = getConnectorPath(fromPos, toPos, connector.fromAnchor, connector.toAnchor)
    const strokeWidth = style.strokeWidth || 2

    if (brand?.connectorGlow) {
      svg += `  <path d="${path}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth + 4}" opacity="0.16"/>\n`
    }
    svg += `  <path d="${path}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"${style.dashed ? ' stroke-dasharray="6 3"' : ''}/>\n`

    // Arrow head
    const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x) * 180 / Math.PI
    if (themeColors) {
      if (brand?.arrowhead === 'chevron') {
        svg += `  <path d="M -1 -5 L 7 0 L -1 5" fill="none" stroke="${strokeColor}" stroke-width="1.5" transform="translate(${toPos.x} ${toPos.y}) rotate(${angle})"/>\n`
      } else {
        svg += `  <polygon points="-1,-4 7,0 -1,4" fill="${strokeColor}" transform="translate(${toPos.x} ${toPos.y}) rotate(${angle})"/>\n`
      }
    } else {
      svg += `  <circle cx="${toPos.x}" cy="${toPos.y}" r="4" fill="${strokeColor}"/>\n`
    }

    // Label
    if (style.label) {
      const midX = (fromPos.x + toPos.x) / 2
      const midY = (fromPos.y + toPos.y) / 2
      const label = brand?.upperLabels ? style.label.toUpperCase() : style.label
      svg += `  <text x="${midX}" y="${midY - 8}" text-anchor="middle" fill="${strokeColor}" font-size="10" font-family="${escapeXml(monoFamily)}"${brand?.upperLabels ? ' letter-spacing="1"' : ''}>${escapeXml(label)}</text>\n`
    }
  }

  // Nodes
  for (const [nodeId, node] of Object.entries(diagram.nodes as Record<string, any>)) {
    const data = diagram.nodeData[nodeId]
    if (!data) continue

    const size = NODE_SIZES[node.size] || NODE_SIZES.m
    const width = node.width || size.width
    const height = node.height || size.height
    const colors = nodeColors[data.color] || nodeColors.zinc
    const tone = themeColors?.palette[data.color]
    const nodeAccent = tone?.stroke || colors.bg
    const nodeFill = themeColors
      ? hexWithAlpha(nodeAccent, brand?.nodeGlass ? 0.10 : mode === 'dark' ? 0.12 : 0.08)
      : colors.bg
    const nodeText = themeColors ? ink : colors.text
    const nodeRadius = resolveNodeRadius(brand)
    const shape = resolveNodeShape(data.shape || brand?.nodeShape, nodeRadius)
    const cut = shapeCut(node.size)
    const shapePath = shapeFillPath(shape, width, height, cut)
    const decor = resolveNodeDecor(data.decor || brand?.nodeDecor, brand?.accentBar)
    const nodeOpacity = brand?.nodeOpacity ?? 1
    const borderWidth = parseFloat(brand?.nodeBorderWidth || '') || 1

    svg += `  <g opacity="${nodeOpacity}">\n`
    if (shapePath) {
      svg += `    <path d="${shapePath}" transform="translate(${node.x} ${node.y})" fill="${nodeFill}"${themeColors ? ` stroke="${nodeAccent}" stroke-width="${borderWidth}" stroke-opacity="0.75"` : ''}/>\n`
    } else {
      const rx = nodeRadius ? parseFloat(nodeRadius) : 12
      svg += `    <rect x="${node.x}" y="${node.y}" width="${width}" height="${height}" rx="${rx}" fill="${nodeFill}"${themeColors ? ` stroke="${nodeAccent}" stroke-width="${borderWidth}" stroke-opacity="0.75"` : ''}/>\n`
    }
    if (decor !== 'none') {
      svg += `    <g transform="translate(${node.x} ${node.y})">${svgNodeDecor(decor, width, height, nodeAccent)}</g>\n`
    }

    // Node name
    const fontSize = node.size === 'xs' ? 10 : node.size === 's' ? 11 : 13
    svg += `    <text x="${node.x + width / 2}" y="${node.y + height / 2 + fontSize / 3}" text-anchor="middle" fill="${nodeText}" font-size="${fontSize}" font-weight="600" font-family="${escapeXml(fontFamily)}">${escapeXml(data.name || 'Node')}</text>\n`

    // Subtitle (if space allows)
    if (data.subtitle && height >= 60) {
      const subtitle = brand?.upperLabels ? data.subtitle.toUpperCase() : data.subtitle
      svg += `    <text x="${node.x + width / 2}" y="${node.y + height / 2 + fontSize + 8}" text-anchor="middle" fill="${themeColors ? mutedInk : colors.text}" opacity="0.8" font-size="${fontSize - 2}" font-family="${escapeXml(brand?.upperLabels ? monoFamily : fontFamily)}"${brand?.upperLabels ? ' letter-spacing="0.8"' : ''}>${escapeXml(subtitle)}</text>\n`
    }
    svg += `  </g>\n`
  }

  if (themeColors && brand?.frame && brand.frame !== 'none') {
    const frameX = bounds.x - padding + 8
    const frameY = bounds.y - padding + 8
    svg += `  ${svgFrame(brand.frame, frameX, frameY, bounds.width + padding * 2 - 16, bounds.height + padding * 2 - 16, accent)}\n`
  }

  if (themeColors && brand?.titleBlock) {
    svg += `  ${svgTitleBlock(theme, diagram.id || 'diagram', bounds.x + bounds.width - 216, bounds.y + bounds.height - 50, ink, mutedInk, accent)}\n`
  }

  svg += `</svg>`
  return svg
}

/**
 * Generate PNG from diagram using canvas
 */
export async function generatePNG(diagram: any, options: any = {}) {
  const { scale = 2 } = options

  // Generate SVG first
  const svgString = generateSVG(diagram, options)

  // Create blob and image
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale

      const ctx = canvas.getContext('2d')
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)

      URL.revokeObjectURL(svgUrl)

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to generate PNG'))
        }
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl)
      reject(new Error('Failed to load SVG'))
    }
    img.src = svgUrl
  })
}

/**
 * Create a shareable data URL for the diagram
 */
export function createShareableLink(diagram: any) {
  // Compress diagram to minimal JSON
  const minimalDiagram = {
    l: diagram.layout,
    n: diagram.nodes,
    d: diagram.nodeData,
    c: diagram.connectors,
    s: diagram.connectorStyles,
    g: diagram.groups,
    i: diagram.images,
    e: diagram.exportZone,
  }

  const json = JSON.stringify(minimalDiagram)
  const encoded = btoa(encodeURIComponent(json))

  // For now, return a hash-based URL (works with client-side routing)
  // In production, this could be a proper backend URL
  const baseUrl = window.location.origin + window.location.pathname
  return `${baseUrl}#/view/${encoded}`
}

/**
 * Decode a shareable link back to diagram data
 */
export function decodeShareableLink(encoded: any) {
  try {
    const json = decodeURIComponent(atob(encoded))
    const data = JSON.parse(json)
    return {
      layout: data.l,
      nodes: data.n,
      nodeData: data.d,
      connectors: data.c,
      connectorStyles: data.s,
      groups: data.g || [],
      images: data.i || [],
      exportZone: data.e || null,
    }
  } catch (e) {
    console.error('Failed to decode shareable link:', e)
    return null
  }
}

/**
 * Download a file
 */
export function downloadFile(content, filename, type: any) {
  const blob = content instanceof Blob ? content : new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Generate TypeScript source file for ArcDiagram component
 */
export function generateTypeScript(diagram: any) {
  // Use export zone for bounds, or full layout
  const bounds = diagram.exportZone || {
    x: 0,
    y: 0,
    width: diagram.layout.width,
    height: diagram.layout.height,
  }

  // Filter nodes to those within bounds (with some margin)
  const margin = 50
  const visibleNodes = {}
  const visibleNodeData = {}

  for (const [id, node] of Object.entries(diagram.nodes as Record<string, any>)) {
    const data = diagram.nodeData[id]
    if (!data) continue

    const size = NODE_SIZES[node.size] || NODE_SIZES.m
    const nodeRight = node.x + (node.width || size.width)
    const nodeBottom = node.y + (node.height || size.height)

    // Check if node overlaps with bounds
    if (node.x < bounds.x + bounds.width + margin &&
        nodeRight > bounds.x - margin &&
        node.y < bounds.y + bounds.height + margin &&
        nodeBottom > bounds.y - margin) {
      // Adjust position relative to bounds
      visibleNodes[id] = {
        x: node.x - bounds.x,
        y: node.y - bounds.y,
        size: node.size || 'm',
      }
      visibleNodeData[id] = {
        icon: data.icon || 'Box',
        name: data.name || 'Node',
        ...(data.subtitle && { subtitle: data.subtitle }),
        ...(data.description && { description: data.description }),
        color: data.color || 'zinc',
      }
    }
  }

  // Filter connectors to those between visible nodes
  const visibleConnectors = diagram.connectors.filter(
    c => visibleNodes[c.from] && visibleNodes[c.to]
  ).map(c => ({
    from: c.from,
    to: c.to,
    fromAnchor: c.fromAnchor,
    toAnchor: c.toAnchor,
    style: c.style,
    ...(c.curve && { curve: c.curve }),
  }))

  // Get used connector styles
  const usedStyles = new Set(visibleConnectors.map((c: any) => c.style))
  const visibleConnectorStyles: Record<string, any> = {}
  for (const styleName of usedStyles) {
    const style = diagram.connectorStyles?.[styleName as string]
    if (style) {
      visibleConnectorStyles[styleName as string] = {
        color: style.color || 'zinc',
        strokeWidth: style.strokeWidth || 2,
        ...(style.label && { label: style.label }),
        ...(style.dashed && { dashed: true }),
      }
    }
  }

  // Build the data object
  const data = {
    layout: { width: bounds.width, height: bounds.height },
    nodes: visibleNodes,
    nodeData: visibleNodeData,
    connectors: visibleConnectors,
    connectorStyles: visibleConnectorStyles,
  }

  // Format as clean TypeScript
  return `import type { ArcDiagramData } from '@arach/arc'

const diagram: ArcDiagramData = ${formatAsTS(data)}

export default diagram
`
}

/**
 * Format object as clean TypeScript (single quotes, unquoted keys)
 */
function formatAsTS(obj, indent = 0) {
  const spaces = '  '.repeat(indent)
  const innerSpaces = '  '.repeat(indent + 1)

  if (obj === null || obj === undefined) {
    return 'null'
  }

  if (typeof obj === 'string') {
    return `'${obj.replace(/'/g, "\\'")}'`
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj)
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    const items = obj.map(item => `${innerSpaces}${formatAsTS(item, indent + 1)}`).join(',\n')
    return `[\n${items},\n${spaces}]`
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj)
    if (entries.length === 0) return '{}'

    // Check if it's a simple object that can be on one line
    const isSimple = entries.every(([, v]) =>
      typeof v !== 'object' || v === null
    ) && JSON.stringify(obj).length < 80

    if (isSimple && indent > 0) {
      const pairs = entries.map(([k, v]) => `${k}: ${formatAsTS(v, indent + 1)}`).join(', ')
      return `{ ${pairs} }`
    }

    const pairs = entries.map(([k, v]) => {
      // Use unquoted key if valid identifier
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `'${k}'`
      return `${innerSpaces}${key}: ${formatAsTS(v, indent + 1)}`
    }).join(',\n')

    return `{\n${pairs},\n${spaces}}`
  }

  return String(obj)
}
