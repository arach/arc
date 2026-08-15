// Hudson Inspector slot for /showcase — the control rail.
//
// Built from the editor's inspector primitives (inspector-ui.tsx) so the rail
// is the same design system as the editor's, and inherits the chrome scale.

import {
  InspCheckbox,
  InspField,
  InspGrid2,
  InspHint,
  InspInput,
  InspLabel,
  InspLinkButton,
  InspRoot,
  InspSection,
  InspSegmented,
  InspSelect,
  InspTitle,
} from '../../components/editor/inspector-ui'
import { SHOWCASE_DOCS } from './documents'
import { getTheme, getThemeList, type ThemeId } from '../../utils/themes'
import {
  CORNERS,
  FRAMES,
  SIZE_PRESETS,
  useShowcase,
  type FrameChoice,
} from './ShowcaseContext'

const THEMES = getThemeList()

/** Float-capable range row (InspRange is integer-only). */
function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  disabled,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format: (v: number) => string
  disabled?: boolean
}) {
  return (
    <InspField className={disabled ? 'is-disabled' : ''}>
      <InspLabel>{`${label}: ${format(value)}`}</InspLabel>
      <InspInput
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
    </InspField>
  )
}

export default function ShowcaseInspector() {
  const s = useShowcase()
  const theme = getTheme(s.themeId)
  const hasTitleBlock = !!theme.brand?.titleBlock
  const sizePreset = SIZE_PRESETS.find(p => p.width === s.width && p.height === s.height)?.id ?? 'custom'

  return (
    <div className="arc-editor-inspector">
      <InspRoot>
        <InspSection>
          <InspTitle>Document</InspTitle>
          {SHOWCASE_DOCS.map(d => (
            <button
              key={d.id}
              type="button"
              className={`arc-insp-list-item${d.id === s.docId ? ' is-active' : ''}`}
              onClick={() => s.setDocId(d.id)}
            >
              <span className="arc-insp-dot" style={{ background: d.id === s.docId ? 'var(--arc-acc)' : 'var(--arc-line-2)' }} />
              <span className="arc-insp-list-item-label">{d.name}</span>
              <span className="arc-insp-list-item-meta">{d.blurb}</span>
            </button>
          ))}
          <InspHint>{s.doc.demonstrates}</InspHint>
        </InspSection>

        <InspSection>
          <InspTitle>Template</InspTitle>
          <InspGrid2>
            {THEMES.map(t => (
              <button
                key={t.id}
                type="button"
                title={t.description}
                className={`arc-insp-list-item arc-showcase-theme${t.id === s.themeId ? ' is-active' : ''}`}
                onClick={() => s.setThemeId(t.id as ThemeId)}
              >
                <span className="arc-showcase-swatch" aria-hidden="true">
                  {(['violet', 'emerald', 'amber'] as const).map(c => (
                    <span key={c} style={{ background: getTheme(t.id)[s.mode].palette[c].stroke }} />
                  ))}
                </span>
                <span className="arc-insp-list-item-label">{t.name}</span>
              </button>
            ))}
          </InspGrid2>
          <InspField>
            <InspLabel>Mode</InspLabel>
            <InspSegmented
              value={s.mode}
              onChange={v => s.setMode(v as 'dark' | 'light')}
              options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]}
            />
          </InspField>
        </InspSection>

        <InspSection>
          <InspTitle>Canvas</InspTitle>
          <InspField>
            <InspLabel>Stage size</InspLabel>
            <InspSegmented
              value={sizePreset}
              onChange={id => {
                const preset = SIZE_PRESETS.find(p => p.id === id)
                if (preset) { s.setWidth(preset.width); s.setHeight(preset.height); s.setFill(false) }
              }}
              options={[
                ...SIZE_PRESETS.map(p => ({ value: p.id as string, label: p.label })),
                { value: 'custom', label: '·' },
              ]}
            />
          </InspField>
          <InspRowFields>
            <InspField>
              <InspLabel>Width</InspLabel>
              <InspInput
                type="number"
                min={280}
                max={2400}
                value={s.width}
                disabled={s.fill}
                onChange={e => s.setWidth(Number(e.target.value) || s.width)}
              />
            </InspField>
            <InspField>
              <InspLabel>Height</InspLabel>
              <InspInput
                type="number"
                min={220}
                max={1600}
                value={s.height}
                onChange={e => s.setHeight(Number(e.target.value) || s.height)}
              />
            </InspField>
          </InspRowFields>
          <InspCheckbox label="Fill available width" checked={s.fill} onChange={s.setFill} />
        </InspSection>

        <InspSection>
          <InspTitle>Zoom</InspTitle>
          <InspField>
            <InspLabel>Start</InspLabel>
            <InspSegmented
              value={s.zoom === 'fit' ? 'fit' : String(s.zoom)}
              onChange={v => s.setZoom(v === 'fit' ? 'fit' : Number(v))}
              options={[
                { value: 'fit', label: 'Fit' },
                { value: '0.5', label: '50' },
                { value: '0.75', label: '75' },
                { value: '1', label: '100' },
                { value: '1.25', label: '125' },
              ]}
            />
          </InspField>
          <RangeField
            label="Max fit zoom"
            value={s.maxFit}
            min={0.3}
            max={1.5}
            step={0.05}
            disabled={s.zoom !== 'fit'}
            onChange={s.setMaxFit}
            format={v => `${Math.round(v * 100)}%`}
          />
          <InspCheckbox
            label="Interactive (scroll zoom, drag pan)"
            checked={s.interactive}
            onChange={v => { s.setInteractive(v); if (!v) s.setControls(false) }}
          />
          <InspCheckbox label="Zoom controls" checked={s.controls} onChange={s.setControls} />
        </InspSection>

        <InspSection>
          <InspTitle>Chrome</InspTitle>
          <InspCheckbox label="Legend / key" checked={s.legend} onChange={s.setLegend} />
          <InspCheckbox label="Minimap" checked={s.minimap} onChange={s.setMinimap} />
          <InspCheckbox label="Source toggle (.arc)" checked={s.source} onChange={s.setSource} />
          <InspCheckbox
            label={s.doc.data.focusTargets ? 'Focus story' : 'Focus story (none declared)'}
            checked={s.focusStory && !!s.doc.data.focusTargets}
            onChange={s.setFocusStory}
          />
          <InspCheckbox label="Auto-layout button" checked={s.autoLayoutBtn} onChange={s.setAutoLayoutBtn} />
          <InspCheckbox
            label={hasTitleBlock ? 'Diagram label (template draws a title block)' : 'Diagram label'}
            checked={s.label}
            onChange={s.setLabel}
          />
          <InspField>
            <InspLabel>Label corner</InspLabel>
            <InspSegmented
              value={s.corner}
              onChange={v => s.setCorner(v as typeof s.corner)}
              options={CORNERS.map(c => ({ value: c, label: c.split('-').map(w => w[0].toUpperCase()).join('') }))}
            />
          </InspField>
          <InspField>
            <InspLabel>Frame</InspLabel>
            <InspSelect value={s.frame} onChange={e => s.setFrame(e.target.value as FrameChoice)}>
              {FRAMES.map(f => (
                <option key={f} value={f}>
                  {f === 'theme' ? `Template (${theme.brand?.frame ?? 'hairline'})` : f}
                </option>
              ))}
            </InspSelect>
          </InspField>
        </InspSection>

        <InspSection>
          <InspTitle>Hover</InspTitle>
          <InspCheckbox label="Hover effects" checked={s.hover} onChange={s.setHover} />
          <InspCheckbox label="Dim unrelated" checked={s.dim} onChange={s.setDim} />
          <RangeField
            label="Dim opacity"
            value={s.dimOpacity}
            min={0.1}
            max={1}
            step={0.05}
            disabled={!s.hover || !s.dim}
            onChange={s.setDimOpacity}
            format={v => v.toFixed(2)}
          />
          <InspCheckbox label="Lift" checked={s.lift} onChange={s.setLift} />
          <InspCheckbox label="Glow" checked={s.glow} onChange={s.setGlow} />
          <InspCheckbox label="Highlight edges" checked={s.edges} onChange={s.setEdges} />
        </InspSection>

        <InspSection>
          <InspLinkButton onClick={s.reset}>Reset to defaults</InspLinkButton>
        </InspSection>
      </InspRoot>
    </div>
  )
}

/** Two fields side by side (InspRow is a plain 2-col grid). */
function InspRowFields({ children }: { children: React.ReactNode }) {
  return <div className="arc-insp-grid-2">{children}</div>
}
