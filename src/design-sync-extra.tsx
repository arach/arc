// Design-sync-only entry — NOT part of the published package (src/index.ts).
//
// The Arc marketing homepage (src/components/LandingPage.tsx) is an app-internal
// page: it needs a react-router context for its <Link>s and an onLaunchEditor
// callback. This module re-exports it as a self-contained component so the
// design-sync converter can bundle it onto window.Arc and render it as a card
// in the "Arc — Design System" project, without polluting the published API.
//
// Wired in via `extraEntries` in .design-sync/config.json.
import { MemoryRouter } from 'react-router-dom'
import LandingPageImpl from './components/LandingPage'
import DiagramEditorImpl from './components/editor/DiagramEditor'

/**
 * Standalone Arc homepage — the full marketing page (hero, install, architecture,
 * docs grid) wrapped in a MemoryRouter with a no-op launch handler so it renders
 * with no host router and no required props.
 */
export function LandingPage() {
  return (
    <MemoryRouter>
      <LandingPageImpl onLaunchEditor={() => {}} />
    </MemoryRouter>
  )
}

/**
 * Standalone Arc studio — the full diagram editor (top bar, canvas, floating
 * toolbar, properties panel) loaded with the built-in sample diagram. The real
 * DiagramEditor self-wraps its EditorProvider and is h-screen, so it fills the
 * card viewport with no host state, router, or required props.
 */
export function DiagramStudio() {
  return <DiagramEditorImpl isDark={false} onToggleTheme={() => {}} />
}
