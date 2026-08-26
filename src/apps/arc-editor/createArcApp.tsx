import { createElement, type ReactNode } from 'react'
import { ScanSearch } from 'lucide-react'
import type { HudsonApp } from 'hudsonkit'
import { version } from '../../../package.json'
import { ArcEditorProvider, type ArcEditorInit } from './ArcEditorContext'
import ArcEditorContent from './ArcEditorContent'
import ArcEditorInspector from './ArcEditorInspector'
import {
  useArcEditorCommands,
  useArcEditorStatus,
  useArcEditorStatusRight,
  useArcEditorNavCenter,
  useArcEditorNavActions,
  useArcEditorLayoutMode,
} from './hooks'

export function createArcEditorApp(init: ArcEditorInit, initialDiagram: any): HudsonApp {
  function Provider({ children }: { children: ReactNode }) {
    return (
      <ArcEditorProvider init={init} initialDiagram={initialDiagram}>
        {children}
      </ArcEditorProvider>
    )
  }

  return {
    id: 'arc',
    name: 'Arc',
    description: 'Visual architecture diagram editor',
    mode: 'panel',
    // Read from the manifest, not hand-written — the badge used to drift.
    icon: createElement('span', { className: 'arc-editor-ver' }, `v${version}`),
    rightPanel: {
      title: '',
      icon: createElement(ScanSearch, { size: 12 }),
    },
    Provider,
    slots: {
      Content: ArcEditorContent,
      Inspector: ArcEditorInspector,
    },
    hooks: {
      useCommands: useArcEditorCommands,
      useStatus: useArcEditorStatus,
      useStatusRight: useArcEditorStatusRight,
      useNavCenter: useArcEditorNavCenter,
      useNavActions: useArcEditorNavActions,
      useLayoutMode: useArcEditorLayoutMode,
    },
  }
}