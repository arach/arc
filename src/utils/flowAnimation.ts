import type {
  ArcDiagramData,
  Connector,
  DiagramFlow,
  DiagramFlowLeg,
  FlowDirection,
  FlowEasing,
  FlowMarker,
  FlowTrail,
} from '../types/diagram'
import type { Point } from '../types/editor'
import { anchorOnNode, connectorGeometry, connectorSegmentsPath, type ConnectorPathSegment } from './diagramHelpers'
import { NODE_SIZES } from './constants'

export const DEFAULT_FLOW_SPEED = 160
export const DEFAULT_FLOW_SIZE = 10
export const DEFAULT_FLOW_TRANSIT = 0.18

const CURVE_SAMPLES = 32
const EPSILON = 0.0001

interface MeasuredSegment {
  segment: ConnectorPathSegment
  length: number
  start: number
  end: number
  points: Point[]
  cumulative: number[]
}

export interface ResolvedFlowLeg {
  index: number
  connectorIndex: number
  connectorId?: string
  ref: DiagramFlowLeg
  direction: FlowDirection
  routeStart: number
  routeEnd: number
  travelStart: number
  travelEnd: number
  pause: number
}

export interface FlowTimelineSpan {
  start: number
  end: number
  fromDistance: number
  toDistance: number
  easing: FlowEasing
  transit: boolean
  legIndex?: number
}

export interface ResolvedFlow {
  flow: DiagramFlow
  routePath: string
  routeLength: number
  visibleLength: number
  duration: number
  cycleDuration: number
  delay: number
  hold: number
  repeat: number | 'indefinite'
  easing: FlowEasing
  marker: FlowMarker
  size: number
  trail: FlowTrail
  legs: ResolvedFlowLeg[]
  intervals: FlowTimelineSpan[]
  segments: MeasuredSegment[]
}

export interface FlowPosition {
  x: number
  y: number
  angle: number
  /** 0–1 progress along the route. */
  progress: number
  /** Route distance in px. */
  distance: number
  /** Leg index while travelling a connector leg, -1 while transiting under a node. */
  legIndex: number
  transit: boolean
}

function nodeAnchor(data: ArcDiagramData, nodeId: string, anchor: Connector['fromAnchor']): Point | null {
  const node = data.nodes[nodeId]
  if (!node) return null
  const size = NODE_SIZES[node.size] ?? NODE_SIZES.m
  return anchorOnNode({
    x: node.x,
    y: node.y,
    width: node.width ?? size.width,
    height: node.height ?? size.height,
  }, anchor)
}

export function findConnectorForLeg(
  connectors: Connector[],
  leg: DiagramFlowLeg,
): { connector: Connector; index: number; ambiguous: boolean } | null {
  if (leg.id !== undefined) {
    const index = connectors.findIndex(connector => connector.id === leg.id)
    return index >= 0 ? { connector: connectors[index], index, ambiguous: false } : null
  }
  if (leg.from === undefined || leg.to === undefined) return null
  const matches: number[] = []
  for (let i = 0; i < connectors.length; i++) {
    const connector = connectors[i]
    if (connector.from === leg.from && connector.to === leg.to) matches.push(i)
  }
  if (!matches.length) return null
  return { connector: connectors[matches[0]], index: matches[0], ambiguous: matches.length > 1 }
}

function cubicPoint(from: Point, cp1: Point, cp2: Point, to: Point, t: number): Point {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * from.x + b * cp1.x + c * cp2.x + d * to.x,
    y: a * from.y + b * cp1.y + c * cp2.y + d * to.y,
  }
}

function quadraticPoint(from: Point, control: Point, to: Point, t: number): Point {
  const u = 1 - t
  return {
    x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
  }
}

function linePoint(from: Point, to: Point, t: number): Point {
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
}

function segmentPointAt(segment: ConnectorPathSegment, t: number): Point {
  if (segment.kind === 'line') return linePoint(segment.from, segment.to, t)
  if (segment.kind === 'quadratic') return quadraticPoint(segment.from, segment.control, segment.to, t)
  return cubicPoint(segment.from, segment.cp1, segment.cp2, segment.to, t)
}

function segmentAngleAt(segment: ConnectorPathSegment, t: number): number {
  let dx = segment.to.x - segment.from.x
  let dy = segment.to.y - segment.from.y
  if (segment.kind === 'quadratic') {
    dx = 2 * (1 - t) * (segment.control.x - segment.from.x) + 2 * t * (segment.to.x - segment.control.x)
    dy = 2 * (1 - t) * (segment.control.y - segment.from.y) + 2 * t * (segment.to.y - segment.control.y)
  } else if (segment.kind === 'cubic') {
    const u = 1 - t
    dx = 3 * u * u * (segment.cp1.x - segment.from.x) + 6 * u * t * (segment.cp2.x - segment.cp1.x) + 3 * t * t * (segment.to.x - segment.cp2.x)
    dy = 3 * u * u * (segment.cp1.y - segment.from.y) + 6 * u * t * (segment.cp2.y - segment.cp1.y) + 3 * t * t * (segment.to.y - segment.cp2.y)
  }
  if (Math.abs(dx) < EPSILON && Math.abs(dy) < EPSILON) return 0
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

function measureSegment(segment: ConnectorPathSegment, start: number): MeasuredSegment {
  if (segment.kind === 'line') {
    const length = Math.hypot(segment.to.x - segment.from.x, segment.to.y - segment.from.y)
    return { segment, length, start, end: start + length, points: [segment.from, segment.to], cumulative: [0, length] }
  }
  const points: Point[] = []
  const cumulative = [0]
  for (let i = 0; i <= CURVE_SAMPLES; i++) points.push(segmentPointAt(segment, i / CURVE_SAMPLES))
  for (let i = 1; i < points.length; i++) {
    cumulative.push(cumulative[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y))
  }
  const length = cumulative[cumulative.length - 1]
  return { segment, length, start, end: start + length, points, cumulative }
}

function reverseSegment(segment: ConnectorPathSegment): ConnectorPathSegment {
  if (segment.kind === 'line') return { kind: 'line', from: segment.to, to: segment.from }
  if (segment.kind === 'quadratic') return { kind: 'quadratic', from: segment.to, control: segment.control, to: segment.from }
  return { kind: 'cubic', from: segment.to, cp1: segment.cp2, cp2: segment.cp1, to: segment.from }
}

function connectorSegmentsForFlow(
  data: ArcDiagramData,
  connector: Connector,
  direction: FlowDirection,
): { segments: ConnectorPathSegment[]; start: Point; end: Point } | null {
  const from = nodeAnchor(data, connector.from, connector.fromAnchor)
  const to = nodeAnchor(data, connector.to, connector.toAnchor)
  if (!from || !to) return null
  const geometry = connectorGeometry(from, to, connector.fromAnchor, connector.toAnchor, connector.curve, connector.curveDepth ?? 40)
  if (!geometry.segments.length) return null
  if (direction === 'forward') return { segments: geometry.segments, start: from, end: to }
  const segments = [...geometry.segments].reverse().map(reverseSegment)
  return { segments, start: to, end: from }
}

function pointAtMeasuredDistance(measured: MeasuredSegment, distance: number): { point: Point; angle: number } {
  const clamped = Math.max(0, Math.min(measured.length, distance))
  if (measured.segment.kind === 'line' || measured.length <= EPSILON) {
    const t = measured.length <= EPSILON ? 0 : clamped / measured.length
    return { point: segmentPointAt(measured.segment, t), angle: segmentAngleAt(measured.segment, t) }
  }
  let index = 1
  while (index < measured.cumulative.length - 1 && measured.cumulative[index] < clamped) index++
  const prevDistance = measured.cumulative[index - 1]
  const nextDistance = measured.cumulative[index]
  const local = nextDistance === prevDistance ? 0 : (clamped - prevDistance) / (nextDistance - prevDistance)
  const a = measured.points[index - 1]
  const b = measured.points[index]
  const point = linePoint(a, b, local)
  const t = Math.max(0, Math.min(1, (index - 1 + local) / CURVE_SAMPLES))
  return { point, angle: segmentAngleAt(measured.segment, t) }
}

export function flowPointAtDistance(flow: ResolvedFlow, distance: number): FlowPosition | null {
  if (distance < -EPSILON || flow.routeLength <= EPSILON) return null
  const clamped = Math.max(0, Math.min(flow.routeLength, distance))
  const segment = flow.segments.find(item => clamped <= item.end + EPSILON) ?? flow.segments[flow.segments.length - 1]
  if (!segment) return null
  const { point, angle } = pointAtMeasuredDistance(segment, clamped - segment.start)
  const legIndex = flow.legs.findIndex(leg => clamped >= leg.routeStart - EPSILON && clamped <= leg.routeEnd + EPSILON)
  const transit = legIndex < 0
  return {
    x: point.x,
    y: point.y,
    angle,
    progress: clamped / flow.routeLength,
    distance: clamped,
    legIndex,
    transit,
  }
}

export function easeFlow(progress: number, easing: FlowEasing): number {
  const t = Math.max(0, Math.min(1, progress))
  switch (easing) {
    case 'ease-in': return t * t
    case 'ease-out': return 1 - (1 - t) * (1 - t)
    case 'ease-in-out': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    default: return t
  }
}

export function flowDistanceAt(flow: ResolvedFlow, time: number): number | null {
  const local = time - flow.delay
  if (local < 0) return null
  const cycle = flow.cycleDuration
  let phase: number
  if (flow.repeat === 'indefinite') {
    phase = cycle <= EPSILON ? 0 : local % cycle
  } else {
    const repeats = Math.max(0, Math.floor(flow.repeat))
    if (repeats === 0) return null
    const run = Math.floor(local / cycle)
    if (run >= repeats) return null
    phase = local - run * cycle
  }
  if (phase > flow.duration) return null
  const span = flow.intervals.find(item => phase >= item.start - EPSILON && phase <= item.end + EPSILON)
  if (!span) return null
  const elapsed = span.end - span.start
  const localProgress = elapsed <= EPSILON ? 1 : (phase - span.start) / elapsed
  return span.fromDistance + (span.toDistance - span.fromDistance) * easeFlow(localProgress, span.easing)
}

export function flowPositionAt(flow: ResolvedFlow, time: number): FlowPosition | null {
  const distance = flowDistanceAt(flow, time)
  return distance === null ? null : flowPointAtDistance(flow, distance)
}

/** Marker ghost points spaced behind the current route position. */
export function flowTrailPositionsAt(flow: ResolvedFlow, time: number, spacing: number, count: number): FlowPosition[] {
  const marker = flowPositionAt(flow, time)
  if (!marker || spacing <= 0 || count <= 0) return []
  const positions: FlowPosition[] = []
  for (let i = 1; i <= count; i++) {
    const point = flowPointAtDistance(flow, marker.distance - spacing * i)
    if (point) positions.push(point)
  }
  return positions
}

/** Resolve a flow to geometry plus its deterministic timing table. Returns null
 *  when a leg cannot be tied to an existing connector or no route exists. */
export function resolveDiagramFlow(data: ArcDiagramData, flow: DiagramFlow): ResolvedFlow | null {
  const legGeometries: Array<{
    leg: DiagramFlowLeg
    connectorIndex: number
    connectorId?: string
    direction: FlowDirection
    segments: ConnectorPathSegment[]
    start: Point
    end: Point
  }> = []

  for (let i = 0; i < flow.legs.length; i++) {
    const leg = flow.legs[i]
    const match = findConnectorForLeg(data.connectors, leg)
    if (!match) return null
    const direction = leg.direction ?? flow.direction ?? 'forward'
    const geometry = connectorSegmentsForFlow(data, match.connector, direction)
    if (!geometry) return null
    legGeometries.push({
      leg,
      connectorIndex: match.index,
      connectorId: match.connector.id,
      direction,
      ...geometry,
    })
  }
  if (!legGeometries.length) return null

  const segments: ConnectorPathSegment[] = []
  const legRoutes: Array<{ routeStart: number; routeEnd: number; transitEnd: number }> = []
  let routeCursor = 0
  legGeometries.forEach((legGeometry, index) => {
    const routeStart = routeCursor
    for (const segment of legGeometry.segments) {
      segments.push(segment)
      routeCursor += segment.kind === 'line'
        ? Math.hypot(segment.to.x - segment.from.x, segment.to.y - segment.from.y)
        : measureSegment(segment, 0).length
    }
    const routeEnd = routeCursor
    if (index < legGeometries.length - 1) {
      const next = legGeometries[index + 1]
      const transitLength = Math.hypot(next.start.x - legGeometry.end.x, next.start.y - legGeometry.end.y)
      if (transitLength > EPSILON) {
        segments.push({ kind: 'line', from: legGeometry.end, to: next.start })
        routeCursor += transitLength
      }
    }
    legRoutes.push({ routeStart, routeEnd, transitEnd: routeCursor })
  })

  if (routeCursor <= EPSILON) return null

  const measured: MeasuredSegment[] = []
  let measuredCursor = 0
  for (const segment of segments) {
    const item = measureSegment(segment, measuredCursor)
    measured.push(item)
    measuredCursor = item.end
  }

  const visibleLength = legGeometries.reduce((sum, _, index) => {
    const route = legRoutes[index]
    return sum + (route.routeEnd - route.routeStart)
  }, 0)
  if (visibleLength <= EPSILON) return null

  const pauses = legGeometries.slice(0, -1).map(item => Math.max(0.02, item.leg.pause ?? DEFAULT_FLOW_TRANSIT))
  const pauseTotal = pauses.reduce((sum, value) => sum + value, 0)
  const speed = flow.speed ?? DEFAULT_FLOW_SPEED
  const travelTotal = flow.duration !== undefined
    ? Math.max(EPSILON, flow.duration - pauseTotal)
    : visibleLength / speed

  const legs: ResolvedFlowLeg[] = []
  const intervals: FlowTimelineSpan[] = []
  let timeCursor = 0
  legGeometries.forEach((item, index) => {
    const route = legRoutes[index]
    const legDistance = route.routeEnd - route.routeStart
    const travel = travelTotal * (legDistance / visibleLength)
    const travelStart = timeCursor
    const travelEnd = travelStart + travel
    legs.push({
      index,
      connectorIndex: item.connectorIndex,
      connectorId: item.connectorId,
      ref: item.leg,
      direction: item.direction,
      routeStart: route.routeStart,
      routeEnd: route.routeEnd,
      travelStart,
      travelEnd,
      pause: index < pauses.length ? pauses[index] : 0,
    })
    intervals.push({
      start: travelStart,
      end: travelEnd,
      fromDistance: route.routeStart,
      toDistance: route.routeEnd,
      easing: flow.easing ?? 'linear',
      transit: false,
      legIndex: index,
    })
    timeCursor = travelEnd
    if (index < legGeometries.length - 1) {
      const pause = pauses[index]
      const transitEnd = route.transitEnd
      intervals.push({
        start: travelEnd,
        end: travelEnd + pause,
        fromDistance: route.routeEnd,
        toDistance: transitEnd,
        easing: 'linear',
        transit: true,
      })
      timeCursor += pause
    }
  })

  const duration = timeCursor
  const hold = flow.hold ?? 0
  return {
    flow,
    routePath: connectorSegmentsPath(segments),
    routeLength: measuredCursor,
    visibleLength,
    duration,
    cycleDuration: duration + hold,
    delay: flow.delay ?? 0,
    hold,
    repeat: flow.repeat ?? 'indefinite',
    easing: flow.easing ?? 'linear',
    marker: flow.marker ?? 'dot',
    size: flow.size ?? DEFAULT_FLOW_SIZE,
    trail: flow.trail ?? 'none',
    legs,
    intervals,
    segments: measured,
  }
}

export function resolveDiagramFlows(data: ArcDiagramData): ResolvedFlow[] {
  return (data.flows ?? [])
    .map(flow => resolveDiagramFlow(data, flow))
    .filter((flow): flow is ResolvedFlow => flow !== null)
}

/** Last visible timestamp for one finite flow run, or one full cycle when the
 *  flow repeats indefinitely. Used as the default GIF/MP4 duration. */
export function flowAnimationEnd(flow: ResolvedFlow): number {
  if (flow.repeat === 'indefinite') return flow.delay + flow.cycleDuration
  const repeats = Math.max(0, Math.floor(flow.repeat))
  if (repeats === 0) return flow.delay
  return flow.delay + (repeats - 1) * flow.cycleDuration + flow.duration
}
