"use client"
import React, { useState, useCallback, useMemo } from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getTheme, resolveNodeRadius, type ThemeId, type Theme, type BrandSpec } from '../utils/themes'
import {
  radiusForShape,
  resolveNodeDecor,
  resolveNodeShape,
  type NodeShape,
  shapeClipPath,
  shapeCut,
  shapeOutlinePath,
  type NodeDecor,
} from '../utils/nodeShape'
import { autoLayout } from '../utils/autoLayout'
import { getIsoStyle, type IsoStyleId } from '../utils/isoStyles'
import { isoContentBounds, isoPlateBounds, buildNodeIndex } from '../utils/isoBlueprint'
import IsometricNodeLayer from './editor/IsometricNodeLayer'
import IsometricConnectorLayer from './editor/IsometricConnectorLayer'
import TechnicalBackdrop from './technical/TechnicalBackdrop'
import TechnicalPlate from './technical/TechnicalPlate'
import type { Connector as EditorConnector } from '../types/editor'

// ============================================
// Types
// ============================================

export type NodeSize = 'xs' | 's' | 'm' | 'l'
export type AnchorPosition = 'left' | 'right' | 'top' | 'bottom' | 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'
export type DiagramColor = 'violet' | 'emerald' | 'blue' | 'amber' | 'sky' | 'zinc' | 'rose' | 'orange'
export type ViewMode = '2d' | 'isometric'
export type { IsoStyleId }

export interface NodePosition {
  x: number
  y: number
  size: NodeSize
}

export interface NodeData {
  icon: string
  name: string
  subtitle?: string
  description?: string
  color: DiagramColor
  /** Per-node silhouette. Omit to follow the theme's own node shape. */
  shape?: NodeShape
}

export interface Connector {
  from: string
  to: string
  fromAnchor: AnchorPosition
  toAnchor: AnchorPosition
  style: string
  curve?: 'natural' | 'step'
}

export type LabelAlign = 'left' | 'right' | 'center'

export interface ConnectorStyle {
  color: DiagramColor
  strokeWidth: number
  label?: string
  labelAlign?: LabelAlign  // For vertical: 'right' = right of line, 'left' = left of line. Default: 'right'
  dashed?: boolean
}

export interface DiagramLayout {
  width: number
  height: number
}

export interface FocusConnectorRef {
  from: string
  to: string
}

export interface FocusStep {
  icon: string
  label: string
}

export interface FocusTarget {
  mode?: 'append' | 'replace'
  nodes?: string[]
  connectors?: FocusConnectorRef[]
  caption?: string
  steps?: FocusStep[]
}

export interface GroupShape {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: 'rect' | 'circle'
  color: DiagramColor
  label?: string
  dashed?: boolean
}

export type LayoutAlignment = 'start' | 'center' | 'end'
export type GroupLayoutDirection = 'horizontal' | 'vertical'

export interface NodeLayoutHint {
  group?: string
  layer?: number
  order?: number
}

export interface GroupLayoutHint {
  direction?: GroupLayoutDirection
  padding?: number
  layerGap?: number
  itemGap?: number
  align?: LayoutAlignment
  justify?: LayoutAlignment | 'space-between'
}

export interface LayoutHints {
  nodes?: Record<string, NodeLayoutHint>
  groups?: Record<string, GroupLayoutHint>
}

export interface ArcDiagramData {
  id?: string
  layout: DiagramLayout
  layoutHints?: LayoutHints
  nodes: Record<string, NodePosition>
  nodeData: Record<string, NodeData>
  connectors: Connector[]
  connectorStyles: Record<string, ConnectorStyle>
  focusTargets?: Record<string, FocusTarget>
  groups?: GroupShape[]
}

// ============================================
// Hover Effects
// ============================================

export interface HoverEffectsConfig {
  /** Dim unrelated nodes/connectors. Default: true */
  dim?: boolean
  /** 0–1 opacity for dimmed nodes. Connectors dim to ~56% of this. Default: 0.45 */
  dimOpacity?: number
  /** Lift hovered node up 2px. Default: true */
  lift?: boolean
  /** Colored glow shadow on hover. Default: true */
  glow?: boolean
  /** Thicken connected edges. Default: true */
  highlightEdges?: boolean
}

interface ResolvedHoverEffects {
  enabled: boolean
  dim: boolean
  dimOpacity: number
  connectorDimOpacity: number
  lift: boolean
  glow: boolean
  highlightEdges: boolean
}

function resolveHoverEffects(input?: boolean | HoverEffectsConfig): ResolvedHoverEffects {
  if (input === false) return { enabled: false, dim: false, dimOpacity: 1, connectorDimOpacity: 1, lift: false, glow: false, highlightEdges: false }
  const cfg = typeof input === 'object' ? input : {}
  const dimOpacity = cfg.dimOpacity ?? 0.45
  return {
    enabled: true,
    dim: cfg.dim ?? true,
    dimOpacity,
    connectorDimOpacity: dimOpacity * 0.56,
    lift: cfg.lift ?? true,
    glow: cfg.glow ?? true,
    highlightEdges: cfg.highlightEdges ?? true,
  }
}

export function resolveFocusState(
  activeNodeId: string | null,
  connectors: Connector[],
  focusTargets?: Record<string, FocusTarget>,
) {
  const nodeIds = new Set<string>()
  const connectorIndexes = new Set<number>()

  if (!activeNodeId) return { nodeIds, connectorIndexes }

  nodeIds.add(activeNodeId)
  const target = focusTargets?.[activeNodeId]

  if (target?.mode !== 'replace') {
    connectors.forEach((connector, index) => {
      if (connector.from !== activeNodeId && connector.to !== activeNodeId) return
      connectorIndexes.add(index)
      if (target) {
        nodeIds.add(connector.from)
        nodeIds.add(connector.to)
      }
    })
  }

  for (const nodeId of target?.nodes || []) nodeIds.add(nodeId)

  for (const ref of target?.connectors || []) {
    connectors.forEach((connector, index) => {
      if (connector.from !== ref.from || connector.to !== ref.to) return
      connectorIndexes.add(index)
      nodeIds.add(connector.from)
      nodeIds.add(connector.to)
    })
  }

  return { nodeIds, connectorIndexes }
}

function FocusStory({
  target,
  mode,
  inset,
  monoFamily,
}: {
  target: FocusTarget
  mode: DiagramMode
  inset: number
  monoFamily?: string
}) {
  if (!target.caption && !target.steps?.length) return null

  const isLight = mode === 'light'

  return (
    <div
      data-arc-focus-story
      role="status"
      aria-live="polite"
      className="absolute z-20 pointer-events-none"
      style={{
        top: inset,
        left: inset + 58,
        right: inset + 58,
        maxWidth: 620,
        marginInline: 'auto',
        padding: '9px 11px',
        border: `1px solid ${isLight ? 'rgba(24,24,27,0.14)' : 'rgba(244,244,245,0.14)'}`,
        borderRadius: 6,
        background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(9,9,11,0.88)',
        boxShadow: isLight ? '0 8px 24px rgba(24,24,27,0.08)' : '0 8px 24px rgba(0,0,0,0.24)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {target.caption && (
        <div
          className={isLight ? 'text-zinc-700' : 'text-zinc-300'}
          style={{ fontSize: 11.5, lineHeight: 1.45 }}
        >
          {target.caption}
        </div>
      )}
      {!!target.steps?.length && (
        <div
          className="flex items-stretch overflow-hidden"
          style={{
            marginTop: target.caption ? 8 : 0,
            borderTop: `1px solid ${isLight ? 'rgba(24,24,27,0.1)' : 'rgba(244,244,245,0.1)'}`,
            fontFamily: monoFamily || 'ui-monospace, monospace',
          }}
        >
          {target.steps.map((step, index) => {
            const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[step.icon] || LucideIcons.Box
            return (
              <div
                key={`${step.icon}-${step.label}-${index}`}
                className={isLight ? 'text-zinc-600' : 'text-zinc-400'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  minWidth: 0,
                  flex: '1 1 0',
                  padding: '7px 10px 0',
                  borderLeft: index ? `1px solid ${isLight ? 'rgba(24,24,27,0.1)' : 'rgba(244,244,245,0.1)'}` : undefined,
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                <span style={{ opacity: 0.55 }}>{String(index + 1).padStart(2, '0')}</span>
                <Icon aria-hidden="true" style={{ width: 12, height: 12, flex: '0 0 auto' }} strokeWidth={1.6} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DiagramGroups({ groups, themeColors }: {
  groups: GroupShape[]
  themeColors: Theme['light'] | Theme['dark']
}) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      {groups.map(group => {
        const color = themeColors.palette[group.color] || themeColors.palette.zinc
        const common = {
          fill: color.stroke,
          fillOpacity: 0.06,
          stroke: color.stroke,
          strokeOpacity: 0.55,
          strokeWidth: 1.5,
          strokeDasharray: group.dashed ? '8 4' : undefined,
        }

        return (
          <g key={group.id}>
            {group.type === 'circle' ? (
              <ellipse
                cx={group.x + group.width / 2}
                cy={group.y + group.height / 2}
                rx={group.width / 2}
                ry={group.height / 2}
                {...common}
              />
            ) : (
              <rect
                x={group.x}
                y={group.y}
                width={group.width}
                height={group.height}
                rx={8}
                {...common}
              />
            )}
            {group.label && (
              <text
                x={group.x + 12}
                y={group.y + 19}
                fill={color.stroke}
                fontSize={11}
                fontWeight={600}
                letterSpacing="0.06em"
              >
                {group.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ============================================
// Constants
// ============================================

const NODE_SIZES: Record<NodeSize, { width: number; height: number }> = {
  l: { width: 220, height: 90 },
  m: { width: 160, height: 75 },
  s: { width: 110, height: 48 },
  xs: { width: 80, height: 36 },
}

// Mode = light/dark appearance, Theme = color palette
export type DiagramMode = 'dark' | 'light'
export { type ThemeId } from '../utils/themes'

// ============================================
// Components
// ============================================

interface NodeProps {
  node: NodePosition
  data: NodeData
  mode: DiagramMode
  themeColors: Theme['light'] | Theme['dark']
  brand?: BrandSpec
  hovered?: boolean
  dimmed?: boolean
  lift?: boolean
  glow?: boolean
  dimOpacity?: number
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
}

/** Ornament layer drawn inside the node shell. Never intercepts pointers. */
function NodeDecoration({ decor, stroke, cut }: { decor: NodeDecor; stroke: string; cut: number }) {
  if (decor === 'none' || decor === 'rule') return null

  const common: React.CSSProperties = { position: 'absolute', pointerEvents: 'none' }

  if (decor === 'bar-left') {
    return <span style={{ ...common, left: 0, top: 0, bottom: 0, width: 2, background: stroke }} />
  }
  if (decor === 'bar-top') {
    return <span style={{ ...common, left: 0, right: 0, top: 0, height: 2, background: stroke }} />
  }
  if (decor === 'dot') {
    return (
      <span
        style={{
          ...common,
          top: 6,
          right: 6,
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: stroke,
          boxShadow: `0 0 6px -1px ${stroke}`,
        }}
      />
    )
  }
  if (decor === 'ticks') {
    // Corner registration marks, inset past any chamfer so they read as ticks
    const arm = 6
    const i = Math.max(3, cut - 2)
    const tick = (x: 'left' | 'right', y: 'top' | 'bottom') => (
      <span key={`${x}${y}`} style={{ ...common, [x]: i, [y]: i, width: arm, height: arm } as React.CSSProperties}>
        <span style={{ position: 'absolute', [y]: 0, left: 0, right: 0, height: 1, background: stroke, opacity: 0.75 } as React.CSSProperties} />
        <span style={{ position: 'absolute', [x]: 0, top: 0, bottom: 0, width: 1, background: stroke, opacity: 0.75 } as React.CSSProperties} />
      </span>
    )
    return <>{tick('left', 'top')}{tick('right', 'top')}{tick('left', 'bottom')}{tick('right', 'bottom')}</>
  }
  // stripe — hatched corner flag, bottom-right so it never lands in a notch
  return (
    <span style={{ ...common, bottom: 0, right: 0, width: 26, height: 26, overflow: 'hidden' }}>
      <svg width={26} height={26} aria-hidden="true">
        <defs>
          <pattern id={`arc-stripe-${stroke.replace('#', '')}`} width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={4} stroke={stroke} strokeWidth={1} opacity={0.55} />
          </pattern>
        </defs>
        <path d="M 26 0 L 26 26 L 0 26 Z" fill={`url(#arc-stripe-${stroke.replace('#', '')})`} />
      </svg>
    </span>
  )
}

export function Node({ node, data, mode, themeColors, brand, hovered, dimmed, lift = true, glow = true, dimOpacity = 0.45, onMouseEnter, onMouseLeave, onClick }: NodeProps) {
  const size = NODE_SIZES[node.size]
  const color = themeColors.palette[data.color] || themeColors.palette.zinc
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[data.icon] || LucideIcons.Box

  const isLarge = node.size === 'l'
  const isSmall = node.size === 's'
  const isLight = mode === 'light'
  const themeRadius = resolveNodeRadius(brand)
  const shellOpacity = brand?.nodeOpacity ?? 1

  // A node can override the theme's silhouette; the radius has to follow it,
  // or a pill in a square theme still comes out square.
  const shape = resolveNodeShape(data.shape || brand?.nodeShape, themeRadius)
  const nodeRadius = data.shape ? radiusForShape(shape, themeRadius) : themeRadius
  const decor = resolveNodeDecor(brand?.nodeDecor, brand?.accentBar)
  const cut = shapeCut(node.size)
  const clipPath = shapeClipPath(shape, cut)
  const borderWidth = brand?.nodeBorderWidth || '1px'

  const glowShadow = `0 0 20px -6px ${color.stroke}55, 0 8px 24px -8px ${color.stroke}33`
  const innerHighlight = `inset 0 1px 0 rgba(255,255,255,${isLight ? (hovered ? 0.35 : 0.25) : hovered ? 0.06 : 0.04})`

  const body = (
    <>
      <NodeDecoration decor={decor} stroke={color.stroke} cut={clipPath ? cut : 0} />
      <div
        className="flex items-center gap-3"
        style={decor === 'rule' ? { borderBottom: `1px solid ${color.stroke}33`, paddingBottom: 6, marginBottom: 5 } : undefined}
      >
        <div className={`
          flex-shrink-0
          ${isLarge ? 'w-9 h-9' : isSmall ? 'w-6 h-6' : 'w-7 h-7'}
          flex items-center justify-center
        `} style={{
          borderRadius: nodeRadius === '9999px' ? '9999px' : (nodeRadius || '2px'),
          border: `1px solid ${color.stroke}30`,
          background: `${color.stroke}12`,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          boxShadow: `inset 0 1px 0 ${color.stroke}18`,
        }}>
          <Icon
            className={`${isLarge ? 'w-4 h-4' : isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${color.icon}`}
            style={{ opacity: 0.82 }}
            strokeWidth={1.5}
          />
        </div>
        <div className="min-w-0">
          <div
            className={`font-medium ${themeColors.text.primary} ${isLarge ? 'text-xs' : isSmall ? 'text-[9px]' : 'text-[11px]'}`}
            style={brand?.fontFamily ? { fontFamily: brand.fontFamily, letterSpacing: '-0.015em' } : undefined}
          >
            {data.name}
          </div>
          {data.subtitle && (
            <div
              className={`${themeColors.text.muted} ${isSmall ? 'text-[8px]' : 'text-[9px]'}`}
              style={{
                fontFamily: brand?.upperLabels ? brand.monoFamily : (brand?.fontFamily || undefined),
                textTransform: brand?.upperLabels ? 'uppercase' : 'none',
                letterSpacing: brand?.upperLabels ? '0.06em' : '0.01em',
                opacity: 0.72,
              }}
            >
              {data.subtitle}
            </div>
          )}
        </div>
      </div>
      {data.description && !isSmall && (
        <div
          className={`mt-1 ${themeColors.text.secondary} ${isLarge ? 'text-[9px]' : 'text-[9px]'}`}
          style={{ opacity: 0.65, letterSpacing: '0.01em' }}
        >
          {data.description}
        </div>
      )}
    </>
  )

  const pad = isLarge ? 'px-5 py-3' : isSmall ? 'px-3 py-2' : 'px-4 py-2.5'
  const surface = `${color.bg} ${isLight && !brand?.nodeGlass ? 'bg-white/80' : ''} ${
    brand?.nodeGlass ? 'backdrop-blur-md' : isLight ? '' : 'backdrop-blur-sm'
  }`

  const placement: React.CSSProperties = {
    left: node.x,
    top: node.y,
    width: size.width,
    fontFamily: brand?.fontFamily,
    transform: hovered && lift ? 'translateY(-2px)' : 'none',
    opacity: dimmed ? dimOpacity : shellOpacity,
    zIndex: hovered ? 10 : undefined,
    cursor: onClick ? 'pointer' : undefined,
  }

  const handlers = { onMouseEnter, onMouseLeave, onClick }

  // Cut silhouettes clip their own border and box-shadow: the edge is stroked
  // as an SVG overlay, and the glow becomes a drop-shadow, which follows the
  // clip path. The shell takes the nominal height so the outline matches the
  // geometry connectors already anchor to.
  if (clipPath) {
    const outline = shapeOutlinePath(shape, size.width, size.height, cut)
    return (
      <div
        className="absolute transition-all duration-200 ease-out"
        style={{
          ...placement,
          height: size.height,
          filter: hovered && glow ? `drop-shadow(0 4px 12px ${color.stroke}55)` : undefined,
        }}
        data-arc-node
        {...handlers}
      >
        <div
          className={`relative h-full ${surface} ${pad}`}
          style={{ clipPath, boxShadow: innerHighlight }}
        >
          {body}
        </div>
        <svg
          className="absolute inset-0 pointer-events-none"
          width={size.width}
          height={size.height}
          aria-hidden="true"
        >
          <path
            d={outline}
            fill="none"
            stroke={color.stroke}
            strokeOpacity={hovered ? 0.95 : isLight ? 0.6 : 0.5}
            strokeWidth={parseFloat(borderWidth) || 1}
          />
        </svg>
      </div>
    )
  }

  return (
    <div
      className={`
        absolute border ${color.border} ${surface}
        ${!nodeRadius ? 'rounded-xl' : ''}
        ${isLight && !brand?.nodeGlass ? 'shadow-sm' : ''}
        ${pad}
        transition-all duration-200 ease-out
      `}
      style={{
        ...placement,
        borderRadius: nodeRadius,
        borderWidth,
        boxShadow: hovered && glow ? `${glowShadow}, ${innerHighlight}` : innerHighlight,
      }}
      data-arc-node
      {...handlers}
    >
      {body}
    </div>
  )
}

function getAnchorPoint(node: NodePosition, anchor: AnchorPosition): { x: number; y: number } {
  const size = NODE_SIZES[node.size]
  const gap = 6

  const anchors: Record<AnchorPosition, { x: number; y: number }> = {
    left:        { x: node.x - gap,              y: node.y + size.height / 2 },
    right:       { x: node.x + size.width + gap, y: node.y + size.height / 2 },
    top:         { x: node.x + size.width / 2,   y: node.y - gap },
    bottom:      { x: node.x + size.width / 2,   y: node.y + size.height + gap },
    bottomRight: { x: node.x + size.width + gap, y: node.y + size.height - 12 },
    bottomLeft:  { x: node.x - gap,              y: node.y + size.height - 12 },
    topRight:    { x: node.x + size.width + gap, y: node.y + 12 },
    topLeft:     { x: node.x - gap,              y: node.y + 12 },
  }

  return anchors[anchor]
}

// Calculate angle between two points for arrow rotation
function getAngle(from: { x: number; y: number }, to: { x: number; y: number }): number {
  return Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI)
}

interface ConnectorProps {
  connector: Connector
  connectorIndex: number
  nodes: Record<string, NodePosition>
  styles: Record<string, ConnectorStyle>
  themeColors: Theme['light'] | Theme['dark']
  brand?: BrandSpec
  highlighted?: boolean
  dimmed?: boolean
  dimOpacity?: number
}

function ConnectorPath({ connector, connectorIndex, nodes, styles, themeColors, brand, highlighted, dimmed, dimOpacity = 0.25 }: ConnectorProps) {
  const fromNode = nodes[connector.from]
  const toNode = nodes[connector.to]
  if (!fromNode || !toNode) return null

  // Validate node sizes exist
  if (!NODE_SIZES[fromNode.size] || !NODE_SIZES[toNode.size]) {
    console.warn(`Invalid node size: ${fromNode.size} or ${toNode.size}`)
    return null
  }

  const style = styles[connector.style] || { color: 'zinc', strokeWidth: 2 }

  // Safely get anchor points
  let from: { x: number; y: number }
  let to: { x: number; y: number }
  try {
    from = getAnchorPoint(fromNode, connector.fromAnchor)
    to = getAnchorPoint(toNode, connector.toAnchor)
  } catch (e) {
    console.warn(`Invalid anchor: ${connector.fromAnchor} or ${connector.toAnchor}`)
    return null
  }

  const color = themeColors.palette[style.color]?.stroke || themeColors.palette.zinc.stroke
  const gradientId = `connector-gradient-${connectorIndex}`

  // Calculate path
  let path: string
  const isVertical = Math.abs(to.y - from.y) > Math.abs(to.x - from.x)
  const labelAlign = style.labelAlign || (isVertical ? 'right' : 'center')

  // Label positioning
  let labelPos: { x: number; y: number }
  let labelOffset = { x: 0, y: 0 }
  let textAnchor: 'start' | 'middle' | 'end' = 'middle'

  if (connector.curve === 'natural') {
    // Curved path for diagonal connections
    const dx = to.x - from.x
    const dy = to.y - from.y
    const cp1x = from.x + dx * 0.4
    const cp1y = from.y + dy * 0.1
    const cp2x = to.x - dx * 0.4
    const cp2y = to.y - dy * 0.1
    path = `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`
    labelPos = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
    labelOffset = { x: 0, y: -8 }
  } else {
    path = `M ${from.x} ${from.y} L ${to.x} ${to.y}`
    labelPos = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }

    if (isVertical) {
      // Vertical connector - position label to left or right of line
      if (labelAlign === 'right') {
        labelOffset = { x: 8, y: 4 }
        textAnchor = 'start'  // Left-aligned text on right side
      } else if (labelAlign === 'left') {
        labelOffset = { x: -8, y: 4 }
        textAnchor = 'end'    // Right-aligned text on left side
      } else {
        labelOffset = { x: 0, y: -8 }
        textAnchor = 'middle'
      }
    } else {
      // Horizontal connector - label above, centered
      labelOffset = { x: 0, y: -8 }
      textAnchor = 'middle'
    }
  }

  // Calculate arrow angle at endpoint
  const angle = getAngle(from, to)
  const arrowSize = 8

  return (
    <g style={{
      opacity: dimmed ? dimOpacity : 1,
      transition: 'opacity 200ms ease-out',
    }}>
      {/* Gradient definition - fades at both ends */}
      <defs>
        <linearGradient
          id={gradientId}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={color} stopOpacity={highlighted ? 0.5 : 0.3} />
          <stop offset="15%" stopColor={color} stopOpacity={1} />
          <stop offset="85%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={highlighted ? 0.7 : 0.5} />
        </linearGradient>
      </defs>

      {brand?.connectorGlow && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={(highlighted ? style.strokeWidth + 1 : style.strokeWidth) + 4}
          strokeOpacity={0.18}
          strokeDasharray={style.dashed ? '6 3' : undefined}
          style={{ filter: 'blur(3px)', transition: 'stroke-width 200ms ease-out' }}
        />
      )}

      {/* Main path with gradient */}
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={highlighted ? style.strokeWidth + 1 : style.strokeWidth}
        strokeDasharray={style.dashed ? '6 3' : undefined}
        strokeLinecap="round"
        style={{ transition: 'stroke-width 200ms ease-out' }}
      />

      {/* Arrow head — chevron (brand) or filled triangle */}
      <g transform={`translate(${to.x}, ${to.y}) rotate(${angle})`}>
        {brand?.arrowhead === 'chevron' ? (
          <polyline
            points={`${-arrowSize},${-arrowSize / 2.4} 0,0 ${-arrowSize},${arrowSize / 2.4}`}
            fill="none"
            stroke={color}
            strokeWidth={Math.max(1, style.strokeWidth * 0.85)}
            strokeOpacity={0.9}
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        ) : (
          <polygon
            points={`0,0 ${-arrowSize},-${arrowSize / 2.5} ${-arrowSize},${arrowSize / 2.5}`}
            fill={color}
          />
        )}
      </g>

      {/* Label */}
      {style.label && (
        <text
          x={labelPos.x + labelOffset.x}
          y={labelPos.y + labelOffset.y}
          textAnchor={textAnchor}
          fill={color}
          className="text-[10px] font-mono"
          style={{
            fontFamily: brand?.monoFamily || 'ui-monospace, monospace',
            fontWeight: highlighted ? 600 : 500,
            fontSize: brand?.upperLabels ? undefined : '9px',
            textTransform: brand?.upperLabels ? 'uppercase' : 'none',
            letterSpacing: brand?.upperLabels ? '0.08em' : '0.02em',
            opacity: 0.82,
            transition: 'font-weight 200ms ease-out',
          }}
        >
          {style.label}
        </text>
      )}
    </g>
  )
}

// ============================================
// Zoom Controls
// ============================================

const DEFAULT_ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]

interface ZoomControlsProps {
  zoom: number
  zoomLevels: number[]
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  mode: DiagramMode
  brand?: BrandSpec
  /** Distance (px) from the right and bottom edges. */
  right?: number
  bottom?: number
}

function ZoomControls({ zoom, zoomLevels, onZoomIn, onZoomOut, onReset, mode, brand, right = 12, bottom = 12 }: ZoomControlsProps) {
  const { ZoomIn, ZoomOut } = LucideIcons
  const isLight = mode === 'light'

  return (
    <div
      className={`absolute flex items-center backdrop-blur-sm rounded-md overflow-hidden z-10 ${
        isLight
          ? 'bg-white/90 border border-zinc-200 shadow-sm'
          : 'bg-zinc-900/90 border border-zinc-700'
      }`}
      style={{ right, bottom, borderRadius: brand?.nodeRadius }}
    >
      <button
        onClick={onZoomOut}
        disabled={zoom <= zoomLevels[0]}
        className={`p-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-l-md ${
          isLight ? 'hover:bg-zinc-100' : 'hover:bg-zinc-700'
        }`}
        title="Zoom out"
      >
        <ZoomOut className={`w-3 h-3 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`} />
      </button>
      <button
        onClick={onReset}
        className={`px-1.5 py-1 text-[9px] font-mono transition-colors min-w-[36px] ${
          isLight
            ? 'text-zinc-500 hover:bg-zinc-100 border-x border-zinc-200'
            : 'text-zinc-400 hover:bg-zinc-700 border-x border-zinc-700'
        }`}
        style={{ fontFamily: brand?.monoFamily }}
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        onClick={onZoomIn}
        disabled={zoom >= zoomLevels[zoomLevels.length - 1]}
        className={`p-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-r-md ${
          isLight ? 'hover:bg-zinc-100' : 'hover:bg-zinc-700'
        }`}
        title="Zoom in"
      >
        <ZoomIn className={`w-3 h-3 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`} />
      </button>
    </div>
  )
}

// ============================================
// MiniMap
// ============================================

interface MiniMapProps {
  nodes: Record<string, NodePosition>
  nodeData: Record<string, NodeData>
  layout: { width: number; height: number }
  themeColors: Theme['light'] | Theme['dark']
  brand?: BrandSpec
  mode: DiagramMode
  /** Distance (px) from the bottom and left edges. */
  inset?: number
}

const MINIMAP_WIDTH = 132

/** Rendered minimap height, so neighbouring chrome can stack clear of it. */
export function minimapHeight(layout: { width: number; height: number }): number {
  return Math.max(56, Math.min(120, Math.round((layout.height / layout.width) * MINIMAP_WIDTH)))
}

function MiniMap({ nodes, nodeData, layout, themeColors, brand, mode, inset = 12 }: MiniMapProps) {
  const isLight = mode === 'light'
  const W = MINIMAP_WIDTH
  const H = minimapHeight(layout)
  const sx = W / layout.width
  const sy = H / layout.height
  const square = brand?.nodeRadius === '0px'

  return (
    <div
      className={`absolute z-10 backdrop-blur-sm overflow-hidden ${
        isLight ? 'bg-white/90 border border-zinc-200 shadow-sm' : 'bg-zinc-900/90 border border-zinc-700'
      }`}
      style={{ bottom: inset, left: inset, width: W, height: H, borderRadius: brand?.nodeRadius }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {Object.entries(nodes).map(([id, n]) => {
          const sz = NODE_SIZES[n.size]
          if (!sz) return null
          const stroke = themeColors.palette[nodeData[id]?.color]?.stroke || themeColors.palette.zinc.stroke
          return (
            <rect
              key={id}
              x={n.x * sx}
              y={n.y * sy}
              width={Math.max(4, sz.width * sx)}
              height={Math.max(3, sz.height * sy)}
              rx={square ? 0 : 1}
              fill={stroke}
              fillOpacity={0.82}
            />
          )
        })}
      </svg>
    </div>
  )
}

// ============================================
// Legend
// ============================================

interface LegendProps {
  /** Only styles actually used by a connector are listed. */
  styles: Record<string, ConnectorStyle>
  connectors: Connector[]
  groups: GroupShape[]
  themeColors: Theme['light'] | Theme['dark']
  brand?: BrandSpec
  mode: DiagramMode
  left: number
  bottom: number
}

/**
 * A key for the diagram's edge types (and group boundaries, when labelled).
 * Read-only chrome: it never intercepts pointer events.
 */
function DiagramLegend({ styles, connectors, groups, themeColors, brand, mode, left, bottom }: LegendProps) {
  const isLight = mode === 'light'
  const mono = brand?.monoFamily || "'JetBrains Mono', ui-monospace, monospace"

  // Only keys that appear in the drawing, in first-use order.
  const used: string[] = []
  for (const c of connectors) if (styles[c.style] && !used.includes(c.style)) used.push(c.style)

  const rows = used.map(key => ({ key, style: styles[key] }))
  const groupRows = groups.filter(g => !!g.label)

  if (!rows.length && !groupRows.length) return null

  const stroke = (color: DiagramColor) =>
    themeColors.palette[color]?.stroke || themeColors.palette.zinc.stroke

  return (
    <div
      data-arc-legend
      className="absolute z-10 backdrop-blur-sm"
      style={{
        left,
        bottom,
        // A key with many styles and named groups can outgrow a short frame.
        // Scroll it rather than let the frame cut the last rows off — which
        // reads as a rendering fault, not as "there is more".
        maxHeight: `calc(100% - ${bottom + 8}px)`,
        overflowY: 'auto',
        padding: '7px 9px',
        border: `1px solid ${isLight ? 'rgba(24,24,27,0.14)' : 'rgba(244,244,245,0.14)'}`,
        borderRadius: brand?.nodeRadius ?? 6,
        background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(9,9,11,0.88)',
        boxShadow: isLight ? '0 8px 24px rgba(24,24,27,0.08)' : '0 8px 24px rgba(0,0,0,0.24)',
        fontFamily: mono,
      }}
    >
      <div
        className={`text-[8.5px] tracking-[0.18em] ${themeColors.text.muted}`}
        style={{ marginBottom: 5 }}
      >
        KEY
      </div>
      <div className="flex flex-col" style={{ gap: 4 }}>
        {rows.map(({ key, style }) => (
          <div key={key} className="flex items-center" style={{ gap: 7 }}>
            <svg width={20} height={7} aria-hidden="true">
              <line
                x1={0}
                y1={3.5}
                x2={20}
                y2={3.5}
                stroke={stroke(style.color)}
                strokeWidth={Math.max(1.5, Math.min(3, style.strokeWidth))}
                strokeDasharray={style.dashed ? '3 2.5' : undefined}
                strokeLinecap="round"
              />
            </svg>
            <span className={`text-[9.5px] ${themeColors.text.secondary}`}>
              {style.label || key}
            </span>
          </div>
        ))}
        {groupRows.map(g => (
          <div key={g.id} className="flex items-center" style={{ gap: 7 }}>
            <svg width={20} height={9} aria-hidden="true">
              <rect
                x={0.75}
                y={0.75}
                width={18.5}
                height={7.5}
                rx={g.type === 'circle' ? 3.75 : 1.5}
                fill="none"
                stroke={stroke(g.color)}
                strokeWidth={1.25}
                strokeDasharray={g.dashed === false ? undefined : '3 2.5'}
              />
            </svg>
            <span className={`text-[9.5px] ${themeColors.text.secondary}`}>{g.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// .arc View & Controls
// ============================================

function generateSource(data: ArcDiagramData): string {
  const clean = {
    id: data.id,
    layout: data.layout,
    nodes: data.nodes,
    nodeData: data.nodeData,
    connectors: data.connectors,
    connectorStyles: data.connectorStyles,
    ...(data.focusTargets ? { focusTargets: data.focusTargets } : {}),
  }
  const json = JSON.stringify(clean, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'")

  return `import type { ArcDiagramData } from '@arach/arc'\n\nconst diagram: ArcDiagramData = ${json}\n\nexport default diagram\n`
}

function ArcSourceView({ source, mode }: {
  source: string
  mode: DiagramMode
}) {
  const isLight = mode === 'light'
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(source).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [source])

  const { Copy, Check } = LucideIcons

  return (
    <div className="absolute inset-0 overflow-auto z-[5]" style={{
      backgroundColor: isLight ? 'rgba(250,250,250,0.97)' : 'rgba(9,9,11,0.97)',
    }}>
      <div className="flex items-center justify-end gap-1 px-4 pt-3">
        <button
          onClick={handleCopy}
          className={`p-1 rounded transition-colors ${
            isLight
              ? 'hover:bg-zinc-200/60 text-zinc-400'
              : 'hover:bg-zinc-700/60 text-zinc-500'
          }`}
          title={copied ? 'Copied!' : 'Copy'}
        >
          {copied
            ? <Check className="w-3 h-3 text-emerald-500" />
            : <Copy className="w-3 h-3" />
          }
        </button>
      </div>
      <pre
        className={`px-5 pb-5 pt-2 text-[11px] leading-relaxed font-mono whitespace-pre ${
          isLight ? 'text-zinc-600' : 'text-zinc-400'
        }`}
        style={{ fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace', tabSize: 2 }}
      >
        {source}
      </pre>
    </div>
  )
}

function ViewToggle({ showArc, onToggle, mode, inset = 12 }: {
  showArc: boolean
  onToggle: () => void
  mode: DiagramMode
  inset?: number
}) {
  const isLight = mode === 'light'
  const { Braces, Layers } = LucideIcons

  return (
    <button
      onClick={onToggle}
      style={{ top: inset, right: inset }}
      className={`absolute flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-sm z-10 text-[10px] font-mono transition-colors ${
        isLight
          ? 'bg-white/90 border border-zinc-200 shadow-sm text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
          : 'bg-zinc-900/90 border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
      }`}
      title={showArc ? 'Back to diagram' : 'View source'}
    >
      {showArc
        ? <><Layers className="w-3 h-3" /> Diagram</>
        : <><Braces className="w-3 h-3" /> Source</>
      }
    </button>
  )
}

function AutoLayoutButton({ active, onToggle, mode, inset = 12 }: {
  active: boolean
  onToggle: () => void
  mode: DiagramMode
  inset?: number
}) {
  const isLight = mode === 'light'
  const { Wand2 } = LucideIcons

  return (
    <button
      onClick={onToggle}
      style={{ top: inset, left: inset }}
      className={`absolute flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-sm z-10 text-[10px] font-mono transition-colors ${
        active
          ? isLight
            ? 'bg-violet-50 border border-violet-200 text-violet-600 shadow-sm'
            : 'bg-violet-950/80 border border-violet-700 text-violet-400'
          : isLight
            ? 'bg-white/90 border border-zinc-200 shadow-sm text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
            : 'bg-zinc-900/90 border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
      }`}
      title={active ? 'Reset to original layout' : 'Auto-layout nodes'}
    >
      <Wand2 className="w-3 h-3" /> Auto
    </button>
  )
}

// ============================================
// Main Component
// ============================================

// Grid motif rendered into an SVG <pattern> — varies the background grid system.
function gridMotif(type: BrandSpec['gridType'], s: number, color: string) {
  const c = s / 2
  if (type === 'lines') return <path d={`M ${s} 0 L 0 0 L 0 ${s}`} stroke={color} strokeWidth={1} fill="none" />
  if (type === 'crosshair') {
    const r = 3, tk = 2
    // Center plus + 1px registration ticks at the four cell-edge midpoints, so
    // cells read as a ruled reticle rather than scattered dots.
    return (
      <>
        <path d={`M ${c} ${c - r} L ${c} ${c + r} M ${c - r} ${c} L ${c + r} ${c}`} stroke={color} strokeWidth={1} />
        <path d={`M ${c} 0 L ${c} ${tk} M ${c} ${s} L ${c} ${s - tk} M 0 ${c} L ${tk} ${c} M ${s} ${c} L ${s - tk} ${c}`} stroke={color} strokeWidth={1} opacity={0.5} />
      </>
    )
  }
  return <circle cx={1} cy={1} r={1} fill={color} />
}

// Edge/frame treatments drawn as an inset overlay with a consistent margin, so
// the treatment reads as a deliberate frame rather than floating inside the
// container border (the container border is suppressed when one of these is active).
const FRAME_INSET = 12 // px margin/padding from the diagram edge

function DiagramFrame({ variant, color }: { variant: NonNullable<BrandSpec['frame']>; color: string }) {
  if (variant === 'hairline' || variant === 'none') return null
  const m = FRAME_INSET

  if (variant === 'inset') {
    return <div className="absolute pointer-events-none z-[6]" style={{ inset: m, border: `1px solid ${color}` }} />
  }

  if (variant === 'brackets') {
    // Flush at the diagram's boundary corners (no inset, no competing border).
    const len = 26, wt = 2
    const c = (extra: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', width: len, height: len, ...extra })
    return (
      <div className="absolute inset-0 pointer-events-none z-[6]">
        <div style={c({ top: 0, left: 0, borderTop: `${wt}px solid ${color}`, borderLeft: `${wt}px solid ${color}` })} />
        <div style={c({ top: 0, right: 0, borderTop: `${wt}px solid ${color}`, borderRight: `${wt}px solid ${color}` })} />
        <div style={c({ bottom: 0, left: 0, borderBottom: `${wt}px solid ${color}`, borderLeft: `${wt}px solid ${color}` })} />
        <div style={c({ bottom: 0, right: 0, borderBottom: `${wt}px solid ${color}`, borderRight: `${wt}px solid ${color}` })} />
      </div>
    )
  }

  if (variant === 'ticks') {
    const gap = 16
    const vert = `repeating-linear-gradient(to right, ${color} 0 1px, transparent 1px ${gap}px)`
    const horiz = `repeating-linear-gradient(to bottom, ${color} 0 1px, transparent 1px ${gap}px)`
    const e = (img: string, extra: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', backgroundImage: img, ...extra })
    return (
      <div className="absolute pointer-events-none z-[6]" style={{ inset: m, border: `1px solid ${color}33` }}>
        <div style={e(vert, { top: -3, left: 0, right: 0, height: 6 })} />
        <div style={e(vert, { bottom: -3, left: 0, right: 0, height: 6 })} />
        <div style={e(horiz, { top: 0, bottom: 0, left: -3, width: 6 })} />
        <div style={e(horiz, { top: 0, bottom: 0, right: -3, width: 6 })} />
      </div>
    )
  }

  if (variant === 'corners') {
    // Full, closed L-brackets at each corner — thin drafting-sheet treatment,
    // inset from the edge so the content reads as framed within a sheet.
    const len = 24, wt = 1
    const c = (extra: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', width: len, height: len, ...extra })
    return (
      <div className="absolute pointer-events-none z-[6]" style={{ inset: m }}>
        <div style={c({ top: 0, left: 0, borderTop: `${wt}px solid ${color}`, borderLeft: `${wt}px solid ${color}` })} />
        <div style={c({ top: 0, right: 0, borderTop: `${wt}px solid ${color}`, borderRight: `${wt}px solid ${color}` })} />
        <div style={c({ bottom: 0, left: 0, borderBottom: `${wt}px solid ${color}`, borderLeft: `${wt}px solid ${color}` })} />
        <div style={c({ bottom: 0, right: 0, borderBottom: `${wt}px solid ${color}`, borderRight: `${wt}px solid ${color}` })} />
      </div>
    )
  }

  if (variant === 'sheet') {
    // Full drafting-sheet border: a crisp rectangle inset from the edge, with a
    // faint inner rule a few px inside for the classic double-line drawing border.
    // Everything reads as framed on a sheet, with the title block seated in a corner.
    return (
      <div className="absolute pointer-events-none z-[6]" style={{ inset: m }}>
        <div className="absolute inset-0" style={{ border: `1px solid ${color}` }} />
        <div className="absolute" style={{ inset: 4, border: `1px solid ${color}`, opacity: 0.35 }} />
      </div>
    )
  }

  if (variant === 'cropmarks') {
    // Classic open-corner trim marks: a short tick on each edge near each corner,
    // leaving the corner itself open. Symmetric and pinned to the edges.
    const gap = 8, len = 14, wt = 1
    const seg = (s: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', background: color, ...s })
    return (
      <div className="absolute pointer-events-none z-[6]" style={{ inset: FRAME_INSET }}>
        <div style={seg({ top: 0, left: gap, width: len, height: wt })} />
        <div style={seg({ top: gap, left: 0, width: wt, height: len })} />
        <div style={seg({ top: 0, right: gap, width: len, height: wt })} />
        <div style={seg({ top: gap, right: 0, width: wt, height: len })} />
        <div style={seg({ bottom: 0, left: gap, width: len, height: wt })} />
        <div style={seg({ bottom: gap, left: 0, width: wt, height: len })} />
        <div style={seg({ bottom: 0, right: gap, width: len, height: wt })} />
        <div style={seg({ bottom: gap, right: 0, width: wt, height: len })} />
      </div>
    )
  }

  if (variant === 'reticle') {
    // Calibrated bezel: flush corner brackets + centered edge registration ticks +
    // a faint inset rule. FRAME_INSET (12px) is exactly half the 24px grid cell, so
    // the inset bezel lands on grid lines — intentional alignment with the reticle grid.
    const len = 26, wt = 1.5, tick = 8, tw = 1
    const c = (extra: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', width: len, height: len, ...extra })
    const t = (extra: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', background: color, ...extra })
    return (
      <div className="absolute inset-0 pointer-events-none z-[6]">
        <div className="absolute" style={{ inset: m, border: `1px solid ${color}`, opacity: 0.35 }} />
        <div style={c({ top: 0, left: 0, borderTop: `${wt}px solid ${color}`, borderLeft: `${wt}px solid ${color}` })} />
        <div style={c({ top: 0, right: 0, borderTop: `${wt}px solid ${color}`, borderRight: `${wt}px solid ${color}` })} />
        <div style={c({ bottom: 0, left: 0, borderBottom: `${wt}px solid ${color}`, borderLeft: `${wt}px solid ${color}` })} />
        <div style={c({ bottom: 0, right: 0, borderBottom: `${wt}px solid ${color}`, borderRight: `${wt}px solid ${color}` })} />
        <div style={t({ top: 0, left: '50%', width: tw, height: tick, transform: 'translateX(-50%)' })} />
        <div style={t({ bottom: 0, left: '50%', width: tw, height: tick, transform: 'translateX(-50%)' })} />
        <div style={t({ left: 0, top: '50%', width: tick, height: tw, transform: 'translateY(-50%)' })} />
        <div style={t({ right: 0, top: '50%', width: tick, height: tw, transform: 'translateY(-50%)' })} />
      </div>
    )
  }

  return null
}

/** Content for the engineering-drawing title block (Engineering theme). */
export interface TitleBlockInfo {
  /** Project / drawing title shown in the top strip. */
  title?: string
  /** Drawing number. Defaults to the diagram label (data.id). */
  drawing?: string
  /** Scale field. Default 'NTS'. */
  scale?: string
  /** Revision field. Default 'A'. */
  rev?: string
  /** Sheet field. Default '1 / 1'. */
  sheet?: string
}

// Engineering-drawing title block, pinned to the bottom-right of the sheet.
// `bottom` is raised when zoom controls share the corner, so it stacks above them.
function TitleBlock({ info, mode, mono, bottom = 16, right = 16, onHeight }: { info: Required<TitleBlockInfo>; mode: DiagramMode; mono?: string; bottom?: number; right?: number; onHeight?: (h: number) => void }) {
  const isLight = mode === 'light'
  const line = isLight ? 'rgba(20,20,20,0.45)' : 'rgba(220,226,235,0.36)'
  const label = isLight ? 'rgba(20,20,20,0.5)' : 'rgba(205,214,228,0.5)'
  const value = isLight ? 'rgba(16,20,26,0.9)' : 'rgba(236,240,246,0.92)'
  const font = mono || "'JetBrains Mono', ui-monospace, monospace"
  const cells: [string, string][] = [
    ['DWG NO', info.drawing],
    ['SCALE', info.scale],
    ['REV', info.rev],
    ['SHEET', info.sheet],
  ]
  // Report the rendered height so neighbouring chrome (the zoom controls) can
  // position itself clear of the title block, re-measuring on font load / resize.
  const ref = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el || !onHeight) return
    onHeight(el.offsetHeight)
    const ro = new ResizeObserver(() => onHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [onHeight])
  return (
    <div
      ref={ref}
      className="absolute z-10 pointer-events-none"
      style={{
        right, bottom, fontFamily: font,
        border: `1px solid ${line}`,
        background: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(10,14,20,0.5)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div style={{ padding: '4px 10px', borderBottom: `1px solid ${line}`, color: value, fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {info.title}
      </div>
      <div style={{ display: 'flex' }}>
        {cells.map(([k, v], i) => (
          <div key={k} style={{ padding: '3px 10px 4px', borderLeft: i === 0 ? 'none' : `1px solid ${line}` }}>
            <div style={{ color: label, fontSize: 6.5, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{k}</div>
            <div style={{ color: value, fontSize: 10.5, letterSpacing: '0.03em', marginTop: 1, whiteSpace: 'nowrap' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export type LabelCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface ArcDiagramProps {
  data: ArcDiagramData
  className?: string
  interactive?: boolean  // Enable zoom/pan controls
  mode?: DiagramMode     // Light/dark appearance
  theme?: ThemeId        // Color palette theme
  /** Override the diagram label. Defaults to data.id */
  label?: string
  /** Which corner the label sits in. Default: 'top-left'. Zoom controls auto-avoid it. */
  labelPosition?: LabelCorner
  /** Initial zoom level. Use 'fit' to auto-fit content, or a number (e.g., 0.75). Default: 1 */
  defaultZoom?: number | 'fit'
  /** Max zoom when defaultZoom='fit'. E.g., 0.85 caps fit at 85%. Default: 1 */
  maxFitZoom?: number
  /** Custom zoom level steps. Default: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] */
  zoomLevels?: number[]
  /** Show the .arc source toggle button. Default: true */
  showArcToggle?: boolean
  /** Show the auto-layout button. Default: false */
  showAutoLayout?: boolean
  /** Show zoom controls even when not interactive (branded reader chrome). Default: follows `interactive` */
  showControls?: boolean
  /** Show a minimap overview (bottom-left). Default: false */
  showMinimap?: boolean
  /** Show a key for the connector styles and labelled groups (bottom-left). Default: false */
  showLegend?: boolean
  /** Show the active focus target's caption and steps. Default: false */
  showFocusStory?: boolean
  /** Override the edge/frame treatment (else the theme's brand.frame). */
  frame?: BrandSpec['frame']
  /** Control hover behavior. true = all effects (default), false = none, object = granular control */
  hoverEffects?: boolean | HoverEffectsConfig
  /** Called when a node is hovered/clicked (nodeId) or released (null) */
  onNodeHover?: (nodeId: string | null) => void
  /** Override the engineering title-block fields (shown when the theme opts in). */
  titleBlock?: TitleBlockInfo
  /** Render the diagram in isometric projection. Default: '2d' */
  defaultViewMode?: ViewMode
  /** Isometric render style — 'solid' | 'blueprint' | 'cyanotype'. Default: 'solid' */
  defaultIsoStyle?: IsoStyleId
}

export default function ArcDiagram({
  data,
  className = '',
  interactive = true,
  mode = 'dark',
  theme = 'default',
  label,
  labelPosition = 'top-left',
  defaultZoom = 1,
  zoomLevels = DEFAULT_ZOOM_LEVELS,
  showArcToggle = true,
  showAutoLayout = false,
  showControls,
  showMinimap = false,
  showLegend = false,
  showFocusStory = false,
  frame,
  hoverEffects,
  onNodeHover,
  titleBlock,
  maxFitZoom = 1,
  defaultViewMode = '2d',
  defaultIsoStyle = 'solid',
}: ArcDiagramProps) {
  const isLight = mode === 'light'
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [showArc, setShowArc] = useState(false)
  const [useAutoLayout, setUseAutoLayout] = useState(false)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [lockedNodeId, setLockedNodeId] = useState<string | null>(null)
  // Measured title-block height, so the zoom controls can slide clear of it.
  const [titleBlockH, setTitleBlockH] = useState(48)
  const fx = useMemo(() => resolveHoverEffects(hoverEffects), [hoverEffects])

  // Active node = locked takes priority over hovered
  const activeNodeId = fx.enabled ? (lockedNodeId ?? hoveredNodeId) : null

  // Apply auto-layout if toggled
  const activeData = useMemo(
    () => useAutoLayout ? autoLayout(data) : data,
    [data, useAutoLayout],
  )

  const { id, layout, nodes, nodeData, connectors, connectorStyles, groups = [] } = activeData
  const focusTargets = activeData.focusTargets
  const activeFocusTarget = activeNodeId ? focusTargets?.[activeNodeId] : undefined
  const focusState = useMemo(
    () => resolveFocusState(activeNodeId, connectors, focusTargets),
    [activeNodeId, connectors, focusTargets],
  )

  // Resolve theme colors based on mode
  const themeData = getTheme(theme)
  const themeColors = isLight ? themeData.light : themeData.dark
  const brand = themeData.brand
  const gridId = React.useId()
  const frameVariant = frame ?? brand?.frame ?? 'hairline'

  // Isometric projection — mirrors the editor canvas composition (origin at the
  // layout's bottom-center), but without selection state.
  const isIso = defaultViewMode === 'isometric'
  const isoStyle = getIsoStyle(defaultIsoStyle)
  const isoOriginX = layout.width / 2
  const isoOriginY = layout.height - 100
  const isoBounds = useMemo(() => {
    if (!isIso) return null
    if (isoStyle.technical) {
      return isoPlateBounds(nodes, nodeData, isoOriginX, isoOriginY, layout)
    }
    const bounds = isoContentBounds(nodes, nodeData, isoOriginX, isoOriginY)
    if (!bounds) return null
    const pad = 60
    return { minX: bounds.minX - pad, minY: bounds.minY - pad, maxX: bounds.maxX + pad, maxY: bounds.maxY + pad }
  }, [isIso, isoStyle.technical, nodes, nodeData, isoOriginX, isoOriginY, layout])

  // Inject the brand font stylesheet once (only for themes that set a fontImport).
  React.useEffect(() => {
    const href = brand?.fontImport
    if (!href || typeof document === 'undefined') return
    if (document.querySelector(`link[data-arc-font="${href}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.setAttribute('data-arc-font', href)
    document.head.appendChild(link)
  }, [brand?.fontImport])

  // Generate source from the active (possibly auto-laid-out) data
  const sourceCode = useMemo(() => generateSource(activeData), [activeData])

  // Calculate 'fit' zoom based on container size
  const calculateFitZoom = useCallback(() => {
    if (!containerRef.current) return 1
    const container = containerRef.current
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    // Add padding for chrome (zoom controls, label)
    const padding = 40
    // Isometric drawings spill outside the 2D layout rect — fit the projected bounds.
    if (isIso && isoBounds) {
      const boundsWidth = isoBounds.maxX - isoBounds.minX
      const boundsHeight = isoBounds.maxY - isoBounds.minY
      if (boundsWidth > 0 && boundsHeight > 0) {
        return Math.min((containerWidth - padding) / boundsWidth, (containerHeight - padding) / boundsHeight, maxFitZoom)
      }
    }
    const fitX = (containerWidth - padding) / layout.width
    const fitY = (containerHeight - padding) / layout.height
    // Use the smaller ratio to fit both dimensions, cap at maxFitZoom
    return Math.min(fitX, fitY, maxFitZoom)
  }, [isIso, isoBounds, layout.width, layout.height, maxFitZoom])

  // Determine initial zoom
  const getInitialZoom = useCallback(() => {
    if (defaultZoom === 'fit') {
      return calculateFitZoom()
    }
    return defaultZoom
  }, [defaultZoom, calculateFitZoom])

  // Zoom & pan state — use defaultZoom immediately for numeric values to avoid flash
  const [zoom, setZoom] = useState(typeof defaultZoom === 'number' ? defaultZoom : 1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [initialized, setInitialized] = useState(typeof defaultZoom === 'number')

  // Set initial zoom after mount (needed for 'fit' to measure container)
  React.useEffect(() => {
    if (!initialized) {
      const nextZoom = getInitialZoom()
      setZoom(nextZoom)
      // Centre the isometric drawing in its container once the fit zoom is known.
      if (isIso && isoBounds && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setPan({
          x: rect.width / 2 - ((isoBounds.minX + isoBounds.maxX) / 2) * nextZoom,
          y: rect.height / 2 - ((isoBounds.minY + isoBounds.maxY) / 2) * nextZoom,
        })
      }
      setInitialized(true)
    }
  }, [initialized, getInitialZoom, isIso, isoBounds])

  // Numeric defaultZoom skips the init effect above, so centre the isometric
  // drawing separately (2D content sits at the origin; the iso projection
  // spreads around the bottom-centre origin and can spill outside the rect).
  React.useEffect(() => {
    if (!isIso || !isoBounds || typeof defaultZoom !== 'number' || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setPan({
      x: rect.width / 2 - ((isoBounds.minX + isoBounds.maxX) / 2) * defaultZoom,
      y: rect.height / 2 - ((isoBounds.minY + isoBounds.maxY) / 2) * defaultZoom,
    })
  }, [isIso, isoBounds, defaultZoom])

  // Sorted zoom levels for consistent navigation
  const sortedZoomLevels = React.useMemo(() => [...zoomLevels].sort((a, b) => a - b), [zoomLevels])

  const handleZoomIn = useCallback(() => {
    setZoom(z => {
      const idx = sortedZoomLevels.findIndex(l => l >= z)
      return sortedZoomLevels[Math.min(idx + 1, sortedZoomLevels.length - 1)]
    })
  }, [sortedZoomLevels])

  const handleZoomOut = useCallback(() => {
    setZoom(z => {
      const idx = sortedZoomLevels.findIndex(l => l >= z)
      return sortedZoomLevels[Math.max(idx - 1, 0)]
    })
  }, [sortedZoomLevels])

  const handleReset = useCallback(() => {
    const nextZoom = getInitialZoom()
    setZoom(nextZoom)
    if (isIso && isoBounds && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setPan({
        x: rect.width / 2 - ((isoBounds.minX + isoBounds.maxX) / 2) * nextZoom,
        y: rect.height / 2 - ((isoBounds.minY + isoBounds.maxY) / 2) * nextZoom,
      })
    } else {
      setPan({ x: 0, y: 0 })
    }
  }, [getInitialZoom, isIso, isoBounds])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!interactive) return
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      if (e.deltaY < 0) handleZoomIn()
      else handleZoomOut()
    }
  }, [interactive, handleZoomIn, handleZoomOut])

  // Click-to-lock: clicking a node locks the highlight, clicking background or same node unlocks
  const handleNodeClick = useCallback((nodeId: string) => {
    setLockedNodeId(prev => {
      const next = prev === nodeId ? null : nodeId
      onNodeHover?.(next)
      return next
    })
  }, [onNodeHover])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!interactive) return
    // Clicking background clears locked node
    if (lockedNodeId && (e.target as HTMLElement).closest('[data-arc-node]') === null) {
      setLockedNodeId(null)
      onNodeHover?.(null)
    }
    setIsPanning(true)
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }, [interactive, pan, lockedNodeId, onNodeHover])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    })
  }, [isPanning, panStart])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Displayed label: prop overrides data.id
  const displayLabel = label ?? id

  // Chrome inset: when a full-rectangle frame border is drawn, the floating
  // chrome (source toggle, minimap, label, zoom, title block) sits INSIDE the
  // border with a gap instead of welding to the container edge. Otherwise it
  // hugs the edge at the usual 12px.
  const borderedFrame = frameVariant === 'sheet' || frameVariant === 'inset'
  const chromeInset = borderedFrame ? 28 : 12

  const showTitleBlock = !!brand?.titleBlock && !showArc
  const showLabel = !!displayLabel && !brand?.titleBlock
  const zoomShown = (interactive || showControls) && !showArc

  // The bottom-right corner belongs to "content" — the title block (a drawing
  // element) or a bottom-right label — which anchors there. The zoom controls
  // are utility chrome: they're the ones that yield, sliding up to clear that
  // content (measured height for the title block, ~one line for a label).
  const brLabel = showLabel && labelPosition === 'bottom-right'
  const cornerContentH = showTitleBlock ? titleBlockH : (brLabel ? 14 : 0)
  const zoomBottom = chromeInset + (zoomShown && cornerContentH ? cornerContentH + 10 : 0)

  // Declarative label placement resolved to pixel offsets (respects the frame inset).
  const labelStyle: React.CSSProperties = {
    ...(labelPosition.includes('top') ? { top: chromeInset } : { bottom: chromeInset }),
    ...(labelPosition.includes('left') ? { left: chromeInset } : { right: chromeInset }),
  }

  return (
    <div
      ref={containerRef}
      data-arc-diagram
      className={`rounded-2xl overflow-hidden relative ${themeColors.background.container} ${className}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: interactive ? (isPanning ? 'grabbing' : 'grab') : 'default', fontFamily: brand?.fontFamily, borderRadius: brand?.nodeRadius, borderColor: frameVariant !== 'hairline' && frameVariant !== 'none' ? 'transparent' : undefined }}
    >
      {/* Paper stock fills the whole surface for the technical isometric styles;
          its graph grid is pinned to the panned/zoomed drawing underneath. */}
      {isIso && isoStyle.technical && (
        <TechnicalBackdrop style={isoStyle} pan={pan} zoom={zoom} />
      )}

      <div
        className="relative transition-transform duration-150 ease-out"
        style={{
          width: layout.width,
          height: layout.height,
          minWidth: layout.width,
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'top left',
        }}
      >
        {/* Grid background - extends beyond content for pan */}
        {brand?.gridType !== 'none' && !(isIso && isoStyle.technical) && (
          <svg
            className="absolute pointer-events-none"
            style={{
              top: -2000,
              left: -2000,
              width: layout.width + 4000,
              height: layout.height + 4000,
              opacity: themeColors.background.grid.opacity,
            }}
          >
            <defs>
              <pattern id={gridId} width={themeColors.background.grid.size} height={themeColors.background.grid.size} patternUnits="userSpaceOnUse">
                {gridMotif(brand?.gridType, themeColors.background.grid.size, themeColors.background.grid.color)}
              </pattern>
              {brand?.gridType === 'crosshair' && (() => {
                // Major graticule at 5× the cell — a longer, heavier crosshair every
                // fifth line for a minor/major rhythm. Origin-aligned so major marks
                // land on minor crosshair centers. Crosshair-only; other grids untouched.
                const M = themeColors.background.grid.size * 5, C = M / 2, r = 5
                return (
                  <pattern id={`${gridId}-major`} width={M} height={M} patternUnits="userSpaceOnUse">
                    <path d={`M ${C} ${C - r} L ${C} ${C + r} M ${C - r} ${C} L ${C + r} ${C}`} stroke={themeColors.background.grid.color} strokeWidth={1} />
                  </pattern>
                )
              })()}
            </defs>
            <rect width="100%" height="100%" fill={`url(#${gridId})`} />
            {brand?.gridType === 'crosshair' && <rect width="100%" height="100%" fill={`url(#${gridId}-major)`} />}
          </svg>
        )}

        {isIso ? (
          <>
            {/* Drafting plate: frame, component index, title block */}
            {isoStyle.technical && isoBounds && (
              <TechnicalPlate
                style={isoStyle}
                plate={isoBounds}
                rows={Object.entries(buildNodeIndex(nodes, nodeData))
                  .sort(([, a], [, b]) => (a as number) - (b as number))
                  .map(([nodeId, n]) => ({
                    n: n as number,
                    name: nodeData[nodeId]?.name || nodeId,
                    subtitle: nodeData[nodeId]?.subtitle,
                    color: nodeData[nodeId]?.color,
                  }))}
                title={titleBlock?.title ?? displayLabel}
                tally={`${String(Object.keys(nodeData).length).padStart(2, '0')} CMP / ${String(connectors.length).padStart(2, '0')} LNK`}
              />
            )}

            {/* Isometric connectors (the iso layer ignores `curve` — it draws
                its own 3D-aware runs) */}
            <IsometricConnectorLayer
              nodes={nodes}
              nodeData={nodeData}
              connectors={connectors as EditorConnector[]}
              connectorStyles={connectorStyles}
              selectedConnectorIndex={null}
              originX={isoOriginX}
              originY={isoOriginY}
              isoStyle={isoStyle}
            />

            {/* Isometric nodes */}
            <IsometricNodeLayer
              nodes={nodes}
              nodeData={nodeData}
              selectedNodeIds={[]}
              originX={isoOriginX}
              originY={isoOriginY}
              isoStyle={isoStyle}
              brand={brand}
            />
          </>
        ) : (
          <>
            {/* Group boundaries sit behind connectors and nodes. */}
            <DiagramGroups groups={groups} themeColors={themeColors} />

            {/* Connectors */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${layout.width} ${layout.height}`}
            >
              {connectors.map((conn, i) => {
                const isConnected = activeNodeId != null && focusState.connectorIndexes.has(i)
                return (
                  <ConnectorPath
                    key={i}
                    connector={conn}
                    connectorIndex={i}
                    nodes={nodes}
                    styles={connectorStyles}
                    themeColors={themeColors}
                    brand={brand}
                    highlighted={fx.highlightEdges && isConnected}
                    dimmed={fx.dim && activeNodeId != null && !isConnected}
                    dimOpacity={fx.connectorDimOpacity}
                  />
                )
              })}
            </svg>

            {/* Nodes */}
            {Object.entries(nodes).map(([nodeId, node]) => {
              const nd = nodeData[nodeId]
              if (!nd) return null
              const isActive = activeNodeId === nodeId
              const isInFocus = focusState.nodeIds.has(nodeId)
              return (
                <Node
                  key={nodeId}
                  node={node}
                  data={nd}
                  mode={mode}
                  themeColors={themeColors}
                  brand={brand}
                  hovered={isActive}
                  dimmed={fx.dim && activeNodeId != null && !isInFocus}
                  lift={fx.lift}
                  glow={fx.glow}
                  dimOpacity={fx.dimOpacity}
                  onMouseEnter={() => { if (!lockedNodeId) { setHoveredNodeId(nodeId); onNodeHover?.(nodeId) } }}
                  onMouseLeave={() => { if (!lockedNodeId) { setHoveredNodeId(null); onNodeHover?.(null) } }}
                  onClick={() => handleNodeClick(nodeId)}
                />
              )
            })}
          </>
        )}
      </div>

      {/* Viewer chrome - fixed position regardless of zoom/pan */}

      {/* Edge/frame treatment at the diagram boundary — the technical plate
          draws its own frame, so skip it there */}
      {!isIso && (
        <DiagramFrame variant={frameVariant} color={isLight ? 'rgba(20,20,20,0.55)' : 'rgba(230,230,235,0.55)'} />
      )}

      {/* Engineering title block - bottom right (theme opt-in) */}
      {brand?.titleBlock && !showArc && !(isIso && isoStyle.technical) && (
        <TitleBlock
          mode={mode}
          mono={brand.monoFamily}
          right={chromeInset}
          bottom={chromeInset}
          onHeight={setTitleBlockH}
          info={{
            title: titleBlock?.title ?? 'System Architecture',
            drawing: titleBlock?.drawing ?? displayLabel ?? '—',
            scale: titleBlock?.scale ?? 'NTS',
            rev: titleBlock?.rev ?? 'A',
            sheet: titleBlock?.sheet ?? '1 / 1',
          }}
        />
      )}


      {/* .arc source overlay */}
      {showArc && (
        <ArcSourceView source={sourceCode} mode={mode} />
      )}

      {!showArc && showFocusStory && activeFocusTarget && (
        <FocusStory
          target={activeFocusTarget}
          mode={mode}
          inset={chromeInset}
          monoFamily={brand?.monoFamily}
        />
      )}

      {/* .arc toggle - top right */}
      {showArcToggle && (
        <ViewToggle
          showArc={showArc}
          onToggle={() => setShowArc(s => !s)}
          mode={mode}
          inset={chromeInset}
        />
      )}

      {/* Auto-layout button - top left */}
      {showAutoLayout && !showArc && (
        <AutoLayoutButton
          active={useAutoLayout}
          onToggle={() => setUseAutoLayout(v => !v)}
          mode={mode}
          inset={chromeInset}
        />
      )}

      {/* Diagram label - bottom left (hidden when the title block already shows the drawing no.) */}
      {showLabel && (
        <div
          className={`absolute font-mono text-[9px] tracking-wider z-10 ${themeColors.text.muted}`}
          style={{ fontFamily: brand?.monoFamily, ...labelStyle }}
        >
          {displayLabel}
        </div>
      )}

      {/* Key - bottom left, stacked above the minimap when both are shown */}
      {showLegend && !showArc && (
        <DiagramLegend
          styles={connectorStyles}
          connectors={connectors}
          groups={groups}
          themeColors={themeColors}
          brand={brand}
          mode={mode}
          left={chromeInset}
          bottom={chromeInset + (showMinimap ? minimapHeight(layout) + 8 : 0)}
        />
      )}

      {/* Minimap - bottom left */}
      {showMinimap && !showArc && (
        <MiniMap
          nodes={nodes}
          nodeData={nodeData}
          layout={layout}
          themeColors={themeColors}
          brand={brand}
          mode={mode}
          inset={chromeInset}
        />
      )}

      {/* Zoom controls - bottom right */}
      {(interactive || showControls) && !showArc && (
        <ZoomControls
          zoom={zoom}
          zoomLevels={sortedZoomLevels}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
          mode={mode}
          brand={brand}
          right={chromeInset}
          bottom={zoomBottom}
        />
      )}
    </div>
  )
}
