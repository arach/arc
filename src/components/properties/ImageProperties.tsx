import { Trash2 } from 'lucide-react'
import { useDiagram, useEditor } from '../editor/EditorProvider'
import {
  InspSection,
  InspTitle,
  InspField,
  InspLabel,
  InspInput,
  InspGrid2,
  InspIconButton,
} from '../editor/inspector-ui'

export default function ImageProperties({ imageId }: { imageId: string }) {
  const { actions } = useEditor()
  const diagram = useDiagram()

  const image = (diagram.images || []).find((img) => img.id === imageId)
  if (!image) return null

  const handleUpdate = (updates: Record<string, unknown>) => {
    actions.updateImage(imageId, updates)
  }

  return (
    <InspSection>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <InspTitle>Image</InspTitle>
        <InspIconButton label="Delete image" tone="danger" onClick={() => actions.removeImage(imageId)}>
          <Trash2 size={15} />
        </InspIconButton>
      </div>

      <div className="arc-insp-preview">
        <img src={image.src} alt={image.name || 'Dropped image'} />
      </div>

      <InspField>
        <InspLabel>Name</InspLabel>
        <InspInput
          type="text"
          value={image.name || ''}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          placeholder="Image name"
        />
      </InspField>

      <InspGrid2>
        <InspField>
          <InspLabel>X</InspLabel>
          <InspInput type="number" value={image.x} onChange={(e) => handleUpdate({ x: parseInt(e.target.value, 10) || 0 })} />
        </InspField>
        <InspField>
          <InspLabel>Y</InspLabel>
          <InspInput type="number" value={image.y} onChange={(e) => handleUpdate({ y: parseInt(e.target.value, 10) || 0 })} />
        </InspField>
        <InspField>
          <InspLabel>Width</InspLabel>
          <InspInput type="number" value={image.width} onChange={(e) => handleUpdate({ width: parseInt(e.target.value, 10) || 0 })} />
        </InspField>
        <InspField>
          <InspLabel>Height</InspLabel>
          <InspInput type="number" value={image.height} onChange={(e) => handleUpdate({ height: parseInt(e.target.value, 10) || 0 })} />
        </InspField>
      </InspGrid2>

      <InspField>
        <InspLabel>Opacity</InspLabel>
        <InspInput
          type="range"
          min={0}
          max={100}
          value={Math.round((image.opacity ?? 1) * 100)}
          onChange={(e) => handleUpdate({ opacity: parseInt(e.target.value, 10) / 100 })}
        />
      </InspField>
    </InspSection>
  )
}