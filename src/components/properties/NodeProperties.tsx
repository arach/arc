
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { Toggle } from '@base-ui/react/toggle'
import { useEditor, useDiagram, useViewMode } from '../editor/EditorProvider'
import { SIZE_OPTIONS, NODE_SIZES } from '../../utils/constants'
import IconPicker from './IconPicker'
import ColorPicker from './ColorPicker'

// Default isometric values (should match IsometricNodeLayer)
const DEFAULT_ISO_HEIGHT = 25
const DEFAULT_ISO_DEPTH = 50

function InputField({ label, value, onChange, placeholder, type = 'text', className = '' }: any) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
      />
    </div>
  )
}

// Size labels for display
const SIZE_LABELS = { xs: 'XS', s: 'S', m: 'M', l: 'L' }

function SizePicker({ value, onChange }: any) {
  return (
    <ToggleGroup
      value={value ? [value] : ['m']}
      onValueChange={(newValue) => {
        if (newValue.length > 0) {
          onChange(newValue[0])
        }
      }}
      className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg"
    >
      {SIZE_OPTIONS.map(size => (
        <Toggle
          key={size}
          value={size}
          aria-label={`Size ${SIZE_LABELS[size]}`}
          className="flex-1 py-1.5 text-xs font-medium rounded-md transition-colors uppercase
            data-[pressed]:bg-blue-500 data-[pressed]:text-white
            hover:bg-zinc-200 dark:hover:bg-zinc-700
            text-zinc-600 dark:text-zinc-400"
        >
          {SIZE_LABELS[size] || size}
        </Toggle>
      ))}
    </ToggleGroup>
  )
}

export default function NodeProperties({ nodeId }: any) {
  const { actions } = useEditor()
  const diagram = useDiagram()
  const viewMode = useViewMode()

  const node = diagram.nodes[nodeId]
  const data = diagram.nodeData[nodeId]

  if (!node || !data) return null

  const handleUpdate = (field, value) => {
    actions.updateNode(nodeId, { [field]: value })
  }

  const handleResize = (size) => {
    actions.resizeNode(nodeId, size)
  }

  const handleDimensionChange = (dimension, value) => {
    if (dimension === 'width') {
      actions.resizeNode(nodeId, undefined, value, undefined)
    } else {
      actions.resizeNode(nodeId, undefined, undefined, value)
    }
  }

  const handleIsoPropertyChange = (property: string, value: number) => {
    actions.updateNodePosition(nodeId, { [property]: value })
  }

  // Get current dimensions (custom or from preset)
  const presetSize = NODE_SIZES[node.size] || NODE_SIZES.m
  const currentWidth = node.width || presetSize.width
  const currentHeight = node.height || presetSize.height
  const hasCustomDimensions = node.width !== undefined || node.height !== undefined

  // Isometric properties
  const isIsometric = viewMode === 'isometric'
  const isoZ = node.z ?? 0
  const isoHeight = node.isoHeight ?? DEFAULT_ISO_HEIGHT
  const isoDepth = node.isoDepth ?? DEFAULT_ISO_DEPTH

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
        Node Properties
      </h3>

      <InputField
        label="Name"
        value={data.name}
        onChange={(v) => handleUpdate('name', v)}
        placeholder="Node name"
      />

      <InputField
        label="Subtitle"
        value={data.subtitle}
        onChange={(v) => handleUpdate('subtitle', v)}
        placeholder="e.g., Swift, TypeScript"
      />

      <InputField
        label="Description"
        value={data.description}
        onChange={(v) => handleUpdate('description', v)}
        placeholder="Brief description"
      />

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          Size
        </label>
        <SizePicker value={node.size} onChange={handleResize} />

        {/* Custom dimensions */}
        <div className="flex gap-2 mt-2">
          <InputField
            label="W"
            type="number"
            value={currentWidth}
            onChange={(v) => handleDimensionChange('width', v)}
            className="flex-1"
          />
          <InputField
            label="H"
            type="number"
            value={currentHeight}
            onChange={(v) => handleDimensionChange('height', v)}
            className="flex-1"
          />
        </div>
        {hasCustomDimensions && (
          <button
            onClick={() => actions.resizeNode(nodeId, node.size || 'm')}
            className="mt-1 text-xs text-blue-500 hover:text-blue-600"
          >
            Reset to preset
          </button>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          Color
        </label>
        <ColorPicker value={data.color} onChange={(v) => handleUpdate('color', v)} />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          Icon
        </label>
        <IconPicker value={data.icon} onChange={(v) => handleUpdate('icon', v)} />
      </div>

      {/* Isometric Properties - only shown in isometric mode */}
      {isIsometric && (
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-gradient-to-br from-violet-500 to-blue-500" />
            3D Properties
          </h4>

          <div className="space-y-3">
            {/* Elevation */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Elevation (Z)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={isoZ}
                  onChange={(e) => handleIsoPropertyChange('z', parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <input
                  type="number"
                  value={isoZ}
                  onChange={(e) => handleIsoPropertyChange('z', parseInt(e.target.value) || 0)}
                  className="w-14 px-2 py-1 text-xs text-center rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
            </div>

            {/* Box Height */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Box Height
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={isoHeight}
                  onChange={(e) => handleIsoPropertyChange('isoHeight', parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <input
                  type="number"
                  value={isoHeight}
                  onChange={(e) => handleIsoPropertyChange('isoHeight', parseInt(e.target.value) || DEFAULT_ISO_HEIGHT)}
                  className="w-14 px-2 py-1 text-xs text-center rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
            </div>

            {/* Box Depth */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Box Depth
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={isoDepth}
                  onChange={(e) => handleIsoPropertyChange('isoDepth', parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <input
                  type="number"
                  value={isoDepth}
                  onChange={(e) => handleIsoPropertyChange('isoDepth', parseInt(e.target.value) || DEFAULT_ISO_DEPTH)}
                  className="w-14 px-2 py-1 text-xs text-center rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
            </div>

            {/* Reset button */}
            {(node.z !== undefined || node.isoHeight !== undefined || node.isoDepth !== undefined) && (
              <button
                onClick={() => {
                  actions.updateNodePosition(nodeId, {
                    z: undefined,
                    isoHeight: undefined,
                    isoDepth: undefined,
                  })
                }}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                Reset to defaults
              </button>
            )}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
        <div className="text-xs text-zinc-400 space-y-1">
          <div>Position: ({node.x}, {node.y}){isIsometric && `, Z: ${isoZ}`}</div>
          <div>ID: {nodeId}</div>
        </div>
      </div>
    </div>
  )
}
