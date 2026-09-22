import type { ReactNode } from 'react'
import { useEditor, useDiagram } from '../editor/EditorProvider'
import { ANCHOR_POSITIONS, COLOR_OPTIONS, NODE_COLOR_HEX } from '../../utils/constants'
import {
  connectorArrowAt,
  connectorArrowSize,
  connectorLineStyle,
} from '../../utils/diagramHelpers'
import type { ArrowHead, ConnectorLineStyle } from '../../types/editor'
import {
  InspSection,
  InspTitle,
  InspField,
  InspLabel,
  InspSelect,
  InspInput,
  InspDivider,
  InspMeta,
  InspGrid2,
  InspKv,
  InspCheckbox,
  InspSubsectionTitle,
} from '../editor/inspector-ui'

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <InspField>
      <InspLabel>{label}</InspLabel>
      <InspSelect value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </InspSelect>
    </InspField>
  )
}

/** Slider with an 'auto' value — clicking the value clears the override. */
function AutoRange({
  label,
  value,
  autoValue,
  min,
  max,
  suffix,
  step,
  onChange,
}: {
  label: string
  value: number | undefined
  autoValue: number
  min: number
  max: number
  suffix?: string
  step?: number
  onChange: (value: number | undefined) => void
}) {
  return (
    <InspKv label={label}>
      <div className="arc-insp-range-row">
        <InspInput
          type="range"
          min={min}
          max={max}
          step={step ?? 1}
          value={value ?? autoValue}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <button
          type="button"
          className={`arc-insp-value${value == null ? ' is-auto' : ''}`}
          title={value == null ? 'Auto' : 'Reset to auto'}
          onClick={() => onChange(undefined)}
        >
          {value == null ? 'auto' : `${value}${suffix ?? ''}`}
        </button>
      </div>
    </InspKv>
  )
}

/** Segmented control with rendered content (line previews) instead of text. */
function PreviewSegments<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string; content: ReactNode }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="arc-insp-segmented" role="group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.label}
          aria-label={opt.label}
          aria-pressed={value === opt.value}
          className={`arc-insp-segment${value === opt.value ? ' is-active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.content}
        </button>
      ))}
    </div>
  )
}

const LINE_PREVIEW: Record<ConnectorLineStyle, ReactNode> = {
  solid: (
    <svg width="26" height="10" viewBox="0 0 26 10" aria-hidden="true">
      <line x1="2" y1="5" x2="24" y2="5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  dashed: (
    <svg width="26" height="10" viewBox="0 0 26 10" aria-hidden="true">
      <line x1="2" y1="5" x2="24" y2="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
    </svg>
  ),
  dotted: (
    <svg width="26" height="10" viewBox="0 0 26 10" aria-hidden="true">
      <line x1="2" y1="5" x2="24" y2="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="0.1 4" strokeLinecap="round" />
    </svg>
  ),
}

/** Tiny connector-end glyph: a stub line with the marker at its right end. */
function EndGlyphIcon({ kind }: { kind: ArrowHead }) {
  const marker: Record<ArrowHead, ReactNode> = {
    none: null,
    arrow: <path d="M12.5 3.2 L17 6 L12.5 8.8 Z" fill="currentColor" />,
    open: <path d="M13 2.6 L17 6 L13 9.4" fill="none" stroke="currentColor" strokeWidth="1.3" />,
    dot: <circle cx="14" cy="6" r="2.4" fill="currentColor" />,
    diamond: <path d="M11.5 6 L14.2 3.6 L16.9 6 L14.2 8.4 Z" fill="currentColor" />,
    bar: <line x1="14.5" y1="2.8" x2="14.5" y2="9.2" stroke="currentColor" strokeWidth="1.6" />,
  }
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
      <line x1="1" y1="6" x2={kind === 'none' ? 17 : 11.5} y2="6" stroke="currentColor" strokeWidth="1.3" />
      {marker[kind]}
    </svg>
  )
}

const ARROW_ENDS: { value: ArrowHead; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'arrow', label: 'Arrow' },
  { value: 'open', label: 'Open arrow' },
  { value: 'dot', label: 'Dot' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'bar', label: 'Bar' },
]

const RELATIONSHIP_KINDS = ['custom', 'calls', 'owns', 'syncs', 'reads', 'writes', 'hosts', 'auth']

export default function ConnectorProperties({ connectorIndex }: { connectorIndex: number }) {
  const { actions, dispatch } = useEditor()
  const diagram = useDiagram()

  const connector = diagram.connectors[connectorIndex]
  if (!connector) return null

  const currentStyle = diagram.connectorStyles[connector.style]

  const handleUpdate = (field: string, value: unknown) => {
    actions.updateConnector(connectorIndex, { [field]: value })
  }

  const handleStyleUpdate = (field: string, value: unknown) => {
    dispatch({
      type: 'connectorStyle/update',
      styleName: connector.style,
      updates: { [field]: value },
    })
  }

  const styleOptions = Object.keys(diagram.connectorStyles).map((key) => ({
    value: key,
    label: `${key} (${diagram.connectorStyles[key].label || key})`,
  }))

  const anchorOptions = ANCHOR_POSITIONS.map((pos) => ({ value: pos, label: pos }))
  const nodeOptions = Object.keys(diagram.nodes).map((id) => ({
    value: id,
    label: diagram.nodeData[id]?.name || id,
  }))

  const lineStyle = currentStyle ? connectorLineStyle(currentStyle) : 'solid'
  const fromArrow = currentStyle ? connectorArrowAt(currentStyle, 'from') : 'none'
  const toArrow = currentStyle ? connectorArrowAt(currentStyle, 'to') : 'arrow'
  const fromArrowAuto = currentStyle ? connectorArrowSize(currentStyle, 'from') : 8
  const toArrowAuto = currentStyle ? connectorArrowSize(currentStyle, 'to') : 8
  const styleNames = Object.keys(diagram.connectorStyles)

  return (
    <InspSection>
      <div className="arc-insp-heading">
        <InspTitle>Connector</InspTitle>
        <span className="arc-insp-kindchip">{connector.kind || 'custom'}</span>
      </div>

      <InspGrid2>
        <SelectField label="From" value={connector.from} onChange={(v) => handleUpdate('from', v)} options={nodeOptions} />
        <SelectField label="From anchor" value={connector.fromAnchor} onChange={(v) => handleUpdate('fromAnchor', v)} options={anchorOptions} />
        <SelectField label="To" value={connector.to} onChange={(v) => handleUpdate('to', v)} options={nodeOptions} />
        <SelectField label="To anchor" value={connector.toAnchor} onChange={(v) => handleUpdate('toAnchor', v)} options={anchorOptions} />
      </InspGrid2>

      <InspDivider />
      <InspSubsectionTitle>Appearance</InspSubsectionTitle>

      <InspKv label="stroke">
        <div className="arc-insp-swatch-row">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleStyleUpdate('color', color)}
              title={color}
              className={`arc-insp-swatch${currentStyle?.color === color ? ' is-selected' : ''}`}
              style={{ backgroundColor: NODE_COLOR_HEX[color] }}
            />
          ))}
          <button
            type="button"
            onClick={() => handleStyleUpdate('color', undefined)}
            title="Auto color"
            className={`arc-insp-value is-chip${currentStyle?.color == null ? ' is-auto' : ''}`}
          >
            auto
          </button>
        </div>
      </InspKv>

      <AutoRange
        label="width"
        value={currentStyle?.strokeWidth}
        autoValue={2}
        min={0.5}
        max={8}
        step={0.5}
        suffix="px"
        onChange={(v) => handleStyleUpdate('strokeWidth', v)}
      />

      <AutoRange
        label="opacity"
        value={currentStyle?.opacity != null ? Math.round(currentStyle.opacity * 100) : undefined}
        autoValue={100}
        min={10}
        max={100}
        suffix="%"
        onChange={(v) => handleStyleUpdate('opacity', v == null ? undefined : v / 100)}
      />

      <InspKv label="style">
        <PreviewSegments<ConnectorLineStyle>
          value={lineStyle}
          onChange={(v) => handleStyleUpdate('lineStyle', v)}
          options={[
            { value: 'solid', label: 'Solid', content: LINE_PREVIEW.solid },
            { value: 'dashed', label: 'Dashed', content: LINE_PREVIEW.dashed },
            { value: 'dotted', label: 'Dotted', content: LINE_PREVIEW.dotted },
          ]}
        />
      </InspKv>

      <InspKv label="animated">
        <PreviewSegments<'on' | 'off'>
          value={currentStyle?.animated === false ? 'off' : 'on'}
          onChange={(v) => handleStyleUpdate('animated', v === 'on')}
          options={[
            { value: 'off', label: 'Off', content: 'off' },
            { value: 'on', label: 'On', content: 'on' },
          ]}
        />
      </InspKv>

      <InspKv label="bidir">
        <PreviewSegments<'on' | 'off'>
          value={currentStyle?.bidirectional === true ? 'on' : 'off'}
          onChange={(v) => handleStyleUpdate('bidirectional', v === 'on')}
          options={[
            { value: 'off', label: 'Off', content: 'off' },
            { value: 'on', label: 'On', content: 'on' },
          ]}
        />
      </InspKv>

      <InspKv label="dots">
        <PreviewSegments<'on' | 'off'>
          value={currentStyle?.showEndpoints === false ? 'off' : 'on'}
          onChange={(v) => handleStyleUpdate('showEndpoints', v === 'on')}
          options={[
            { value: 'off', label: 'Off', content: 'off' },
            { value: 'on', label: 'On', content: 'on' },
          ]}
        />
      </InspKv>

      <InspDivider />
      <InspSubsectionTitle>Routing</InspSubsectionTitle>

      <InspKv label="routing">
        <PreviewSegments<string>
          value={connector.curve === 'natural' ? 'curved' : connector.curve === 'step' ? 'elbow' : connector.curve === 'direct' ? 'direct' : 'auto'}
          onChange={(v) =>
            handleUpdate('curve', v === 'auto' ? undefined : v === 'curved' ? 'natural' : v === 'elbow' ? 'step' : 'direct')
          }
          options={[
            { value: 'auto', label: 'Auto', content: 'auto' },
            { value: 'direct', label: 'Direct', content: 'direct' },
            { value: 'curved', label: 'Curved', content: 'curved' },
            { value: 'elbow', label: 'Elbow', content: 'elbow' },
          ]}
        />
      </InspKv>

      {connector.curve === 'natural' && (
        <InspKv label="tension">
          <div className="arc-insp-range-row">
            <InspInput
              type="range"
              min={20}
              max={100}
              value={connector.curveDepth ?? 50}
              onChange={(e) => handleUpdate('curveDepth', parseInt(e.target.value, 10))}
            />
            <span className="arc-insp-kv-value">{connector.curveDepth ?? 50}%</span>
          </div>
        </InspKv>
      )}

      <InspKv label="label">
        <InspInput
          type="text"
          value={connector.label ?? currentStyle?.label ?? ''}
          placeholder="(none)"
          onChange={(e) => handleUpdate('label', e.target.value || undefined)}
        />
      </InspKv>

      <InspKv label="from end">
        <div className="arc-insp-ends">
          {ARROW_ENDS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              title={opt.label}
              aria-label={opt.label}
              className={`arc-insp-icon-btn${fromArrow === opt.value ? ' is-selected' : ''}`}
              onClick={() => handleStyleUpdate('fromArrow', opt.value)}
            >
              <EndGlyphIcon kind={opt.value} />
            </button>
          ))}
        </div>
      </InspKv>

      <AutoRange
        label="from size"
        value={currentStyle?.fromArrowSize}
        autoValue={fromArrowAuto}
        min={4}
        max={20}
        suffix="px"
        onChange={(v) => handleStyleUpdate('fromArrowSize', v)}
      />

      <InspKv label="to end">
        <div className="arc-insp-ends">
          {ARROW_ENDS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              title={opt.label}
              aria-label={opt.label}
              className={`arc-insp-icon-btn${toArrow === opt.value ? ' is-selected' : ''}`}
              onClick={() => handleStyleUpdate('toArrow', opt.value)}
            >
              <EndGlyphIcon kind={opt.value} />
            </button>
          ))}
        </div>
      </InspKv>

      <AutoRange
        label="to size"
        value={currentStyle?.toArrowSize}
        autoValue={toArrowAuto}
        min={4}
        max={20}
        suffix="px"
        onChange={(v) => handleStyleUpdate('toArrowSize', v)}
      />

      <InspCheckbox
        label="sizes follow .width"
        checked={currentStyle?.arrowScale === true}
        onChange={(v) => handleStyleUpdate('arrowScale', v)}
      />

      <InspDivider />
      <InspSubsectionTitle>Relationship</InspSubsectionTitle>

      <InspKv label="kind">
        <InspSelect value={connector.kind || 'custom'} onChange={(e) => handleUpdate('kind', e.target.value)}>
          {RELATIONSHIP_KINDS.map((kind) => (
            <option key={kind} value={kind}>{kind}</option>
          ))}
        </InspSelect>
      </InspKv>

      <InspKv label="from role">
        <InspInput
          type="text"
          value={connector.fromRole ?? ''}
          placeholder="e.g. owner 1"
          onChange={(e) => handleUpdate('fromRole', e.target.value || undefined)}
        />
      </InspKv>

      <InspKv label="to role">
        <InspInput
          type="text"
          value={connector.toRole ?? ''}
          placeholder="e.g. items 0..*"
          onChange={(e) => handleUpdate('toRole', e.target.value || undefined)}
        />
      </InspKv>

      <InspDivider />
      <InspSubsectionTitle>Layer</InspSubsectionTitle>

      {styleNames.length <= 5 ? (
        <PreviewSegments<string>
          value={connector.style}
          onChange={(v) => handleUpdate('style', v)}
          options={styleNames.map((name) => ({ value: name, label: name, content: name }))}
        />
      ) : (
        <InspKv label="layer">
          <InspSelect value={connector.style} onChange={(e) => handleUpdate('style', e.target.value)}>
            {styleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </InspSelect>
        </InspKv>
      )}

      <InspDivider />
      <InspMeta>
        <div>Index: {connectorIndex}</div>
        <div>Style: {connector.style}</div>
      </InspMeta>
    </InspSection>
  )
}
