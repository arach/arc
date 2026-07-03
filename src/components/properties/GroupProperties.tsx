import { useEditor, useDiagram } from '../editor/EditorProvider'
import {
  InspSection,
  InspTitle,
  InspField,
  InspLabel,
  InspInput,
  InspDivider,
  InspMeta,
  InspGrid2,
  InspCheckbox,
  InspSegmented,
} from '../editor/inspector-ui'
import ColorPicker from './ColorPicker'

function InputField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string | number
  onChange: (value: number | string) => void
  type?: string
}) {
  return (
    <InspField>
      <InspLabel>{label}</InspLabel>
      <InspInput
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? parseInt(e.target.value, 10) || 0 : e.target.value)}
      />
    </InspField>
  )
}

export default function GroupProperties({ groupId }: { groupId: string }) {
  const { actions } = useEditor()
  const diagram = useDiagram()

  const group = diagram.groups?.find((g) => g.id === groupId)
  if (!group) return null

  const handleUpdate = (field: string, value: unknown) => {
    actions.updateGroup(groupId, { [field]: value })
  }

  return (
    <InspSection>
      <InspTitle>Group</InspTitle>

      <InputField label="Label" value={group.label} onChange={(v) => handleUpdate('label', v)} />

      <InspField>
        <InspLabel>Shape</InspLabel>
        <InspSegmented
          value={group.type || 'rect'}
          options={[
            { value: 'rect', label: 'Rect' },
            { value: 'circle', label: 'Circle' },
          ]}
          onChange={(v) => handleUpdate('type', v)}
        />
      </InspField>

      <InspField>
        <InspLabel>Color</InspLabel>
        <ColorPicker value={group.color} onChange={(v) => handleUpdate('color', v)} />
      </InspField>

      <InspCheckbox label="Dashed border" checked={group.dashed ?? true} onChange={(v) => handleUpdate('dashed', v)} />

      <InspField>
        <InspLabel>Dimensions</InspLabel>
        <InspGrid2>
          <InputField label="X" type="number" value={group.x} onChange={(v) => handleUpdate('x', v)} />
          <InputField label="Y" type="number" value={group.y} onChange={(v) => handleUpdate('y', v)} />
          <InputField label="Width" type="number" value={group.width} onChange={(v) => handleUpdate('width', v)} />
          <InputField label="Height" type="number" value={group.height} onChange={(v) => handleUpdate('height', v)} />
        </InspGrid2>
      </InspField>

      <InspDivider />
      <InspMeta>ID: {groupId}</InspMeta>
    </InspSection>
  )
}