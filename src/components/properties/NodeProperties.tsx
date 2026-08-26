import { useEditor, useDiagram, useViewMode, useResolvedBrand } from '../editor/EditorProvider'
import { SIZE_OPTIONS, NODE_SIZES } from '../../utils/constants'
import {
  InspSection,
  InspTitle,
  InspField,
  InspLabel,
  InspInput,
  InspDivider,
  InspMeta,
  InspLinkButton,
  InspSegmented,
  InspGrid2,
  InspRange,
  InspSubsectionTitle,
} from '../editor/inspector-ui'
import IconPicker from './IconPicker'
import ColorPicker from './ColorPicker'
import ShapePicker from './ShapePicker'
import { resolveNodeRadius } from '../../utils/themes'
import { resolveNodeShape } from '../../utils/nodeShape'

const DEFAULT_ISO_HEIGHT = 25
const DEFAULT_ISO_DEPTH = 50
const SIZE_LABELS: Record<string, string> = { xs: 'XS', s: 'S', m: 'M', l: 'L' }

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string | number
  onChange: (value: string | number) => void
  placeholder?: string
  type?: string
}) {
  return (
    <InspField>
      <InspLabel>{label}</InspLabel>
      <InspInput
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? parseInt(e.target.value, 10) || 0 : e.target.value)}
        placeholder={placeholder}
      />
    </InspField>
  )
}

export default function NodeProperties({ nodeId }: { nodeId: string }) {
  const { actions } = useEditor()
  const diagram = useDiagram()
  const viewMode = useViewMode()
  const brand = useResolvedBrand()

  const node = diagram.nodes[nodeId]
  const data = diagram.nodeData[nodeId]

  if (!node || !data) return null

  const handleUpdate = (field: string, value: unknown) => {
    actions.updateNode(nodeId, { [field]: value })
  }

  const handleResize = (size: string) => {
    actions.resizeNode(nodeId, size)
  }

  const handleDimensionChange = (dimension: 'width' | 'height', value: number) => {
    if (dimension === 'width') {
      actions.resizeNode(nodeId, undefined, value, undefined)
    } else {
      actions.resizeNode(nodeId, undefined, undefined, value)
    }
  }

  const handleIsoPropertyChange = (property: string, value: number) => {
    actions.updateNodePosition(nodeId, { [property]: value })
  }

  const presetSize = NODE_SIZES[node.size] || NODE_SIZES.m
  const currentWidth = node.width || presetSize.width
  const currentHeight = node.height || presetSize.height
  const hasCustomDimensions = node.width !== undefined || node.height !== undefined

  // What the theme would draw, so the picker can show where an un-overridden
  // node gets its silhouette from rather than showing nothing selected.
  const themeShape = resolveNodeShape(brand?.nodeShape, resolveNodeRadius(brand))

  const isIsometric = viewMode === 'isometric'
  const isoZ = node.z ?? 0
  const isoHeight = node.isoHeight ?? DEFAULT_ISO_HEIGHT
  const isoDepth = node.isoDepth ?? DEFAULT_ISO_DEPTH

  return (
    <InspSection>
      <InspTitle>Node</InspTitle>

      <InputField label="Name" value={data.name} onChange={(v) => handleUpdate('name', v)} placeholder="Node name" />
      <InputField label="Subtitle" value={data.subtitle} onChange={(v) => handleUpdate('subtitle', v)} placeholder="e.g. Swift" />
      <InputField label="Description" value={data.description} onChange={(v) => handleUpdate('description', v)} placeholder="Brief description" />

      <InspField>
        <InspLabel>Size</InspLabel>
        <InspSegmented
          value={node.size || 'm'}
          options={SIZE_OPTIONS.map((s) => ({ value: s, label: SIZE_LABELS[s] || s }))}
          onChange={handleResize}
        />
        <InspGrid2>
          <InputField label="W" type="number" value={currentWidth} onChange={(v) => handleDimensionChange('width', v as number)} />
          <InputField label="H" type="number" value={currentHeight} onChange={(v) => handleDimensionChange('height', v as number)} />
        </InspGrid2>
        {hasCustomDimensions && (
          <InspLinkButton onClick={() => actions.resizeNode(nodeId, node.size || 'm')}>
            Reset to preset
          </InspLinkButton>
        )}
      </InspField>

      <InspField>
        <InspLabel>Shape</InspLabel>
        <ShapePicker
          value={data.shape}
          inherited={themeShape}
          onChange={(v) => handleUpdate('shape', v)}
        />
        {data.shape && (
          <InspLinkButton onClick={() => handleUpdate('shape', undefined)}>
            Follow the theme
          </InspLinkButton>
        )}
      </InspField>

      <InspField>
        <InspLabel>Color</InspLabel>
        <ColorPicker value={data.color} onChange={(v) => handleUpdate('color', v)} />
      </InspField>

      <InspField>
        <InspLabel>Icon</InspLabel>
        <IconPicker value={data.icon} onChange={(v) => handleUpdate('icon', v)} />
      </InspField>

      {isIsometric && (
        <>
          <InspDivider />
          <InspSubsectionTitle>3D properties</InspSubsectionTitle>
          <InspRange label="Elevation" value={isoZ} min={0} max={200} onChange={(v) => handleIsoPropertyChange('z', v)} />
          <InspRange label="Box height" value={isoHeight} min={10} max={100} onChange={(v) => handleIsoPropertyChange('isoHeight', v)} />
          <InspRange label="Box depth" value={isoDepth} min={20} max={120} onChange={(v) => handleIsoPropertyChange('isoDepth', v)} />
          {(node.z !== undefined || node.isoHeight !== undefined || node.isoDepth !== undefined) && (
            <InspLinkButton
              onClick={() => actions.updateNodePosition(nodeId, {
                z: undefined,
                isoHeight: undefined,
                isoDepth: undefined,
              })}
            >
              Reset 3D defaults
            </InspLinkButton>
          )}
        </>
      )}

      <InspDivider />
      <InspMeta>
        <div>Position: ({node.x}, {node.y}){isIsometric ? `, Z: ${isoZ}` : ''}</div>
        <div>ID: {nodeId}</div>
      </InspMeta>
    </InspSection>
  )
}