// Render styles for the isometric view.
//
// 'solid' is the original shaded-box look. The technical styles ('blueprint',
// 'cyanotype') render the same geometry as a 1980s engineering-manual plate:
// wireframe linework, hatched faces, dotted relationship lines, monospace
// callouts, and a title block. They share one renderer and differ only in ink.

export type IsoStyleId = 'solid' | 'blueprint' | 'cyanotype'

export const ISO_STYLE_ORDER: IsoStyleId[] = ['solid', 'blueprint', 'cyanotype']

/** Hatch treatment used to distinguish components in a monochrome plate. */
export type HatchKind = 'plain' | 'lines' | 'cross' | 'dense' | 'dots' | 'dashes'

export interface IsoStyleSpec {
  id: IsoStyleId
  name: string
  description: string
  /** True for line-art plates (hatching, callouts, title block). */
  technical: boolean
  paper: {
    /** Sheet fill, top-to-bottom. */
    from: string
    to: string
    /** Sheet border + inner rule. */
    edge: string
    /** Isometric ground grid ink. */
    grid: string
    /** Paper grain opacity (0 disables the turbulence layer). */
    grain: number
  }
  ink: {
    line: string      // visible edges
    hidden: string    // hidden-edge dashes
    hatch: string     // face hatching
    text: string      // callout labels
    muted: string     // secondary text, rules, tick marks
    accent: string    // selection / redline markup
  }
  /** Face washes painted over the paper before hatching. */
  face: { top: string; right: string; left: string }
  /** Hatch density multiplier per face — the left face reads as shadow. */
  hatchOpacity: { top: number; right: number; left: number }
  font: string
  strokeWidth: number
}

const MONO = '"JetBrains Mono", "IBM Plex Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace'

/**
 * One dial for how large the drawing's annotation layer reads — callouts,
 * component tags, the index table, the title block. 1 = the base sizes; lower
 * makes the linework dominate and the paperwork recede.
 */
export const DETAIL_SCALE = 0.78

/** Scale an annotation dimension by DETAIL_SCALE, rounded to 0.1. */
export const d = (n: number) => Math.round(n * DETAIL_SCALE * 10) / 10

const solid: IsoStyleSpec = {
  id: 'solid',
  name: 'Solid',
  description: 'Shaded isometric boxes',
  technical: false,
  paper: { from: 'transparent', to: 'transparent', edge: 'transparent', grid: 'transparent', grain: 0 },
  ink: {
    line: 'rgba(0,0,0,0.3)',
    hidden: 'rgba(0,0,0,0.2)',
    hatch: 'transparent',
    text: '#ffffff',
    muted: 'rgba(255,255,255,0.6)',
    accent: '#3b82f6',
  },
  face: { top: 'transparent', right: 'transparent', left: 'transparent' },
  hatchOpacity: { top: 0, right: 0, left: 0 },
  font: MONO,
  strokeWidth: 0.5,
}

const blueprint: IsoStyleSpec = {
  id: 'blueprint',
  name: 'Blueprint',
  description: 'Sepia engineering plate on parchment',
  technical: true,
  paper: { from: '#f0e6d0', to: '#ddceac', edge: '#b09a74', grid: '#c6b48f', grain: 0.055 },
  ink: {
    line: '#4a3826',
    hidden: '#96805f',
    hatch: '#6d563c',
    text: '#3b2c1d',
    muted: '#8a7455',
    accent: '#a8412a',
  },
  face: { top: '#f4ebd7', right: '#e6dabb', left: '#d6c6a2' },
  hatchOpacity: { top: 0.48, right: 0.68, left: 0.92 },
  font: MONO,
  strokeWidth: 1,
}

const cyanotype: IsoStyleSpec = {
  id: 'cyanotype',
  name: 'Cyanotype',
  description: 'White linework on classic blueprint blue',
  technical: true,
  paper: { from: '#123256', to: '#0b1f3a', edge: '#3f6d9f', grid: '#27507f', grain: 0.07 },
  ink: {
    line: '#e6f0fb',
    hidden: '#78a2cc',
    hatch: '#a6c6e5',
    text: '#f2f8ff',
    muted: '#8fb2d6',
    accent: '#ffc857',
  },
  face: { top: '#1b4675', right: '#153a61', left: '#0f2b49' },
  hatchOpacity: { top: 0.46, right: 0.64, left: 0.88 },
  font: MONO,
  strokeWidth: 1,
}

export const ISO_STYLES: Record<IsoStyleId, IsoStyleSpec> = { solid, blueprint, cyanotype }

export function getIsoStyle(id: string | null | undefined): IsoStyleSpec {
  return ISO_STYLES[(id as IsoStyleId)] || solid
}

/** Next style in the cycle — drives the single toolbar button. */
export function nextIsoStyle(id: string | null | undefined): IsoStyleId {
  const i = ISO_STYLE_ORDER.indexOf((id as IsoStyleId) || 'solid')
  return ISO_STYLE_ORDER[(i + 1) % ISO_STYLE_ORDER.length]
}

/**
 * The line-art plates, in the order the view toggle cycles them.
 *
 * The toggle treats "technical plate" as a destination of its own rather than a
 * style you can only reach once you are already in the isometric view — so this
 * is the cycle *within* that destination, not across all three styles.
 */
export const TECHNICAL_STYLE_ORDER: IsoStyleId[] = ISO_STYLE_ORDER.filter(id => ISO_STYLES[id].technical)

/** The plate to show when arriving at the technical view from elsewhere. */
export const DEFAULT_TECHNICAL_STYLE: IsoStyleId = TECHNICAL_STYLE_ORDER[0]

/** Next plate ink. Anything non-technical enters at the default plate. */
export function nextTechnicalStyle(id: string | null | undefined): IsoStyleId {
  const i = TECHNICAL_STYLE_ORDER.indexOf(id as IsoStyleId)
  if (i === -1) return DEFAULT_TECHNICAL_STYLE
  return TECHNICAL_STYLE_ORDER[(i + 1) % TECHNICAL_STYLE_ORDER.length]
}

/**
 * Material key per logical color. Technical plates are monochrome, so a node's
 * color becomes a hatch signature instead of a hue — the way a printed manual
 * distinguishes materials.
 */
export const MATERIAL_KEYS: Record<string, HatchKind> = {
  violet: 'cross',
  blue: 'lines',
  sky: 'dashes',
  cyan: 'dashes',
  emerald: 'dots',
  amber: 'dense',
  orange: 'dense',
  rose: 'cross',
  zinc: 'plain',
  slate: 'plain',
}

export function materialFor(color: string | undefined): HatchKind {
  return MATERIAL_KEYS[color || 'zinc'] || 'lines'
}

/** Human-readable material name for the component index. */
export const MATERIAL_LABELS: Record<HatchKind, string> = {
  plain: 'PLAIN',
  lines: 'HATCH-A',
  cross: 'HATCH-X',
  dense: 'HATCH-D',
  dots: 'STIPPLE',
  dashes: 'BROKEN',
}
