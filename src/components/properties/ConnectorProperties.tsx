import { useEditor, useDiagram } from '../editor/EditorProvider'
import { ANCHOR_POSITIONS } from '../../utils/constants'
import {
  InspSection,
  InspTitle,
  InspField,
  InspLabel,
  InspSelect,
  InspDivider,
  InspMeta,
  InspGrid2,
  InspCheckbox,
  InspRange,
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

  return (
    <InspSection>
      <InspTitle>Connector</InspTitle>

      <SelectField label="Style" value={connector.style} onChange={(v) => handleUpdate('style', v)} options={styleOptions} />

      <InspGrid2>
        <SelectField label="From" value={connector.from} onChange={(v) => handleUpdate('from', v)} options={nodeOptions} />
        <SelectField label="From anchor" value={connector.fromAnchor} onChange={(v) => handleUpdate('fromAnchor', v)} options={anchorOptions} />
        <SelectField label="To" value={connector.to} onChange={(v) => handleUpdate('to', v)} options={nodeOptions} />
        <SelectField label="To anchor" value={connector.toAnchor} onChange={(v) => handleUpdate('toAnchor', v)} options={anchorOptions} />
      </InspGrid2>

      <SelectField
        label="Path style"
        value={connector.curve || 'auto'}
        onChange={(v) => handleUpdate('curve', v === 'auto' ? undefined : v)}
        options={[
          { value: 'auto', label: 'Auto' },
          { value: 'natural', label: 'Natural curve' },
        ]}
      />

      {connector.curve === 'natural' && (
        <InspRange
          label="Curve tension"
          value={connector.curveDepth ?? 50}
          min={20}
          max={100}
          suffix="%"
          onChange={(v) => handleUpdate('curveDepth', v)}
        />
      )}

      <InspDivider />
      <InspSubsectionTitle>Style options</InspSubsectionTitle>

      <InspCheckbox label="Show arrow" checked={currentStyle?.showArrow !== false} onChange={(v) => handleStyleUpdate('showArrow', v)} />
      <InspCheckbox label="Show endpoint dots" checked={currentStyle?.showEndpoints !== false} onChange={(v) => handleStyleUpdate('showEndpoints', v)} />
      <InspCheckbox label="Dashed line" checked={currentStyle?.dashed === true} onChange={(v) => handleStyleUpdate('dashed', v)} />
      <InspCheckbox label="Bidirectional" checked={currentStyle?.bidirectional === true} onChange={(v) => handleStyleUpdate('bidirectional', v)} />
      {currentStyle?.dashed && (
        <InspCheckbox label="Animated motion" checked={currentStyle?.animated !== false} onChange={(v) => handleStyleUpdate('animated', v)} />
      )}

      <InspDivider />
      <InspMeta>
        <div>Index: {connectorIndex}</div>
        <div>Style: {connector.style}</div>
      </InspMeta>
    </InspSection>
  )
}