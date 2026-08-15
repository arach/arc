import { createElement, type ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import type { HudsonApp, StatusColor } from 'hudsonkit'
import { getTheme } from '../../utils/themes'
import { ShowcaseProvider, useShowcase } from './ShowcaseContext'
import ShowcaseContent from './ShowcaseContent'
import ShowcaseInspector from './ShowcaseInspector'
import { ShowcaseNavActions, ShowcaseNavCenter } from './ShowcaseChrome'

function useShowcaseStatus(): { label: string; color: StatusColor } {
  const s = useShowcase()
  const size = s.fill ? 'fill' : `${s.width}×${s.height}`
  const canvas = `${s.doc.data.layout.width}×${s.doc.data.layout.height}`
  return {
    label: `${s.doc.data.id} · stage ${size} · canvas ${canvas} · ${getTheme(s.themeId).name.toLowerCase()} ${s.mode}`,
    color: 'neutral',
  }
}

function useShowcaseStatusRight() {
  const s = useShowcase()
  return createElement(
    'span',
    { className: 'arc-editor-status-mode' },
    s.activeNode ? `active · ${s.activeNode}` : 'hover a node',
  )
}

export function createShowcaseApp(): HudsonApp {
  function Provider({ children }: { children: ReactNode }) {
    return <ShowcaseProvider>{children}</ShowcaseProvider>
  }

  return {
    id: 'arc-showcase',
    name: 'Player',
    description: 'Live harness for the Arc player',
    mode: 'panel',
    icon: createElement('span', { className: 'arc-editor-ver' }, 'player'),
    rightPanel: {
      title: '',
      icon: createElement(SlidersHorizontal, { size: 12 }),
    },
    Provider,
    slots: {
      Content: ShowcaseContent,
      Inspector: ShowcaseInspector,
    },
    hooks: {
      // No command palette on this surface — every control is on the rail.
      useCommands: () => [],
      useStatus: useShowcaseStatus,
      useStatusRight: useShowcaseStatusRight,
      useNavCenter: () => createElement(ShowcaseNavCenter),
      useNavActions: () => createElement(ShowcaseNavActions),
      useLayoutMode: () => 'panel' as const,
    },
  }
}
