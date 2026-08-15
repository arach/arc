// The two chrome dials — see src/ui-scale.css for what they drive.
//
// Kept as a tiny module store rather than React context so any surface (editor
// nav, showcase header, a future embed) can read and write them without being
// under a shared provider.

export interface UiScale {
  /** Control heights, padding, gaps, icons. 1 = the compact baseline. */
  ui: number
  /** Type ramp only. 1 = 11px base. */
  type: number
}

export interface UiScalePreset extends UiScale {
  id: string
  label: string
}

export const UI_SCALE_PRESETS: UiScalePreset[] = [
  { id: 'micro', label: 'Micro', ui: 0.85, type: 0.88 },
  { id: 'compact', label: 'Compact', ui: 0.93, type: 0.94 },
  { id: 'default', label: 'Default', ui: 1, type: 1 },
  { id: 'roomy', label: 'Roomy', ui: 1.14, type: 1.1 },
]

export const DEFAULT_UI_SCALE: UiScale = { ui: 1, type: 1 }

export const UI_SCALE_LIMITS = { min: 0.75, max: 1.35, step: 0.01 }

const STORAGE_KEY = 'arc-ui-scale'

const clamp = (n: number) => Math.min(UI_SCALE_LIMITS.max, Math.max(UI_SCALE_LIMITS.min, n))

/** Nearest preset for the current dials, or null when they sit between presets. */
export function matchPreset(scale: UiScale): UiScalePreset | null {
  return (
    UI_SCALE_PRESETS.find(
      p => Math.abs(p.ui - scale.ui) < 0.005 && Math.abs(p.type - scale.type) < 0.005,
    ) ?? null
  )
}

export function loadUiScale(): UiScale {
  if (typeof window === 'undefined') return DEFAULT_UI_SCALE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_UI_SCALE
    const parsed = JSON.parse(raw) as Partial<UiScale>
    return {
      ui: clamp(Number(parsed.ui) || DEFAULT_UI_SCALE.ui),
      type: clamp(Number(parsed.type) || DEFAULT_UI_SCALE.type),
    }
  } catch {
    return DEFAULT_UI_SCALE
  }
}

export function saveUiScale(scale: UiScale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scale))
  } catch {
    // Private mode / quota — the dials still apply for this session.
  }
}

/** Write the dials onto an element (defaults to :root). */
export function applyUiScale(scale: UiScale, el?: HTMLElement) {
  const target = el ?? (typeof document !== 'undefined' ? document.documentElement : null)
  if (!target) return
  target.style.setProperty('--arc-ui-scale', String(scale.ui))
  target.style.setProperty('--arc-type-scale', String(scale.type))
}

// --- module store -----------------------------------------------------------

let current: UiScale = DEFAULT_UI_SCALE
let hydrated = false
const listeners = new Set<(s: UiScale) => void>()

/** Cached snapshot — stable reference so it is safe to read during render. */
export function getUiScale(): UiScale {
  if (!hydrated && typeof window !== 'undefined') {
    current = loadUiScale()
    hydrated = true
  }
  return current
}

export function setUiScale(next: Partial<UiScale>) {
  const merged: UiScale = {
    ui: clamp(next.ui ?? current.ui),
    type: clamp(next.type ?? current.type),
  }
  current = merged
  hydrated = true
  applyUiScale(merged)
  saveUiScale(merged)
  listeners.forEach(fn => fn(merged))
}

export function subscribeUiScale(fn: (s: UiScale) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
