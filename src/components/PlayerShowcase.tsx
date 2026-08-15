// /showcase — a live harness for the player (the read-only ArcDiagram renderer
// behind /player/*), rendered in the same Hudson shell as the editor.
//
// The stage, control rail, nav and status bar live in src/apps/arc-showcase/.

import { useMemo } from 'react'
import { AppShell } from 'hudsonkit/app-shell'
import { createShowcaseApp } from '../apps/arc-showcase/createShowcaseApp'
import { useMeta } from '../hooks/useMeta'
import '../editor-shell.css'

export default function PlayerShowcase() {
  useMeta({
    title: 'Arc | Player showcase',
    description: 'Every rendering option of the Arc player, live: templates, chrome, zoom, hover behaviour.',
    url: '/showcase',
  })

  const app = useMemo(() => createShowcaseApp(), [])

  return (
    <div className="arc-editor-root">
      <AppShell
        app={app}
        assistant={false}
        defaultTheme="dark"
        defaultTemplate="hudson"
        chrome={{ palette: false, terminal: false, leftPanel: false }}
      />
    </div>
  )
}
