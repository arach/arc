// The left rail — a thin strip down the side of the shell whose bottom slot
// holds appearance settings. Rendered through Hudson's LeftPanel slot, so it
// sits between the nav and the status bar on every app surface.

import { useState } from 'react'
import { Settings2, Type } from 'lucide-react'
import SettingsPanel from './SettingsPanel'
import { useChromeTheme } from '../../hooks/useChromeTheme'
import { useUiScale } from '../../hooks/useUiScale'
import { getChromeThemeMeta } from '../../utils/chromeThemes'

export default function SettingsRail() {
  const [open, setOpen] = useState(false)
  // Mounting these applies the persisted skin + scale on every surface.
  const [chrome] = useChromeTheme()
  const [scale] = useUiScale()
  const meta = getChromeThemeMeta(chrome)

  return (
    <div className="arc-rail">
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
