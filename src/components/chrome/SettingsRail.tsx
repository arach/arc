// The left rail — surface navigation at the top, appearance at the bottom.
//
// Rendered as the first column of each app's Content slot, so it sits between
// the nav and the status bar on every surface. Apps pass their own middle
// items (markup, viewer links) through `children`.

import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { PenLine, Settings2, SlidersHorizontal, Type } from 'lucide-react'
import SettingsPanel from './SettingsPanel'
import { useChromeTheme } from '../../hooks/useChromeTheme'
import { useUiScale } from '../../hooks/useUiScale'
import { getChromeThemeMeta } from '../../utils/chromeThemes'
import { lastSessionId } from '../../utils/sessionStorage'

interface SettingsRailProps {
  children?: ReactNode
  /**
   * Where the Editor button goes. Bare /editor mints a new session, so a
   * surface that already has one passes it here rather than throwing the
   * open diagram away on a click.
   */
  editorTo?: string
}

export default function SettingsRail({ children, editorTo }: SettingsRailProps) {
  const [open, setOpen] = useState(false)
  // Mounting these applies the persisted skin + scale on every surface.
  const [chrome] = useChromeTheme()
  const [scale] = useUiScale()
  const meta = getChromeThemeMeta(chrome)
  // Resolved once per mount: coming back from another surface should land on
  // the diagram that was open, not a blank canvas.
  const [resumeTo] = useState(() => {
    const id = lastSessionId()
    return id ? `/editor/${id}` : '/editor'
  })

  const surfaces = [
    { to: editorTo ?? resumeTo, match: '/editor', label: 'Editor', icon: PenLine },
    { to: '/showcase', match: '/showcase', label: 'Player', icon: SlidersHorizontal },
  ]

  return (
    <div className="arc-rail">
      {surfaces.map(({ to, match, label, icon: Icon }) => (
        <NavLink
          key={match}
          to={to}
          className={({ isActive }) => `arc-rail-btn${isActive ? ' is-active' : ''}`}
          title={label}
          aria-label={label}
        >
          <Icon strokeWidth={1.75} />
        </NavLink>
      ))}

      <span className="arc-rail-divider" />

      {children}

      <div className="arc-rail-spacer" />

      <button
        type="button"
        className={`arc-rail-btn${open ? ' is-active' : ''}`}
        title={`Text scale — ${Math.round(scale.type * 100)}%`}
        aria-label="Text scale"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <Type strokeWidth={1.75} />
      </button>

      <button
        type="button"
        className={`arc-rail-btn${open ? ' is-active' : ''}`}
        title={`Appearance — ${meta.name}`}
        aria-label="Appearance settings"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <Settings2 strokeWidth={1.75} />
      </button>

      {open && <SettingsPanel onClose={() => setOpen(false)} />}
    </div>
  )
}
