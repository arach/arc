// Diagram color themes - palettes and background treatments
// Separate from templates (structural) - themes handle colors only

export type ThemeId = 'default' | 'warm' | 'cool' | 'mono' | 'engineering' | 'workbench' | 'tactical'

export interface ColorPalette {
  violet:  { border: string; bg: string; icon: string; stroke: string }
  emerald: { border: string; bg: string; icon: string; stroke: string }
  blue:    { border: string; bg: string; icon: string; stroke: string }
  amber:   { border: string; bg: string; icon: string; stroke: string }
  sky:     { border: string; bg: string; icon: string; stroke: string }
  zinc:    { border: string; bg: string; icon: string; stroke: string }
  rose:    { border: string; bg: string; icon: string; stroke: string }
  orange:  { border: string; bg: string; icon: string; stroke: string }
}

export interface ThemeBackground {
  container: string        // Container background + border classes
  grid: {
    color: string          // Dot grid color (CSS color value)
    opacity: number        // Grid opacity
    size: number           // Grid spacing in px
  }
}

// Optional brand design language layered on a theme's colors — typography,
// node geometry, and connector treatment. Omit for color-only themes.
export interface BrandSpec {
  /** Font stack for the whole diagram (node names inherit this). */
  fontFamily?: string
  /** Monospace stack for subtitles + connector labels. */
  monoFamily?: string
  /** Stylesheet URL injected once so the families load (e.g. Google Fonts). */
  fontImport?: string
  /** Node + icon corner radius (CSS length). '0px' = square tiles. */
  nodeRadius?: string
  /** Node border width (CSS length), overrides the default 2px. */
  nodeBorderWidth?: string
  /** Uppercase + letter-space the subtitle and connector labels. */
  upperLabels?: boolean
  /** Arrowhead shape at connector ends. */
  arrowhead?: 'triangle' | 'chevron'
  /** Background grid system. */
  gridType?: 'dots' | 'lines' | 'crosshair' | 'none'
  /** Edge/frame treatment at the diagram boundary. */
  frame?: 'hairline' | 'inset' | 'brackets' | 'ticks' | 'cropmarks' | 'corners' | 'sheet' | 'none'
  /** Render an engineering-drawing title block in the bottom-right corner. */
  titleBlock?: boolean
}

export interface Theme {
  id: ThemeId
  name: string
  description: string
  light: {
    palette: ColorPalette
    background: ThemeBackground
    text: { primary: string; secondary: string; muted: string }
  }
  dark: {
    palette: ColorPalette
    background: ThemeBackground
    text: { primary: string; secondary: string; muted: string }
  }
  /** Optional brand design language (typography, node shape, arrows). */
  brand?: BrandSpec
}

// Default theme - clean and neutral
const defaultTheme: Theme = {
  id: 'default',
  name: 'Default',
  description: 'Clean, neutral colors',
  light: {
    palette: {
      violet:  { border: 'border-violet-300',  bg: 'bg-gradient-to-br from-violet-50 to-violet-100/50',   icon: 'text-violet-600',  stroke: '#8b5cf6' },
      emerald: { border: 'border-emerald-300', bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50', icon: 'text-emerald-600', stroke: '#10b981' },
      blue:    { border: 'border-blue-300',    bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50',       icon: 'text-blue-600',    stroke: '#3b82f6' },
      amber:   { border: 'border-amber-300',   bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50',     icon: 'text-amber-600',   stroke: '#f59e0b' },
      sky:     { border: 'border-sky-300',     bg: 'bg-gradient-to-br from-sky-50 to-sky-100/50',         icon: 'text-sky-600',     stroke: '#0ea5e9' },
      zinc:    { border: 'border-zinc-300',    bg: 'bg-gradient-to-br from-zinc-50 to-zinc-100/50',       icon: 'text-zinc-600',    stroke: '#71717a' },
      rose:    { border: 'border-rose-300',    bg: 'bg-gradient-to-br from-rose-50 to-rose-100/50',       icon: 'text-rose-600',    stroke: '#f43f5e' },
      orange:  { border: 'border-orange-300',  bg: 'bg-gradient-to-br from-orange-50 to-orange-100/50',   icon: 'text-orange-600',  stroke: '#f97316' },
    },
    background: {
      container: 'bg-white/80 border border-zinc-200 shadow-lg',
      grid: { color: 'rgba(16, 21, 24, 0.12)', opacity: 0.35, size: 24 },
    },
    text: { primary: 'text-zinc-900', secondary: 'text-zinc-600', muted: 'text-zinc-500' },
  },
  dark: {
    palette: {
      violet:  { border: 'border-violet-400/50',  bg: 'bg-violet-500/10',  icon: 'text-violet-400',  stroke: '#a78bfa' },
      emerald: { border: 'border-emerald-400/50', bg: 'bg-emerald-500/10', icon: 'text-emerald-400', stroke: '#34d399' },
      blue:    { border: 'border-blue-400/50',    bg: 'bg-blue-500/10',    icon: 'text-blue-400',    stroke: '#60a5fa' },
      amber:   { border: 'border-amber-400/50',   bg: 'bg-amber-500/10',   icon: 'text-amber-400',   stroke: '#fbbf24' },
      sky:     { border: 'border-sky-400/50',     bg: 'bg-sky-500/10',     icon: 'text-sky-400',     stroke: '#38bdf8' },
      zinc:    { border: 'border-zinc-600',       bg: 'bg-zinc-800/50',    icon: 'text-zinc-400',    stroke: '#71717a' },
      rose:    { border: 'border-rose-400/50',    bg: 'bg-rose-500/10',    icon: 'text-rose-400',    stroke: '#fb7185' },
      orange:  { border: 'border-orange-400/50',  bg: 'bg-orange-500/10',  icon: 'text-orange-400',  stroke: '#fb923c' },
    },
    background: {
      container: 'bg-zinc-950 border border-zinc-800',
      grid: { color: '#71717a', opacity: 0.08, size: 24 },
    },
    text: { primary: 'text-white', secondary: 'text-zinc-400', muted: 'text-zinc-600' },
  },
}

// Warm theme - editorial, paper-like feel
const warmTheme: Theme = {
  id: 'warm',
  name: 'Warm',
  description: 'Soft, editorial warmth',
  light: {
    palette: {
      violet:  { border: 'border-violet-300/70',  bg: 'bg-gradient-to-br from-violet-50/90 to-violet-100/50',   icon: 'text-violet-500',  stroke: '#a78bfa' },
      emerald: { border: 'border-emerald-300/70', bg: 'bg-gradient-to-br from-emerald-50/90 to-emerald-100/50', icon: 'text-emerald-500', stroke: '#6ee7b7' },
      blue:    { border: 'border-blue-300/70',    bg: 'bg-gradient-to-br from-blue-50/90 to-blue-100/50',       icon: 'text-blue-500',    stroke: '#93c5fd' },
      amber:   { border: 'border-amber-300/70',   bg: 'bg-gradient-to-br from-amber-50/90 to-amber-100/50',     icon: 'text-amber-500',   stroke: '#fcd34d' },
      sky:     { border: 'border-sky-300/70',     bg: 'bg-gradient-to-br from-sky-50/90 to-sky-100/50',         icon: 'text-sky-500',     stroke: '#7dd3fc' },
      zinc:    { border: 'border-stone-300/70',   bg: 'bg-gradient-to-br from-stone-50/90 to-stone-100/50',     icon: 'text-stone-500',   stroke: '#a8a29e' },
      rose:    { border: 'border-rose-300/70',    bg: 'bg-gradient-to-br from-rose-50/90 to-rose-100/50',       icon: 'text-rose-500',    stroke: '#fda4af' },
      orange:  { border: 'border-orange-300/70',  bg: 'bg-gradient-to-br from-orange-50/90 to-orange-100/50',   icon: 'text-orange-500',  stroke: '#fdba74' },
    },
    background: {
      container: 'bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-stone-100/60 border border-stone-200/60',
      grid: { color: 'rgba(180, 160, 140, 0.3)', opacity: 0.5, size: 24 },
    },
    text: { primary: 'text-stone-800', secondary: 'text-stone-600', muted: 'text-stone-400' },
  },
  dark: {
    palette: {
      violet:  { border: 'border-violet-400/40',  bg: 'bg-violet-500/8',  icon: 'text-violet-300',  stroke: '#c4b5fd' },
      emerald: { border: 'border-emerald-400/40', bg: 'bg-emerald-500/8', icon: 'text-emerald-300', stroke: '#a7f3d0' },
      blue:    { border: 'border-blue-400/40',    bg: 'bg-blue-500/8',    icon: 'text-blue-300',    stroke: '#bfdbfe' },
      amber:   { border: 'border-amber-400/40',   bg: 'bg-amber-500/8',   icon: 'text-amber-300',   stroke: '#fde68a' },
      sky:     { border: 'border-sky-400/40',     bg: 'bg-sky-500/8',     icon: 'text-sky-300',     stroke: '#bae6fd' },
      zinc:    { border: 'border-stone-500/40',   bg: 'bg-stone-600/10',  icon: 'text-stone-300',   stroke: '#d6d3d1' },
      rose:    { border: 'border-rose-400/40',    bg: 'bg-rose-500/8',    icon: 'text-rose-300',    stroke: '#fecdd3' },
      orange:  { border: 'border-orange-400/40',  bg: 'bg-orange-500/8',  icon: 'text-orange-300',  stroke: '#fed7aa' },
    },
    background: {
      container: 'bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 border border-stone-700/50',
      grid: { color: 'rgba(168, 162, 158, 0.15)', opacity: 0.15, size: 24 },
    },
    text: { primary: 'text-stone-100', secondary: 'text-stone-400', muted: 'text-stone-600' },
  },
}

// Cool theme - crisp, modern blues
const coolTheme: Theme = {
  id: 'cool',
  name: 'Cool',
  description: 'Crisp, modern blues',
  light: {
    palette: {
      violet:  { border: 'border-indigo-300',  bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50',   icon: 'text-indigo-600',  stroke: '#6366f1' },
      emerald: { border: 'border-teal-300',    bg: 'bg-gradient-to-br from-teal-50 to-teal-100/50',       icon: 'text-teal-600',    stroke: '#14b8a6' },
      blue:    { border: 'border-blue-300',    bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50',       icon: 'text-blue-600',    stroke: '#3b82f6' },
      amber:   { border: 'border-cyan-300',    bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100/50',       icon: 'text-cyan-600',    stroke: '#06b6d4' },
      sky:     { border: 'border-sky-300',     bg: 'bg-gradient-to-br from-sky-50 to-sky-100/50',         icon: 'text-sky-600',     stroke: '#0ea5e9' },
      zinc:    { border: 'border-slate-300',   bg: 'bg-gradient-to-br from-slate-50 to-slate-100/50',     icon: 'text-slate-600',   stroke: '#64748b' },
      rose:    { border: 'border-fuchsia-300', bg: 'bg-gradient-to-br from-fuchsia-50 to-fuchsia-100/50', icon: 'text-fuchsia-600', stroke: '#d946ef' },
      orange:  { border: 'border-violet-300',  bg: 'bg-gradient-to-br from-violet-50 to-violet-100/50',   icon: 'text-violet-600',  stroke: '#8b5cf6' },
    },
    background: {
      container: 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 border border-slate-200',
      grid: { color: 'rgba(71, 85, 105, 0.15)', opacity: 0.4, size: 24 },
    },
    text: { primary: 'text-slate-900', secondary: 'text-slate-600', muted: 'text-slate-400' },
  },
  dark: {
    palette: {
      violet:  { border: 'border-indigo-400/50',  bg: 'bg-indigo-500/10',  icon: 'text-indigo-400',  stroke: '#818cf8' },
      emerald: { border: 'border-teal-400/50',    bg: 'bg-teal-500/10',    icon: 'text-teal-400',    stroke: '#2dd4bf' },
      blue:    { border: 'border-blue-400/50',    bg: 'bg-blue-500/10',    icon: 'text-blue-400',    stroke: '#60a5fa' },
      amber:   { border: 'border-cyan-400/50',    bg: 'bg-cyan-500/10',    icon: 'text-cyan-400',    stroke: '#22d3ee' },
      sky:     { border: 'border-sky-400/50',     bg: 'bg-sky-500/10',     icon: 'text-sky-400',     stroke: '#38bdf8' },
      zinc:    { border: 'border-slate-500',      bg: 'bg-slate-700/30',   icon: 'text-slate-400',   stroke: '#94a3b8' },
      rose:    { border: 'border-fuchsia-400/50', bg: 'bg-fuchsia-500/10', icon: 'text-fuchsia-400', stroke: '#e879f9' },
      orange:  { border: 'border-violet-400/50',  bg: 'bg-violet-500/10',  icon: 'text-violet-400',  stroke: '#a78bfa' },
    },
    background: {
      container: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-700',
      grid: { color: 'rgba(148, 163, 184, 0.1)', opacity: 0.1, size: 24 },
    },
    text: { primary: 'text-slate-100', secondary: 'text-slate-400', muted: 'text-slate-600' },
  },
}

// Mono theme - grayscale elegance
const monoTheme: Theme = {
  id: 'mono',
  name: 'Mono',
  description: 'Elegant grayscale',
  light: {
    palette: {
      violet:  { border: 'border-zinc-400',   bg: 'bg-gradient-to-br from-zinc-100 to-zinc-200/50', icon: 'text-zinc-700', stroke: '#52525b' },
      emerald: { border: 'border-zinc-400',   bg: 'bg-gradient-to-br from-zinc-100 to-zinc-200/50', icon: 'text-zinc-700', stroke: '#52525b' },
      blue:    { border: 'border-zinc-400',   bg: 'bg-gradient-to-br from-zinc-100 to-zinc-200/50', icon: 'text-zinc-700', stroke: '#52525b' },
      amber:   { border: 'border-zinc-400',   bg: 'bg-gradient-to-br from-zinc-100 to-zinc-200/50', icon: 'text-zinc-700', stroke: '#52525b' },
      sky:     { border: 'border-zinc-400',   bg: 'bg-gradient-to-br from-zinc-100 to-zinc-200/50', icon: 'text-zinc-700', stroke: '#52525b' },
      zinc:    { border: 'border-zinc-400',   bg: 'bg-gradient-to-br from-zinc-100 to-zinc-200/50', icon: 'text-zinc-700', stroke: '#52525b' },
      rose:    { border: 'border-zinc-400',   bg: 'bg-gradient-to-br from-zinc-100 to-zinc-200/50', icon: 'text-zinc-700', stroke: '#52525b' },
      orange:  { border: 'border-zinc-400',   bg: 'bg-gradient-to-br from-zinc-100 to-zinc-200/50', icon: 'text-zinc-700', stroke: '#52525b' },
    },
    background: {
      container: 'bg-zinc-100 border border-zinc-300',
      grid: { color: 'rgba(63, 63, 70, 0.08)', opacity: 0.5, size: 20 },
    },
    text: { primary: 'text-zinc-900', secondary: 'text-zinc-600', muted: 'text-zinc-400' },
  },
  dark: {
    palette: {
      violet:  { border: 'border-zinc-600', bg: 'bg-zinc-800/60', icon: 'text-zinc-300', stroke: '#a1a1aa' },
      emerald: { border: 'border-zinc-600', bg: 'bg-zinc-800/60', icon: 'text-zinc-300', stroke: '#a1a1aa' },
      blue:    { border: 'border-zinc-600', bg: 'bg-zinc-800/60', icon: 'text-zinc-300', stroke: '#a1a1aa' },
      amber:   { border: 'border-zinc-600', bg: 'bg-zinc-800/60', icon: 'text-zinc-300', stroke: '#a1a1aa' },
      sky:     { border: 'border-zinc-600', bg: 'bg-zinc-800/60', icon: 'text-zinc-300', stroke: '#a1a1aa' },
      zinc:    { border: 'border-zinc-600', bg: 'bg-zinc-800/60', icon: 'text-zinc-300', stroke: '#a1a1aa' },
      rose:    { border: 'border-zinc-600', bg: 'bg-zinc-800/60', icon: 'text-zinc-300', stroke: '#a1a1aa' },
      orange:  { border: 'border-zinc-600', bg: 'bg-zinc-800/60', icon: 'text-zinc-300', stroke: '#a1a1aa' },
    },
    background: {
      container: 'bg-zinc-900 border border-zinc-700',
      grid: { color: 'rgba(161, 161, 170, 0.06)', opacity: 0.1, size: 20 },
    },
    text: { primary: 'text-zinc-100', secondary: 'text-zinc-400', muted: 'text-zinc-600' },
  },
}

// Engineering - systematic technical blue on structured gray (graph grid)
// Shared technical palette — the three style explorations use ONE color scheme
// (cohesive indigo/blue/teal/amber/gray) and differ by grid, frame, and type,
// not color. Mid-tone so it reads on any of their dark surfaces.
const techDark: ColorPalette = {
  violet:  { border: 'border-[#7c8cff]/55', bg: 'bg-[#7c8cff]/[0.08]', icon: 'text-[#7c8cff]', stroke: '#7c8cff' },
  emerald: { border: 'border-[#2dd4bf]/55', bg: 'bg-[#2dd4bf]/[0.08]', icon: 'text-[#2dd4bf]', stroke: '#2dd4bf' },
  blue:    { border: 'border-[#4f8cff]/55', bg: 'bg-[#4f8cff]/[0.08]', icon: 'text-[#4f8cff]', stroke: '#4f8cff' },
  amber:   { border: 'border-[#e0a83d]/55', bg: 'bg-[#e0a83d]/[0.08]', icon: 'text-[#e0a83d]', stroke: '#e0a83d' },
  sky:     { border: 'border-[#54b6e6]/55', bg: 'bg-[#54b6e6]/[0.08]', icon: 'text-[#54b6e6]', stroke: '#54b6e6' },
  zinc:    { border: 'border-[#8b93a0]/55', bg: 'bg-[#8b93a0]/[0.08]', icon: 'text-[#8b93a0]', stroke: '#8b93a0' },
  rose:    { border: 'border-[#e0726e]/55', bg: 'bg-[#e0726e]/[0.08]', icon: 'text-[#e0726e]', stroke: '#e0726e' },
  orange:  { border: 'border-[#e0884a]/55', bg: 'bg-[#e0884a]/[0.08]', icon: 'text-[#e0884a]', stroke: '#e0884a' },
}

const engineeringTheme: Theme = {
  id: 'engineering',
  name: 'Engineering',
  description: 'Graph grid, technical mono',
  light: {
    palette: {
      violet:  { border: 'border-[#4589ff]', bg: 'bg-[#4589ff]/10', icon: 'text-[#4589ff]', stroke: '#4589ff' },
      emerald: { border: 'border-[#007d79]', bg: 'bg-[#007d79]/10', icon: 'text-[#007d79]', stroke: '#007d79' },
      blue:    { border: 'border-[#0f62fe]', bg: 'bg-[#0f62fe]/10', icon: 'text-[#0f62fe]', stroke: '#0f62fe' },
      amber:   { border: 'border-[#6f6f6f]', bg: 'bg-[#6f6f6f]/10', icon: 'text-[#6f6f6f]', stroke: '#6f6f6f' },
      sky:     { border: 'border-[#1192e8]', bg: 'bg-[#1192e8]/10', icon: 'text-[#1192e8]', stroke: '#1192e8' },
      zinc:    { border: 'border-[#525252]', bg: 'bg-[#525252]/10', icon: 'text-[#525252]', stroke: '#525252' },
      rose:    { border: 'border-[#6f6f6f]', bg: 'bg-[#6f6f6f]/10', icon: 'text-[#6f6f6f]', stroke: '#6f6f6f' },
      orange:  { border: 'border-[#393939]', bg: 'bg-[#393939]/10', icon: 'text-[#393939]', stroke: '#393939' },
    },
    background: {
      container: 'bg-[#f4f4f4] border border-[#e0e0e0] shadow-sm',
      grid: { color: 'rgba(22, 22, 22, 0.08)', opacity: 0.4, size: 16 },
    },
    text: { primary: 'text-[#161616]', secondary: 'text-[#525252]', muted: 'text-[#8d8d8d]' },
  },
  dark: {
    palette: techDark,
    background: {
      container: 'bg-[#0e1116] border border-[#393939]',
      grid: { color: 'rgba(125, 170, 255, 0.20)', opacity: 1, size: 18 },
    },
    text: { primary: 'text-[#f4f4f4]', secondary: 'text-[#c6c6c6]', muted: 'text-[#8d8d8d]' },
  },
  brand: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    monoFamily: "'JetBrains Mono', ui-monospace, monospace",
    nodeRadius: '0px',
    nodeBorderWidth: '1px',
    upperLabels: true,
    arrowhead: 'chevron',
    gridType: 'lines',
    frame: 'sheet',
    titleBlock: true,
  },
}

// Workbench - dark slate with signature intent colors
const workbenchTheme: Theme = {
  id: 'workbench',
  name: 'Workbench',
  description: 'Slate workbench, intent colors',
  light: {
    palette: {
      violet:  { border: 'border-[#634dbf]', bg: 'bg-[#634dbf]/10', icon: 'text-[#634dbf]', stroke: '#634dbf' },
      emerald: { border: 'border-[#238551]', bg: 'bg-[#238551]/10', icon: 'text-[#238551]', stroke: '#238551' },
      blue:    { border: 'border-[#2d72d2]', bg: 'bg-[#2d72d2]/10', icon: 'text-[#2d72d2]', stroke: '#2d72d2' },
      amber:   { border: 'border-[#c87619]', bg: 'bg-[#c87619]/10', icon: 'text-[#c87619]', stroke: '#c87619' },
      sky:     { border: 'border-[#147eb3]', bg: 'bg-[#147eb3]/10', icon: 'text-[#147eb3]', stroke: '#147eb3' },
      zinc:    { border: 'border-[#5f6b7c]', bg: 'bg-[#5f6b7c]/10', icon: 'text-[#5f6b7c]', stroke: '#5f6b7c' },
      rose:    { border: 'border-[#cd4246]', bg: 'bg-[#cd4246]/10', icon: 'text-[#cd4246]', stroke: '#cd4246' },
      orange:  { border: 'border-[#9e2b0e]', bg: 'bg-[#9e2b0e]/10', icon: 'text-[#9e2b0e]', stroke: '#9e2b0e' },
    },
    background: {
      container: 'bg-[#f6f7f9] border border-[#d3d8de]',
      grid: { color: 'rgba(95, 107, 124, 0.18)', opacity: 0.4, size: 20 },
    },
    text: { primary: 'text-[#1c2127]', secondary: 'text-[#404854]', muted: 'text-[#738091]' },
  },
  dark: {
    palette: techDark,
    background: {
      container: 'bg-[#1c2127] border border-[#2f343c]',
      grid: { color: 'rgba(180, 188, 200, 0.22)', opacity: 1, size: 16 },
    },
    text: { primary: 'text-[#f6f7f9]', secondary: 'text-[#abb3bf]', muted: 'text-[#738091]' },
  },
  brand: {
    fontFamily: "'Inter', system-ui, sans-serif",
    monoFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontImport: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
    nodeRadius: '3px',
    nodeBorderWidth: '1px',
    upperLabels: false,
    arrowhead: 'triangle',
    gridType: 'dots',
    frame: 'hairline',
  },
}

// Tactical - tactical near-black with signature amber
const tacticalTheme: Theme = {
  id: 'tactical',
  name: 'Tactical',
  description: 'Tactical black, signature amber',
  light: {
    palette: {
      violet:  { border: 'border-[#6b6b73]', bg: 'bg-[#6b6b73]/[0.07]', icon: 'text-[#6b6b73]', stroke: '#6b6b73' },
      emerald: { border: 'border-[#5e6f50]', bg: 'bg-[#5e6f50]/[0.07]', icon: 'text-[#5e6f50]', stroke: '#5e6f50' },
      blue:    { border: 'border-[#5a6f80]', bg: 'bg-[#5a6f80]/[0.07]', icon: 'text-[#5a6f80]', stroke: '#5a6f80' },
      amber:   { border: 'border-[#a8741a]', bg: 'bg-[#a8741a]/[0.14]', icon: 'text-[#a8741a]', stroke: '#a8741a' },
      sky:     { border: 'border-[#5f7d87]', bg: 'bg-[#5f7d87]/[0.07]', icon: 'text-[#5f7d87]', stroke: '#5f7d87' },
      zinc:    { border: 'border-[#6b6f73]', bg: 'bg-[#6b6f73]/[0.07]', icon: 'text-[#6b6f73]', stroke: '#6b6f73' },
      rose:    { border: 'border-[#a8463d]', bg: 'bg-[#a8463d]/10', icon: 'text-[#a8463d]', stroke: '#a8463d' },
      orange:  { border: 'border-[#a85e22]', bg: 'bg-[#a85e22]/12', icon: 'text-[#a85e22]', stroke: '#a85e22' },
    },
    background: {
      container: 'bg-[#e7e3da] border border-[#cfc8ba]',
      grid: { color: 'rgba(40, 40, 40, 0.1)', opacity: 0.4, size: 20 },
    },
    text: { primary: 'text-[#1a1c1d]', secondary: 'text-[#4a4f52]', muted: 'text-[#80868a]' },
  },
  dark: {
    palette: techDark,
    background: {
      container: 'bg-[#0b0d0e] border border-[#23292d]',
      grid: { color: 'rgba(224, 168, 61, 0.24)', opacity: 1, size: 24 },
    },
    text: { primary: 'text-[#e8e6e1]', secondary: 'text-[#9aa0a4]', muted: 'text-[#5f676c]' },
  },
  brand: {
    fontFamily: "'Chakra Petch', system-ui, sans-serif",
    monoFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontImport: 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
    nodeRadius: '0px',
    nodeBorderWidth: '1px',
    upperLabels: true,
    arrowhead: 'chevron',
    gridType: 'crosshair',
    frame: 'brackets',
  },
}

export const THEMES: Record<ThemeId, Theme> = {
  default: defaultTheme,
  warm: warmTheme,
  cool: coolTheme,
  mono: monoTheme,
  engineering: engineeringTheme,
  workbench: workbenchTheme,
  tactical: tacticalTheme,
}

export const DEFAULT_THEME: ThemeId = 'default'

export function getTheme(id: ThemeId): Theme {
  return THEMES[id] || THEMES[DEFAULT_THEME]
}

export function getThemeList() {
  return Object.values(THEMES).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
  }))
}
