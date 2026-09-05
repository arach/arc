import { useEditor, useDiagram, useEditorState, useViewMode, useIsoStyle, useResolvedBrand } from '../editor/EditorProvider'
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
  InspGrid3,
  InspRange,
  InspSubsectionTitle,
  InspKv,
  InspPair,
  InspPairButton,
} from '../editor/inspector-ui'
import IconPicker from './IconPicker'
import ColorPicker from './ColorPicker'
import ShapePicker from './ShapePicker'
import { resolveNodeRadius } from '../../utils/themes'
import { resolveNodeShape } from '../../utils/nodeShape'
import { getIsoStyle, materialFor, MATERIAL_LABELS } from '../../utils/isoStyles'
import { DEFAULT_ISO_HEIGHT, DEFAULT_ISO_DEPTH } from '../../utils/isoBlueprint'
const ISO_NUDGE = 16
const SIZE_LABELS: Record<string, string> = { xs: 'XS', s: 'S', m: 'M', l: 'L' }

function KvInput({
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
    <InspKv label={label}>
      <InspInput
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? parseInt(e.target.value, 10) || 0 : e.target.value)}
        placeholder={placeholder}
      />
    </InspKv>
  )
}

export default function NodeProperties({ nodeId }: { nodeId: string }) {
  const { actions } = useEditor()
  const diagram = useDiagram()
  const editor = useEditorState()
  const viewMode = useViewMode()
  const isoStyleId = useIsoStyle()
  const brand = useResolvedBrand()
  const isoStyle = getIsoStyle(isoStyleId)

  const node = diagram.nodes[nodeId]
  const data = diagram.nodeData[nodeId]

  if (!node || !data) return null

  const targetIds = editor.selectedNodeIds?.length ? editor.selectedNodeIds : [nodeId]
  const bulk = targetIds.length > 1

  const handleUpdate = (field: string, value: unknown) => {
    const all = field === 'color' || field === 'shape' || field === 'icon'
    const ids = all ? targetIds : [nodeId]
    ids.forEach((id) => actions.updateNode(id, { [field]: value }))
  }

  const handleResize = (size: string) => {
    targetIds.forEach((id) => actions.resizeNode(id, size))
  }

  const handleDimensionChange = (dimension: 'width' | 'height', value: number) => {
    targetIds.forEach((id) => {
      if (dimension === 'width') actions.resizeNode(id, undefined, value, undefined)
      else actions.resizeNode(id, undefined, undefined, value)
    })
  }

  const handleIsoPropertyChange = (property: string, value: unknown) => {
    const all = property !== 'x' && property !== 'y'
    const ids = all ? targetIds : [nodeId]
    ids.forEach((id) => actions.updateNodePosition(id, { [property]: value }))
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

  const hatchName = isIsometric && isoStyle.technical
    ? MATERIAL_LABELS[materialFor(data.color)]
    : null

  const nudgeFloor = (dir: -1 | 1) => {
    const step = ISO_NUDGE * dir
    targetIds.forEach((id) => {
      const n = diagram.nodes[id]
      if (!n) return
      actions.updateNodePosition(id, {
        x: Math.round(n.x + step),
        y: Math.round(n.y + step),
      })
    })
  }

  const stackOrder = (dir: -1 | 1) => {
    targetIds.forEach((id) => {
      const n = diagram.nodes[id]
      if (!n) return
      actions.updateNodePosition(id, { isoOrder: (n.isoOrder ?? 0) + dir })
    })
  }

  return (
    <InspSection>
      <InspTitle>Node</InspTitle>
      {bulk && (
        <p className="arc-insp-caption">Size, color, shape and icon apply to all {targetIds.length}</p>
      )}

      <KvInput label="Name" value={data.name} onChange={(v) => handleUpdate('name', v)} placeholder="Node name" />
      <KvInput label="Sub" value={data.subtitle ?? ''} onChange={(v) => handleUpdate('subtitle', v)} placeholder="e.g. Swift" />
      <KvInput label="Desc" value={data.description ?? ''} onChange={(v) => handleUpdate('description', v)} placeholder="Brief description" />

      <InspField>
        <InspLabel>Size</InspLabel>
        <InspSegmented
          value={node.size || 'm'}
          options={SIZE_OPTIONS.map((s) => ({ value: s, label: SIZE_LABELS[s] || s }))}
          onChange={handleResize}
        />
        {isIsometric ? (
          <KvInput
            label="W"
            type="number"
            value={currentWidth}
            onChange={(v) => handleDimensionChange('width', v as number)}
          />
        ) : (
          <InspGrid2>
            <InspField>
              <InspLabel>W</InspLabel>
              <InspInput
                type="number"
                value={currentWidth}
                onChange={(e) => handleDimensionChange('width', parseInt(e.target.value, 10) || 0)}
              />
            </InspField>
            <InspField>
              <InspLabel>H</InspLabel>
              <InspInput
                type="number"
                value={currentHeight}
                onChange={(e) => handleDimensionChange('height', parseInt(e.target.value, 10) || 0)}
              />
            </InspField>
          </InspGrid2>
        )}
        {hasCustomDimensions && (
          <InspLinkButton onClick={() => actions.resizeNode(nodeId, node.size || 'm')}>
            Reset to preset
          </InspLinkButton>
        )}
      </InspField>

      {!isIsometric && (
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
      )}

      <InspKv label="Color">
        <ColorPicker value={data.color} onChange={(v) => handleUpdate('color', v)} />
      </InspKv>
      {hatchName && (
        <p className="arc-insp-caption">Plate hatch: {hatchName}</p>
      )}

      <InspField>
        <InspLabel>Icon</InspLabel>
        <IconPicker value={data.icon} onChange={(v) => handleUpdate('icon', v)} />
      </InspField>

      {isIsometric && (
        <>
          <InspDivider />
          <InspSubsectionTitle>Isometric</InspSubsectionTitle>
          <InspField>
            <InspLabel>Origin</InspLabel>
            <InspGrid3>
              <InspField>
                <InspLabel>X</InspLabel>
                <InspInput
                  type="number"
                  step={1}
                  value={Math.round(node.x)}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    if (Number.isFinite(n)) handleIsoPropertyChange('x', n)
                  }}
                />
              </InspField>
              <InspField>
                <InspLabel>Y</InspLabel>
                <InspInput
                  type="number"
                  step={1}
                  value={Math.round(node.y)}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    if (Number.isFinite(n)) handleIsoPropertyChange('y', n)
                  }}
                />
              </InspField>
              <InspField>
                <InspLabel>Z</InspLabel>
                <InspInput
                  type="number"
                  step={1}
                  min={0}
                  value={isoZ}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    if (Number.isFinite(n)) handleIsoPropertyChange('z', n)
                  }}
                />
              </InspField>
            </InspGrid3>
          </InspField>
          <InspRange label="Raise" value={isoZ} min={0} max={200} onChange={(v) => handleIsoPropertyChange('z', v)} />
          <InspRange label="Height" value={isoHeight} min={10} max={100} onChange={(v) => handleIsoPropertyChange('isoHeight', v)} />
          <InspRange label="Depth" value={isoDepth} min={20} max={120} onChange={(v) => handleIsoPropertyChange('isoDepth', v)} />
          <InspField>
            <InspLabel>Label run</InspLabel>
            <InspSegmented
              value={node.isoLabelDir || 'auto'}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'x', label: 'Width' },
                { value: 'y', label: 'Depth' },
              ]}
              onChange={(v) => handleIsoPropertyChange('isoLabelDir', v === 'auto' ? undefined : v)}
            />
            <p className="arc-insp-caption">
              {(node.isoLabelDir || 'auto') === 'auto'
                ? 'Along the long edge of the top face'
                : node.isoLabelDir === 'y'
                  ? 'Along depth, up-left'
                  : 'Along width, up-right'}
            </p>
          </InspField>
          <InspKv label="Turn">
            <InspPair>
              <InspPairButton
                active={!node.isoLabelFlip}
                onClick={() => handleIsoPropertyChange('isoLabelFlip', undefined)}
              >
                Normal
              </InspPairButton>
              <InspPairButton
                active={!!node.isoLabelFlip}
                onClick={() => handleIsoPropertyChange('isoLabelFlip', true)}
              >
                Flip
              </InspPairButton>
            </InspPair>
          </InspKv>
          <InspField>
            <InspLabel>Type</InspLabel>
            <InspSegmented
              value={node.isoLabelFont || 'theme'}
              options={[
                { value: 'theme', label: 'Theme' },
                { value: 'ui', label: 'Sans' },
                { value: 'mono', label: 'Mono' },
              ]}
              onChange={(v) => handleIsoPropertyChange('isoLabelFont', v === 'theme' ? undefined : v)}
            />
          </InspField>
          <InspKv label="Floor">
            <InspPair>
              <InspPairButton onClick={() => nudgeFloor(-1)}>Behind</InspPairButton>
              <InspPairButton onClick={() => nudgeFloor(1)}>Forward</InspPairButton>
            </InspPair>
          </InspKv>
          <InspKv label="Stack">
            <InspPair>
              <InspPairButton onClick={() => stackOrder(-1)}>Under</InspPairButton>
              <InspPairButton onClick={() => stackOrder(1)}>Over</InspPairButton>
            </InspPair>
          </InspKv>
          {(node.z !== undefined || node.isoHeight !== undefined || node.isoDepth !== undefined || node.isoOrder !== undefined || node.isoLabelDir !== undefined || node.isoLabelFlip !== undefined || node.isoLabelFont !== undefined) && (
            <InspLinkButton
              onClick={() => actions.updateNodePosition(nodeId, {
                z: undefined,
                isoHeight: undefined,
                isoDepth: undefined,
                isoOrder: undefined,
                isoLabelDir: undefined,
                isoLabelFlip: undefined,
                isoLabelFont: undefined,
              })}
            >
              Reset 3D defaults
            </InspLinkButton>
          )}
        </>
      )}

      <InspDivider />
      <InspMeta>
        <div>ID: {nodeId}</div>
      </InspMeta>
    </InspSection>
  )
}