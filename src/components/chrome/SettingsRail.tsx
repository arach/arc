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

const SURFACES = [
  { to: '/editor', label: 'Editor', icon: PenLine },
  { to: '/showcase', label: 'Player', icon: SlidersHorizontal },
]

export default function SettingsRail({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  // Mounting these applies the persisted skin + scale on every surface.
  const [chrome] = useChromeTheme()
  const [scale] = useUiScale()
  const meta = getChromeThemeMeta(chrome)

  return (
    <div className="arc-rail">
      {SURFACES.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
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
        className="arc-rail-btn"
        title={`Text scale — ${Math.round(scale.type * 100)}%`}
        aria-label="Text scale"
        onClick={() => setOpen(true)}
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
