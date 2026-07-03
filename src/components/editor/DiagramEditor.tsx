import { useMemo } from 'react'
import { AppShell } from 'hudsonkit/app-shell'
import { createArcEditorApp } from '../../apps/arc-editor/createArcApp'
import type { ArcEditorInit } from '../../apps/arc-editor/ArcEditorContext'
import '../../editor-shell.css'

// Sample diagram to start with - matches Talkie docs styling
const sampleDiagram = {
  layout: { width: 1600, height: 900 },
  grid: { enabled: true, size: 24, color: '#71717a', opacity: 0.1, type: 'dots' },
  nodes: {
    talkie: { x: 50, y: 45, size: 'l' },
    talkieLive: { x: 50, y: 155, size: 'm' },
    talkieEngine: { x: 50, y: 255, size: 'm' },
    talkieServer: { x: 360, y: 55, size: 'm' },
    iCloud: { x: 380, y: 255, size: 'm' },
    iPhone: { x: 600, y: 55, size: 'm' },
    watch: { x: 620, y: 155, size: 's' },
  },
  nodeData: {
    talkie: {
      icon: 'Monitor',
      name: 'Talkie',
      subtitle: 'Swift/SwiftUI',
      description: 'UI, Workflows, Data, Orchestration',
      color: 'violet',
    },
    talkieLive: {
      icon: 'Mic',
      name: 'TalkieLive',
      subtitle: 'Swift',
      description: 'Ears & Hands',
      color: 'emerald',
    },
    talkieEngine: {
      icon: 'Cpu',
      name: 'TalkieEngine',
      subtitle: 'Swift',
      description: 'Local Brain',
      color: 'blue',
    },
    talkieServer: {
      icon: 'Server',
      name: 'TalkieServer',
      subtitle: 'TypeScript',
      description: 'iOS Bridge',
      color: 'amber',
    },
    iCloud: {
      icon: 'Cloud',
      name: 'iCloud',
      subtitle: 'CloudKit',
      description: 'Memo Sync',
      color: 'sky',
    },
    iPhone: {
      icon: 'Smartphone',
      name: 'iPhone',
      subtitle: 'iOS',
      description: 'Voice Capture',
      color: 'zinc',
    },
    watch: {
      icon: 'Watch',
      name: 'Watch',
      subtitle: 'watchOS',
      color: 'zinc',
    },
  },
  connectors: [
    { from: 'talkie', to: 'talkieLive', fromAnchor: 'bottom', toAnchor: 'top', style: 'xpc' },
    { from: 'talkieLive', to: 'talkieEngine', fromAnchor: 'bottom', toAnchor: 'top', style: 'audio' },
    { from: 'talkie', to: 'talkieServer', fromAnchor: 'right', toAnchor: 'left', style: 'http' },
    { from: 'talkieServer', to: 'iPhone', fromAnchor: 'right', toAnchor: 'left', style: 'tailscale' },
    { from: 'iPhone', to: 'watch', fromAnchor: 'bottom', toAnchor: 'top', style: 'peer' },
    { from: 'talkie', to: 'iCloud', fromAnchor: 'bottomRight', toAnchor: 'left', style: 'cloudkit', curve: 'natural' },
    { from: 'iPhone', to: 'iCloud', fromAnchor: 'bottomLeft', toAnchor: 'right', style: 'cloudkit', curve: 'natural' },
  ],
  connectorStyles: {
    xpc: { color: 'sky', strokeWidth: 2, label: '', dashed: true },
    http: { color: 'amber', strokeWidth: 2, label: 'HTTP', dashed: true },
    tailscale: { color: 'sky', strokeWidth: 2, label: 'Tailscale', dashed: true },
    cloudkit: { color: 'sky', strokeWidth: 2, label: '', dashed: true },
    audio: { color: 'sky', strokeWidth: 2, label: '', dashed: true },
    peer: { color: 'sky', strokeWidth: 2, label: '', dashed: true },
  },
}

export default function DiagramEditor({
  initialData = null,
  themeId = null,
  colorMode,
  sessionId = null,
  initialDiagramMeta,
}: {
  initialData?: any
  themeId?: string | null
  colorMode?: 'light' | 'dark'
  sessionId?: string | null
  initialDiagramMeta?: Record<string, any>
}) {
  const init = useMemo<ArcEditorInit>(() => ({
    initialData,
    themeId,
    colorMode,
    sessionId,
    initialDiagramMeta,
  }), [initialData, themeId, colorMode, sessionId, initialDiagramMeta])

  const app = useMemo(
    () => createArcEditorApp(init, initialData || sampleDiagram),
    [init, initialData],
  )

  return (
    <div className="arc-editor-root">
      <AppShell
        app={app}
        assistant={false}
        defaultTheme={colorMode === 'dark' ? 'dark' : 'light'}
        defaultTemplate="hudson"
        chrome={{
          palette: false,
          terminal: false,
          leftPanel: false,
        }}
      />
    </div>
  )
}