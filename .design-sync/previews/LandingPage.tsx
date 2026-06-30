// Owned preview — stories for the Arc marketing homepage.
// Imported by relative path to the design-sync entry; the story-imports policy
// redirects it to the shipped window.Arc.LandingPage bundle export.
import { LandingPage } from '../../src/design-sync-extra'

/** The full Arc homepage — hero, install, architecture, docs. Fills the card
 *  viewport width (set via overrides.LandingPage.viewport in config.json). */
export function Homepage() {
  return (
    <div style={{ width: '100%' }}>
      <LandingPage />
    </div>
  )
}
