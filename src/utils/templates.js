// Diagram style templates

export const TEMPLATES = {
  talkie: {
    id: 'talkie',
    name: 'Talkie Docs',
    description: 'Dark theme matching Talkie documentation',
    canvas: {
      background: 'bg-zinc-950',
      border: 'border-zinc-800',
      grid: {
        color: 'rgb(113 113 122)',
        size: 24,
        opacity: 0.1,
      },
    },
    node: {
      background: 'bg-zinc-900',
      border: 'border-zinc-800',
      borderRadius: 'rounded-xl',
      accentPosition: 'left', // left border accent
      accentWidth: 4,
      textColor: 'text-white',
      subtitleStyle: 'colored', // subtitle matches accent color
      descriptionColor: 'text-zinc-500',
      iconBackground: 'bg-zinc-900',
      iconBorderStyle: 'colored', // border matches accent color
    },
    connector: {
      defaultDashed: true,
      defaultStrokeWidth: 2,
      arrowStyle: 'filled',
      labelFont: 'ui-monospace, monospace',
      labelSize: 11,
    },
  },

  blueprint: {
    id: 'blueprint',
    name: 'Blueprint',
    description: 'Technical blueprint style with blue tones',
    canvas: {
      background: 'bg-slate-900',
      border: 'border-slate-700',
      grid: {
        color: 'rgb(71 85 105)',
        size: 20,
        opacity: 0.2,
      },
    },
    node: {
      background: 'bg-slate-800/80',
      border: 'border-slate-600',
      borderRadius: 'rounded-lg',
      accentPosition: 'top', // top border accent
      accentWidth: 3,
      textColor: 'text-slate-100',
      subtitleStyle: 'muted', // subtitle is muted
      descriptionColor: 'text-slate-400',
      iconBackground: 'bg-slate-700/50',
      iconBorderStyle: 'muted',
    },
    connector: {
      defaultDashed: false,
      defaultStrokeWidth: 2,
      arrowStyle: 'filled',
      labelFont: 'ui-sans-serif, system-ui',
      labelSize: 10,
    },
  },

  light: {
    id: 'light',
    name: 'Light Mode',
    description: 'Clean light theme for documents',
    canvas: {
      background: 'bg-white',
      border: 'border-zinc-200',
      grid: {
        color: 'rgb(161 161 170)',
        size: 24,
        opacity: 0.15,
      },
    },
    node: {
      background: 'bg-white',
      border: 'border-zinc-200',
      borderRadius: 'rounded-xl',
      accentPosition: 'left',
      accentWidth: 4,
      textColor: 'text-zinc-900',
      subtitleStyle: 'colored',
      descriptionColor: 'text-zinc-500',
      iconBackground: 'bg-zinc-50',
      iconBorderStyle: 'colored',
    },
    connector: {
      defaultDashed: true,
      defaultStrokeWidth: 2,
      arrowStyle: 'filled',
      labelFont: 'ui-monospace, monospace',
      labelSize: 11,
    },
  },

  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and clean with subtle styling',
    canvas: {
      background: 'bg-zinc-900',
      border: 'border-zinc-800',
      grid: {
        color: 'transparent',
        size: 0,
        opacity: 0,
      },
    },
    node: {
      background: 'bg-zinc-800/60',
      border: 'border-zinc-700/50',
      borderRadius: 'rounded-2xl',
      accentPosition: 'none',
      accentWidth: 0,
      textColor: 'text-zinc-100',
      subtitleStyle: 'muted',
      descriptionColor: 'text-zinc-500',
      iconBackground: 'bg-transparent',
      iconBorderStyle: 'none',
    },
    connector: {
      defaultDashed: false,
      defaultStrokeWidth: 1.5,
      arrowStyle: 'outline',
      labelFont: 'ui-sans-serif, system-ui',
      labelSize: 10,
    },
  },
}

export const DEFAULT_TEMPLATE = 'talkie'

export function getTemplate(id) {
  return TEMPLATES[id] || TEMPLATES[DEFAULT_TEMPLATE]
}

export function getTemplateList() {
  return Object.values(TEMPLATES).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
  }))
}
