import React from 'react'
import { useEditor, useDiagram } from '../editor/EditorProvider'
import { ANCHOR_POSITIONS } from '../../utils/constants'

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function ConnectorProperties({ connectorIndex }) {
  const { actions, dispatch } = useEditor()
  const diagram = useDiagram()

  const connector = diagram.connectors[connectorIndex]
  if (!connector) return null

  const currentStyle = diagram.connectorStyles[connector.style]

  const handleUpdate = (field, value) => {
    actions.updateConnector(connectorIndex, { [field]: value })
  }

  // Update the connector style (affects all connectors using this style)
  const handleStyleUpdate = (field, value) => {
    dispatch({
      type: 'connectorStyle/update',
      styleName: connector.style,
      updates: { [field]: value },
    })
  }

  const styleOptions = Object.keys(diagram.connectorStyles).map(key => ({
    value: key,
    label: `${key} (${diagram.connectorStyles[key].label || key})`,
  }))

  const anchorOptions = ANCHOR_POSITIONS.map(pos => ({
    value: pos,
    label: pos,
  }))

  const nodeOptions = Object.keys(diagram.nodes).map(id => ({
    value: id,
    label: diagram.nodeData[id]?.name || id,
  }))

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
        Connector Properties
      </h3>

      <SelectField
        label="Style"
        value={connector.style}
        onChange={(v) => handleUpdate('style', v)}
        options={styleOptions}
      />

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="From Node"
          value={connector.from}
          onChange={(v) => handleUpdate('from', v)}
          options={nodeOptions}
        />
        <SelectField
          label="From Anchor"
          value={connector.fromAnchor}
          onChange={(v) => handleUpdate('fromAnchor', v)}
          options={anchorOptions}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="To Node"
          value={connector.to}
          onChange={(v) => handleUpdate('to', v)}
          options={nodeOptions}
        />
        <SelectField
          label="To Anchor"
          value={connector.toAnchor}
          onChange={(v) => handleUpdate('toAnchor', v)}
          options={anchorOptions}
        />
      </div>

      {/* Curve options */}
      <div className="space-y-2">
        <SelectField
          label="Path Style"
          value={connector.curve || 'auto'}
          onChange={(v) => handleUpdate('curve', v === 'auto' ? undefined : v)}
          options={[
            { value: 'auto', label: 'Auto (based on anchors)' },
            { value: 'natural', label: 'Natural Curve' },
          ]}
        />

        {/* Curve tension slider - controls how pronounced the curve is */}
        {connector.curve === 'natural' && (
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Curve Tension: {connector.curveDepth ?? 50}%
            </label>
            <input
              type="range"
              min="20"
              max="100"
              value={connector.curveDepth ?? 50}
              onChange={(e) => handleUpdate('curveDepth', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Style-level options */}
      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 space-y-2">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          Style Options
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={currentStyle?.showArrow !== false}
            onChange={(e) => handleStyleUpdate('showArrow', e.target.checked)}
            className="rounded border-zinc-300 dark:border-zinc-600"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Show arrow
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={currentStyle?.showEndpoints !== false}
            onChange={(e) => handleStyleUpdate('showEndpoints', e.target.checked)}
            className="rounded border-zinc-300 dark:border-zinc-600"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Show endpoint dots
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={currentStyle?.dashed === true}
            onChange={(e) => handleStyleUpdate('dashed', e.target.checked)}
            className="rounded border-zinc-300 dark:border-zinc-600"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Dashed line
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={currentStyle?.bidirectional === true}
            onChange={(e) => handleStyleUpdate('bidirectional', e.target.checked)}
            className="rounded border-zinc-300 dark:border-zinc-600"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Bidirectional (arrows at both ends)
          </span>
        </label>

        {currentStyle?.dashed && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentStyle?.animated !== false}
              onChange={(e) => handleStyleUpdate('animated', e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-600"
            />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Animated motion
            </span>
          </label>
        )}
      </div>

      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
        <div className="text-xs text-zinc-400">
          Index: {connectorIndex} | Style: {connector.style}
        </div>
      </div>
    </div>
  )
}
