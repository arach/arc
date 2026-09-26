import type { ArcDiagramData, DiagramFlow } from '../types/diagram'
import type { Theme } from './themes'
import {
  flowAnimationEnd,
  flowPointAtDistance,
  flowPositionAt,
  flowTrailPositionsAt,
  resolveDiagramFlow,
  type FlowPosition,
  type ResolvedFlow,
} from './flowAnimation'

export interface FlowSvgOptions {
  /** Canvas theme palette; resolves authored palette colors to rendered ink. */
  themeColors?: Theme['light'] | Theme['dark'] | null
  /** Font family for flow captions. */
  fontFamily?: string
  /** Render a deterministic still at this route time instead of SMIL. */
  flowTime?: number
  /** Set false to omit SMIL and render the flow at `flowTime ?? 0`. */
  animate?: boolean
}

type FlowColorName = NonNullable<DiagramFlow['color']>

const fallbackFlowColors: Record<FlowColorName, string> = {
  violet: '#a78bfa',
  emerald: '#34d399',
  blue: '#60a5fa',
  amber: '#fbbf24',
  sky: '#38bdf8',
  zinc: '#71717a',
  rose: '#f43f5e',
  orange: '#f97316',
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function seconds(value: number): string {
  return `${Math.max(0, Math.round(value * 1000) / 1000)}s`
}

function keyNumber(value: number): string {
  return String(Math.max(0, Math.min(1, Math.round(value * 10000) / 10000)))
}

function easingSpline(easing: ResolvedFlow['easing']): string {
  switch (easing) {
    case 'ease-in': return '0.42 0 1 1'
    case 'ease-out': return '0 0 0.58 1'
    case 'ease-in-out': return '0.42 0 0.58 1'
    default: return '0 0 1 1'
  }
}

function markerMarkup(marker: ResolvedFlow['marker'], size: number, color: string, pulsePhase = 0): string {
  const r = size / 2
  if (marker === 'packet') {
    const w = size * 1.45
    const h = size * 0.86
    return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${size * 0.22}" fill="${color}"/><rect x="${-w * 0.22}" y="${-h * 0.28}" width="${w * 0.44}" height="${h * 0.56}" rx="${size * 0.08}" fill="#ffffff" opacity="0.35"/>`
  }
  if (marker === 'arrow') {
    return `<path d="M ${size * 0.72} 0 L ${-size * 0.52} ${-size * 0.4} L ${-size * 0.28} 0 L ${-size * 0.52} ${size * 0.4} Z" fill="${color}"/>`
  }
  if (marker === 'pulse') {
    const phase = ((pulsePhase % 1) + 1) % 1
    const ring = r + size * 0.8 * phase
    return `<circle r="${ring}" fill="none" stroke="${color}" stroke-width="${Math.max(1, size * 0.12)}" opacity="${(0.55 * (1 - phase)).toFixed(3)}"/><circle r="${r * 0.72}" fill="${color}"/>`
  }
  return `<circle r="${r * 1.45}" fill="${color}" opacity="0.16"/><circle r="${r}" fill="${color}"/>`
}

function repeatCount(flow: ResolvedFlow): string {
  return flow.repeat === 'indefinite' ? 'indefinite' : String(flow.repeat)
}

function motionKeys(flow: ResolvedFlow): { keyTimes: string; keyPoints: string; keySplines: string } {
  const times = [0]
  const points = [0]
  const splines: string[] = []
  for (const span of flow.intervals) {
    times.push(span.end / flow.cycleDuration)
    points.push(span.toDistance / flow.routeLength)
    splines.push(easingSpline(span.easing))
  }
  if (flow.hold > 0) {
    times.push(1)
    points.push(1)
    splines.push('0 0 1 1')
  } else {
    times[times.length - 1] = 1
  }
  return {
    keyTimes: times.map(keyNumber).join(';'),
    keyPoints: points.map(keyNumber).join(';'),
    keySplines: splines.join(';'),
  }
}

function shiftedKeyPoints(flow: ResolvedFlow, offset: number): string {
  return motionKeys(flow)
    .keyPoints
    .split(';')
    .map(value => keyNumber(Number(value) - offset))
    .join(';')
}

function visibilityGate(flow: ResolvedFlow): string {
  const visibleEnd = keyNumber(flow.duration / flow.cycleDuration)
  const fadeInEnd = keyNumber(Math.min(0.015, flow.duration / flow.cycleDuration))
  return `<animate attributeName="opacity" calcMode="discrete" values="0;1;0" keyTimes="0;${fadeInEnd};${visibleEnd}" dur="${seconds(flow.cycleDuration)}" begin="${seconds(flow.delay)}" repeatCount="${repeatCount(flow)}"/>`
}

function animatedMarker(
  flow: ResolvedFlow,
  color: string,
  marker: ResolvedFlow['marker'],
  size: number,
  opacity: number,
  distanceOffset = 0,
): string {
  const keys = motionKeys(flow)
  const keyPoints = distanceOffset > 0 ? shiftedKeyPoints(flow, distanceOffset / flow.routeLength) : keys.keyPoints
  const rotate = marker === 'arrow' || marker === 'packet' ? 'auto' : '0'
  const pulse = marker === 'pulse'
    ? `<animate attributeName="opacity" values="1;0.35;1" dur="0.8s" begin="${seconds(flow.delay)}" repeatCount="indefinite"/>`
    : ''
  return `<g>${visibilityGate(flow)}<g opacity="${opacity}"><g><animateMotion dur="${seconds(flow.cycleDuration)}" begin="${seconds(flow.delay)}" repeatCount="${repeatCount(flow)}" rotate="${rotate}" calcMode="spline" keyPoints="${keyPoints}" keyTimes="${keys.keyTimes}" keySplines="${keys.keySplines}" path="${escapeXml(flow.routePath)}"/>${markerMarkup(marker, size, color)}${pulse}</g></g></g>`
}

function trailSpacing(flow: ResolvedFlow): number {
  return flow.trail === 'wake' ? Math.max(10, flow.size * 1.15) : Math.max(18, flow.size * 2.2)
}

function flowLabel(flow: ResolvedFlow, color: string, fontFamily: string): string {
  if (!flow.flow.label) return ''
  const firstLeg = flow.legs[0]
  if (!firstLeg) return ''
  const point = flowPointAtDistance(flow, firstLeg.routeStart + (firstLeg.routeEnd - firstLeg.routeStart) / 2)
  if (!point) return ''
  const radians = (point.angle * Math.PI) / 180
  const nx = Math.sin(radians)
  const ny = -Math.cos(radians)
  const x = point.x + nx * 14
  const y = point.y + ny * 14
  return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" text-anchor="middle" fill="${color}" opacity="0.72" font-size="8.5" font-family="${escapeXml(fontFamily)}" letter-spacing="0.8">${escapeXml(flow.flow.label)}</text>`
}

function wakePath(flow: ResolvedFlow, color: string): string {
  if (flow.trail !== 'wake') return ''
  const keys = motionKeys(flow)
  const wake = Math.min(0.28, Math.max(0.08, (flow.size * 4) / flow.routeLength))
  const values = keys.keyPoints.split(';').map(point => keyNumber(wake - Number(point))).join(';')
  return `<path d="${escapeXml(flow.routePath)}" pathLength="1" fill="none" stroke="${color}" stroke-width="${Math.max(1.5, flow.size * 0.38)}" stroke-linecap="round" stroke-opacity="0.18" stroke-dasharray="${wake} 1"><animate attributeName="stroke-dashoffset" dur="${seconds(flow.cycleDuration)}" begin="${seconds(flow.delay)}" repeatCount="${repeatCount(flow)}" calcMode="linear" values="${values}" keyTimes="${keys.keyTimes}"/></path>`
}

function animatedFlow(flow: ResolvedFlow, data: ArcDiagramData, options: FlowSvgOptions): string {
  const color = resolveFlowColor(flow, data, options.themeColors)
  const ghosts = flow.trail === 'wake' ? 4 : flow.trail === 'fade' ? 2 : 0
  const spacing = trailSpacing(flow)
  let out = `<g data-arc-flow="${escapeXml(flow.flow.id)}" pointer-events="none">${wakePath(flow, color)}`
  for (let i = ghosts; i >= 1; i--) {
    const opacity = flow.trail === 'wake' ? 0.08 + (ghosts - i) * 0.055 : 0.1 + (ghosts - i) * 0.18
    out += animatedMarker(flow, color, flow.marker, Math.max(1, flow.size * (1 - i * 0.12)), opacity, spacing * i)
  }
  out += animatedMarker(flow, color, flow.marker, flow.size, 0.95)
  out += `${flowLabel(flow, color, options.fontFamily ?? 'ui-sans-serif, system-ui, sans-serif')}</g>`
  return out
}

function staticMarkerAt(position: FlowPosition, flow: ResolvedFlow, color: string, size: number, opacity: number, pulsePhase = 0): string {
  const rotate = flow.marker === 'arrow' || flow.marker === 'packet' ? ` rotate(${position.angle.toFixed(2)})` : ''
  return `<g transform="translate(${position.x.toFixed(2)} ${position.y.toFixed(2)})${rotate}" opacity="${opacity}">${markerMarkup(flow.marker, size, color, pulsePhase)}</g>`
}

function staticFlow(flow: ResolvedFlow, data: ArcDiagramData, options: FlowSvgOptions): string {
  const time = options.flowTime ?? 0
  const position = flowPositionAt(flow, time)
  const color = resolveFlowColor(flow, data, options.themeColors)
  let out = `<g data-arc-flow="${escapeXml(flow.flow.id)}" pointer-events="none">`
  if (position) {
    const ghosts = flow.trail === 'wake' ? 4 : flow.trail === 'fade' ? 2 : 0
    const spacing = trailSpacing(flow)
    const ghostPositions = flowTrailPositionsAt(flow, time, spacing, ghosts)
    for (let i = ghostPositions.length - 1; i >= 0; i--) {
      const distance = i + 1
      const opacity = flow.trail === 'wake' ? 0.08 + (ghostPositions.length - distance) * 0.055 : 0.1 + (ghostPositions.length - distance) * 0.18
      out += staticMarkerAt(ghostPositions[i], flow, color, Math.max(1, flow.size * (1 - distance * 0.12)), opacity, time * 1.25)
    }
    if (flow.trail === 'wake') {
      const wake = Math.min(0.28, Math.max(0.08, (flow.size * 4) / flow.routeLength))
      out += `<path d="${escapeXml(flow.routePath)}" pathLength="1" fill="none" stroke="${color}" stroke-width="${Math.max(1.5, flow.size * 0.38)}" stroke-linecap="round" stroke-opacity="0.18" stroke-dasharray="${wake} 1" stroke-dashoffset="${keyNumber(wake - position.progress)}"/>`
    }
    out += staticMarkerAt(position, flow, color, flow.size, 1, time * 1.25)
  }
  out += `${flowLabel(flow, color, options.fontFamily ?? 'ui-sans-serif, system-ui, sans-serif')}</g>`
  return out
}

function resolveFlowColor(flow: ResolvedFlow, data: ArcDiagramData, themeColors?: Theme['light'] | Theme['dark'] | null): string {
  const first = flow.legs[0]
  const authored = flow.flow.color ?? (first ? data.connectorStyles[data.connectors[first.connectorIndex]?.style ?? '']?.color : undefined) ?? 'blue'
  const palette = themeColors?.palette?.[authored as keyof NonNullable<Theme['light']['palette']>]
  return palette?.stroke ?? fallbackFlowColors[authored] ?? fallbackFlowColors.blue
}

/** SVG markup for the flow layer. Draw it after connectors and before nodes so
 *  handoffs disappear under the destination node instead of floating on top. */
export function renderFlowLayer(data: ArcDiagramData, options: FlowSvgOptions = {}): string {
  const animated = options.animate !== false && options.flowTime === undefined
  let out = '<g data-arc-flows="true">'
  for (const source of data.flows ?? []) {
    const flow = resolveDiagramFlow(data, source)
    if (!flow) continue
    out += animated ? animatedFlow(flow, data, options) : staticFlow(flow, data, options)
  }
  return `${out}</g>`
}

/** Total seconds needed to show every flow once (or one loop for indefinite flows). */
export function diagramFlowDuration(data: ArcDiagramData): number {
  let end = 0
  for (const source of data.flows ?? []) {
    const flow = resolveDiagramFlow(data, source)
    if (flow) end = Math.max(end, flowAnimationEnd(flow))
  }
  return end
}
