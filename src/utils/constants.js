// Layout defaults - larger canvas for full workspace
export const DEFAULT_LAYOUT = { width: 1600, height: 900 }

// Default grid settings
export const DEFAULT_GRID = {
  enabled: true,
  size: 24,
  color: '#71717a',
  opacity: 0.1,
  type: 'dots', // 'dots' | 'lines'
}

// Grid color presets
export const GRID_COLORS = [
  { name: 'Zinc', value: '#71717a' },
  { name: 'Sky', value: '#38bdf8' },
  { name: 'Violet', value: '#a78bfa' },
  { name: 'Emerald', value: '#34d399' },
]

// Node size presets (ordered xs → l)
export const NODE_SIZES = {
  xs:  { width: 80,  height: 36 },
  s:   { width: 95,  height: 42 },
  m:   { width: 145, height: 68 },
  l:   { width: 210, height: 85 },
}

// Color palette for connectors and boxes
export const COLORS = {
  emerald: {
    stroke: 'stroke-emerald-400 dark:stroke-emerald-500',
    fill: 'fill-emerald-400 dark:fill-emerald-500',
    text: 'fill-emerald-600 dark:fill-emerald-400',
  },
  amber: {
    stroke: 'stroke-amber-400 dark:stroke-amber-500',
    fill: 'fill-amber-400 dark:fill-amber-500',
    text: 'fill-amber-600 dark:fill-amber-400',
  },
  zinc: {
    stroke: 'stroke-zinc-400 dark:stroke-zinc-500',
    fill: 'fill-zinc-400 dark:fill-zinc-500',
    text: 'fill-zinc-500 dark:fill-zinc-400',
  },
  sky: {
    stroke: 'stroke-sky-400 dark:stroke-sky-500',
    fill: 'fill-sky-400 dark:fill-sky-500',
    text: 'fill-sky-600 dark:fill-sky-400',
  },
  violet: {
    stroke: 'stroke-violet-400 dark:stroke-violet-500',
    fill: 'fill-violet-400 dark:fill-violet-500',
    text: 'fill-violet-600 dark:fill-violet-400',
  },
  blue: {
    stroke: 'stroke-blue-400 dark:stroke-blue-500',
    fill: 'fill-blue-400 dark:fill-blue-500',
    text: 'fill-blue-600 dark:fill-blue-400',
  },
}

// Default connector style presets
export const DEFAULT_CONNECTOR_STYLES = {
  xpc:       { color: 'emerald', strokeWidth: 2, label: 'XPC' },
  http:      { color: 'amber',   strokeWidth: 2, label: 'HTTP' },
  tailscale: { color: 'zinc',    strokeWidth: 2, label: 'Tailscale' },
  cloudkit:  { color: 'sky',     strokeWidth: 2, label: 'CloudKit', dashed: true },
  audio:     { color: 'emerald', strokeWidth: 3, label: 'audio' },
  peer:      { color: 'zinc',    strokeWidth: 1.5, dashed: true },
}

// Available anchor positions
export const ANCHOR_POSITIONS = ['top', 'right', 'bottom', 'left', 'bottomRight', 'bottomLeft']

// Available color options
export const COLOR_OPTIONS = ['violet', 'emerald', 'blue', 'amber', 'zinc', 'sky']

// Available size options (ordered smallest to largest)
export const SIZE_OPTIONS = ['xs', 's', 'm', 'l']
