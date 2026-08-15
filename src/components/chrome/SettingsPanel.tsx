// The settings surface behind the rail's gear: how the application chrome
// looks (skin, light/dark) and how big it is (the scale dials).
//
// Diagram appearance is not here on purpose — that belongs to the document, and
// lives in the inspector.

import { useEffect, useRef } from 'react'
import { useTheme } from 'hudsonkit/theme'
import { useChromeTheme } from '../../hooks/useChromeTheme'
import { useUiScale } from '../../hooks/useUiScale'
import { CHROME_THEMES } from '../../utils/chromeThemes'
import { UI_SCALE_LIMITS, UI_SCALE_PRESETS, matchPreset } from '../../utils/uiScale'

const MODES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Auto' },
] as const

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [chrome, setChrome] = useChromeTheme()
  const [scale, setScale] = useUiScale()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const activePreset = matchPreset(scale)
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target)) return
      if ((target as Element).closest?.('.arc-rail')) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div ref={ref} className="arc-settings-pop" role="dialog" aria-label="Settings">
      <div className="arc-settings-group">
        <div className="arc-settings-title">Chrome</div>
        <div className="arc-settings-themes">
          {CHROME_THEMES.map(t => (
            <button
              key={t.id}
              type="button"
              title={t.description}
              className={`arc-settings-theme${t.id === chrome ? ' is-active' : ''}`}
              onClick={() => setChrome(t.id)}
            >
              <span
                className="arc-settings-chip"
                style={{ background: isDark ? t.swatch[1] : t.swatch[0] }}
                aria-hidden="true"
              />
              <span className="arc-settings-theme-name">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="arc-settings-group">
        <div className="arc-settings-title">Mode</div>
        <div className="arc-settings-segmented">
          {MODES.map(m => (
            <button
              key={m.value}
              type="button"
              className={`arc-settings-segment${theme === m.value ? ' is-active' : ''}`}
              onClick={() => setTheme(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="arc-settings-group">
        <div className="arc-settings-title">Density</div>
        <div className="arc-scale-menu-presets">
          {UI_SCALE_PRESETS.map(p => (
            <button
              key={p.id}
              type="button"
              className={`arc-scale-preset${activePreset?.id === p.id ? ' is-active' : ''}`}
              onClick={() => setScale({ ui: p.ui, type: p.type })}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="arc-scale-row">
          <div className="arc-scale-row-head">
            <span className="arc-ui-label">Interface</span>
            <span className="arc-ui-value">{Math.round(scale.ui * 100)}%</span>
          </div>
          <input
            type="range"
            min={UI_SCALE_LIMITS.min}
            max={UI_SCALE_LIMITS.max}
            step={UI_SCALE_LIMITS.step}
            value={scale.ui}
            onChange={e => setScale({ ui: Number(e.target.value) })}
            aria-label="Interface scale"
          />
        </div>
        <div className="arc-scale-row">
          <div className="arc-scale-row-head">
            <span className="arc-ui-label">Text</span>
            <span className="arc-ui-value">{Math.round(scale.type * 100)}%</span>
          </div>
          <input
            type="range"
            min={UI_SCALE_LIMITS.min}
            max={UI_SCALE_LIMITS.max}
            step={UI_SCALE_LIMITS.step}
            value={scale.type}
            onChange={e => setScale({ type: Number(e.target.value) })}
            aria-label="Text scale"
          />
        </div>
      </div>

      <button
        type="button"
        className="arc-scale-reset"
        onClick={() => { setScale({ ui: 1, type: 1 }); setChrome('console') }}
      >
        Reset appearance
      </button>
    </div>
  )
}
