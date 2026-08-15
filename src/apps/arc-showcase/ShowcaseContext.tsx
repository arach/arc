// State for the player showcase, held in one context because Hudson renders
// the stage (Content) and the control rail (Inspector) as separate slots.
//
// Everything the rail changes is mirrored into the query string, so a setup is
// shareable as a link, and emitted as copyable JSX.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { LabelCorner } from '../../components/ArcDiagram'
import type { BrandSpec, ThemeId } from '../../utils/themes'
import { SHOWCASE_DOCS, type ShowcaseDoc } from './documents'

export type FrameChoice = 'theme' | NonNullable<BrandSpec['frame']>
export type ZoomChoice = 'fit' | number

export const SIZE_PRESETS = [
  { id: 'sm', label: 'S', width: 720, height: 420 },
  { id: 'md', label: 'M', width: 940, height: 540 },
  { id: 'lg', label: 'L', width: 1160, height: 640 },
] as const

export const FRAMES: FrameChoice[] = [
  'theme', 'hairline', 'inset', 'brackets', 'ticks', 'cropmarks', 'corners', 'sheet', 'reticle', 'none',
]

export const CORNERS: LabelCorner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

export const DEFAULTS = {
  doc: 'request',
  theme: 'command' as ThemeId,
  mode: 'dark' as 'dark' | 'light',
  width: 940,
  height: 540,
  fill: false,
  zoom: 'fit' as ZoomChoice,
  maxFit: 1,
  interactive: true,
  controls: true,
  legend: true,
  source: true,
  minimap: false,
  focusStory: true,
  autoLayout: false,
  label: true,
  corner: 'top-left' as LabelCorner,
  frame: 'theme' as FrameChoice,
  hover: true,
  dim: true,
  dimOpacity: 0.45,
  lift: true,
  glow: true,
  edges: true,
}

interface ShowcaseValue {
  doc: ShowcaseDoc
  docId: string
  setDocId: (v: string) => void
  themeId: ThemeId
  setThemeId: (v: ThemeId) => void
  mode: 'dark' | 'light'
  setMode: (v: 'dark' | 'light') => void
  width: number
  setWidth: (v: number) => void
  height: number
  setHeight: (v: number) => void
  fill: boolean
  setFill: (v: boolean) => void
  zoom: ZoomChoice
  setZoom: (v: ZoomChoice) => void
  maxFit: number
  setMaxFit: (v: number) => void
  interactive: boolean
  setInteractive: (v: boolean) => void
  controls: boolean
  setControls: (v: boolean) => void
  legend: boolean
  setLegend: (v: boolean) => void
  source: boolean
  setSource: (v: boolean) => void
  minimap: boolean
  setMinimap: (v: boolean) => void
  focusStory: boolean
  setFocusStory: (v: boolean) => void
  autoLayoutBtn: boolean
  setAutoLayoutBtn: (v: boolean) => void
  label: boolean
  setLabel: (v: boolean) => void
  corner: LabelCorner
  setCorner: (v: LabelCorner) => void
  frame: FrameChoice
  setFrame: (v: FrameChoice) => void
  hover: boolean
  setHover: (v: boolean) => void
  dim: boolean
  setDim: (v: boolean) => void
  dimOpacity: number
  setDimOpacity: (v: number) => void
  lift: boolean
  setLift: (v: boolean) => void
  glow: boolean
  setGlow: (v: boolean) => void
  edges: boolean
  setEdges: (v: boolean) => void

  activeNode: string | null
  setActiveNode: (v: string | null) => void
  snippet: string
  shareUrl: string
  reset: () => void
}

const Ctx = createContext<ShowcaseValue | null>(null)

export function useShowcase(): ShowcaseValue {
  const value = useContext(Ctx)
  if (!value) throw new Error('useShowcase must be used inside ShowcaseProvider')
  return value
}

export function ShowcaseProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useSearchParams()
  const read = <T,>(key: string, fallback: T, parse: (raw: string) => T): T => {
    const raw = params.get(key)
    return raw == null ? fallback : parse(raw)
  }
  const bool = (raw: string) => raw === '1'

  const [docId, setDocId] = useState(() => read('doc', DEFAULTS.doc, r => r))
  const [themeId, setThemeId] = useState<ThemeId>(() => read('theme', DEFAULTS.theme, r => r as ThemeId))
  const [mode, setMode] = useState<'dark' | 'light'>(() =>
    read('mode', DEFAULTS.mode, r => r) === 'light' ? 'light' : 'dark',
  )
  const [width, setWidth] = useState(() => read('w', DEFAULTS.width, Number))
  const [height, setHeight] = useState(() => read('h', DEFAULTS.height, Number))
  const [fill, setFill] = useState(() => read('fill', DEFAULTS.fill, bool))
  const [zoom, setZoom] = useState<ZoomChoice>(() => read('zoom', DEFAULTS.zoom, r => (r === 'fit' ? 'fit' : Number(r))))
  const [maxFit, setMaxFit] = useState(() => read('maxfit', DEFAULTS.maxFit, Number))
  const [interactive, setInteractive] = useState(() => read('int', DEFAULTS.interactive, bool))
  const [controls, setControls] = useState(() => read('ctl', DEFAULTS.controls, bool))
  const [legend, setLegend] = useState(() => read('leg', DEFAULTS.legend, bool))
  const [source, setSource] = useState(() => read('src', DEFAULTS.source, bool))
  const [minimap, setMinimap] = useState(() => read('map', DEFAULTS.minimap, bool))
  const [focusStory, setFocusStory] = useState(() => read('fs', DEFAULTS.focusStory, bool))
  const [autoLayoutBtn, setAutoLayoutBtn] = useState(() => read('al', DEFAULTS.autoLayout, bool))
  const [label, setLabel] = useState(() => read('lbl', DEFAULTS.label, bool))
  const [corner, setCorner] = useState<LabelCorner>(() => read('corner', DEFAULTS.corner, r => r as LabelCorner))
  const [frame, setFrame] = useState<FrameChoice>(() => read('frame', DEFAULTS.frame, r => r as FrameChoice))
  const [hover, setHover] = useState(() => read('hov', DEFAULTS.hover, bool))
  const [dim, setDim] = useState(() => read('dim', DEFAULTS.dim, bool))
  const [dimOpacity, setDimOpacity] = useState(() => read('dimo', DEFAULTS.dimOpacity, Number))
  const [lift, setLift] = useState(() => read('lift', DEFAULTS.lift, bool))
  const [glow, setGlow] = useState(() => read('glow', DEFAULTS.glow, bool))
  const [edges, setEdges] = useState(() => read('edg', DEFAULTS.edges, bool))
  const [activeNode, setActiveNode] = useState<string | null>(null)

  const doc = SHOWCASE_DOCS.find(d => d.id === docId) ?? SHOWCASE_DOCS[0]

  // --- URL sync: only non-default values, so shared links stay short ---
  const state: Record<string, string | number | boolean> = {
    doc: docId, theme: themeId, mode, w: width, h: height, fill, zoom, maxfit: maxFit,
    int: interactive, ctl: controls, leg: legend, src: source, map: minimap, fs: focusStory,
    al: autoLayoutBtn, lbl: label, corner, frame, hov: hover, dim, dimo: dimOpacity, lift, glow, edg: edges,
  }
  const defaults: Record<string, unknown> = {
    doc: DEFAULTS.doc, theme: DEFAULTS.theme, mode: DEFAULTS.mode, w: DEFAULTS.width, h: DEFAULTS.height,
    fill: DEFAULTS.fill, zoom: DEFAULTS.zoom, maxfit: DEFAULTS.maxFit, int: DEFAULTS.interactive,
    ctl: DEFAULTS.controls, leg: DEFAULTS.legend, src: DEFAULTS.source, map: DEFAULTS.minimap,
    fs: DEFAULTS.focusStory, al: DEFAULTS.autoLayout, lbl: DEFAULTS.label, corner: DEFAULTS.corner,
    frame: DEFAULTS.frame, hov: DEFAULTS.hover, dim: DEFAULTS.dim, dimo: DEFAULTS.dimOpacity,
    lift: DEFAULTS.lift, glow: DEFAULTS.glow, edg: DEFAULTS.edges,
  }
  const query = useMemo(() => {
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries(state)) {
      if (value === defaults[key]) continue
      next.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value))
    }
    return next.toString()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, Object.values(state))

  useEffect(() => {
    setParams(new URLSearchParams(query), { replace: true })
  }, [query, setParams])

  // --- the exact props the stage is rendering, as copyable JSX ---
  const snippet = useMemo(() => {
    const lines: string[] = ['data={diagram}', `theme="${themeId}"`, `mode="${mode}"`]
    if (zoom === 'fit') {
      lines.push('defaultZoom="fit"')
      if (maxFit !== 1) lines.push(`maxFitZoom={${maxFit}}`)
    } else if (zoom !== 1) {
      lines.push(`defaultZoom={${zoom}}`)
    }
    if (!interactive) lines.push('interactive={false}')
    if (controls !== interactive) lines.push(`showControls={${controls}}`)
    if (!source) lines.push('showArcToggle={false}')
    if (legend) lines.push('showLegend')
    if (minimap) lines.push('showMinimap')
    if (focusStory) lines.push('showFocusStory')
    if (autoLayoutBtn) lines.push('showAutoLayout')
    if (!label) lines.push('label=""')
    else if (corner !== 'top-left') lines.push(`labelPosition="${corner}"`)
    if (frame !== 'theme') lines.push(`frame="${frame}"`)
    if (!hover) lines.push('hoverEffects={false}')
    else {
      const fx: string[] = []
      if (!dim) fx.push('dim: false')
      else if (dimOpacity !== 0.45) fx.push(`dimOpacity: ${dimOpacity}`)
      if (!lift) fx.push('lift: false')
      if (!glow) fx.push('glow: false')
      if (!edges) fx.push('highlightEdges: false')
      if (fx.length) lines.push(`hoverEffects={{ ${fx.join(', ')} }}`)
    }
    return `<ArcDiagram\n  ${lines.join('\n  ')}\n/>`
  }, [themeId, mode, zoom, maxFit, interactive, controls, source, legend, minimap, focusStory, autoLayoutBtn, label, corner, frame, hover, dim, dimOpacity, lift, glow, edges])

  const shareUrl =
    typeof window === 'undefined' ? '' : `${window.location.origin}/showcase${query ? `?${query}` : ''}`

  const reset = () => {
    setDocId(DEFAULTS.doc); setThemeId(DEFAULTS.theme); setMode(DEFAULTS.mode)
    setWidth(DEFAULTS.width); setHeight(DEFAULTS.height); setFill(DEFAULTS.fill)
    setZoom(DEFAULTS.zoom); setMaxFit(DEFAULTS.maxFit); setInteractive(DEFAULTS.interactive)
    setControls(DEFAULTS.controls); setLegend(DEFAULTS.legend); setSource(DEFAULTS.source)
    setMinimap(DEFAULTS.minimap); setFocusStory(DEFAULTS.focusStory); setAutoLayoutBtn(DEFAULTS.autoLayout)
    setLabel(DEFAULTS.label); setCorner(DEFAULTS.corner); setFrame(DEFAULTS.frame)
    setHover(DEFAULTS.hover); setDim(DEFAULTS.dim); setDimOpacity(DEFAULTS.dimOpacity)
    setLift(DEFAULTS.lift); setGlow(DEFAULTS.glow); setEdges(DEFAULTS.edges)
  }

  const value: ShowcaseValue = {
    doc, docId, setDocId, themeId, setThemeId, mode, setMode,
    width, setWidth, height, setHeight, fill, setFill,
    zoom, setZoom, maxFit, setMaxFit, interactive, setInteractive, controls, setControls,
    legend, setLegend, source, setSource, minimap, setMinimap, focusStory, setFocusStory,
    autoLayoutBtn, setAutoLayoutBtn, label, setLabel, corner, setCorner, frame, setFrame,
    hover, setHover, dim, setDim, dimOpacity, setDimOpacity, lift, setLift, glow, setGlow,
    edges, setEdges, activeNode, setActiveNode, snippet, shareUrl, reset,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
