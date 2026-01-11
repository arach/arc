import React from 'react'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { Toggle } from '@base-ui/react/toggle'
import { useEditor, useDiagram } from '../editor/EditorProvider'
import { SIZE_OPTIONS, NODE_SIZES } from '../../utils/constants'
import IconPicker from './IconPicker'
import ColorPicker from './ColorPicker'

function InputField({ label, value, onChange, placeholder, type = 'text', className = '' }) {
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

function SizePicker({ value, onChange }) {
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

export default function NodeProperties({ nodeId }) {
  const { actions } = useEditor()
  const diagram = useDiagram()

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

  // Get current dimensions (custom or from preset)
  const presetSize = NODE_SIZES[node.size] || NODE_SIZES.m
  const currentWidth = node.width || presetSize.width
  const currentHeight = node.height || presetSize.height
  const hasCustomDimensions = node.width !== undefined || node.height !== undefined

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

      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
        <div className="text-xs text-zinc-400 space-y-1">
          <div>Position: ({node.x}, {node.y})</div>
          <div>ID: {nodeId}</div>
        </div>
      </div>
    </div>
  )
}
