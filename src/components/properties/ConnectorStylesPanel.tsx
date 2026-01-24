import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { useEditor, useDiagram } from '../editor/EditorProvider'
import { COLOR_OPTIONS } from '../../utils/constants'
import GridSettings from './GridSettings'

const colorSwatches = {
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  zinc: 'bg-zinc-500',
  sky: 'bg-sky-500',
}

function StyleEditor({ styleName, style, onUpdate, onDelete, connectorsUsingStyle }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        )}
        <div className={`w-3 h-3 rounded-full ${colorSwatches[style.color]}`} />
        <span className="text-sm font-medium text-zinc-900 dark:text-white flex-1">
          {styleName}
        </span>
        <span className="text-xs text-zinc-400">
          {connectorsUsingStyle} connection{connectorsUsingStyle !== 1 ? 's' : ''}
        </span>
      </button>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-zinc-200 dark:border-zinc-700">
          {/* Label */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Label
            </label>
            <input
              type="text"
              value={style.label || ''}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Optional label"
              className="w-full px-2 py-1.5 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Color
            </label>
            <div className="flex gap-1.5">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color}
                  onClick={() => onUpdate({ color })}
                  className={`
                    w-6 h-6 rounded-full ${colorSwatches[color]}
                    ${style.color === color ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-zinc-900' : ''}
                  `}
                />
              ))}
            </div>
          </div>

          {/* Stroke Width */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Stroke Width: {style.strokeWidth || 2}
            </label>
            <input
              type="range"
              min="1"
              max="6"
              value={style.strokeWidth || 2}
              onChange={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={style.dashed === true}
                onChange={(e) => onUpdate({ dashed: e.target.checked })}
                className="rounded border-zinc-300 dark:border-zinc-600"
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Dashed</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={style.showArrow !== false}
                onChange={(e) => onUpdate({ showArrow: e.target.checked })}
                className="rounded border-zinc-300 dark:border-zinc-600"
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Show arrow</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={style.showEndpoints !== false}
                onChange={(e) => onUpdate({ showEndpoints: e.target.checked })}
                className="rounded border-zinc-300 dark:border-zinc-600"
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Show endpoint dots</span>
            </label>
          </div>

          {/* Delete button */}
          {connectorsUsingStyle === 0 && (
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete style
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function ConnectorStylesPanel() {
  const { dispatch, actions } = useEditor()
  const diagram = useDiagram()
  const [newStyleName, setNewStyleName] = useState('')
  const [showConnectors, setShowConnectors] = useState(true)

  // Count how many connectors use each style
  const styleUsage = {}
  for (const styleName of Object.keys(diagram.connectorStyles)) {
    styleUsage[styleName] = diagram.connectors.filter(c => c.style === styleName).length
  }

  const handleUpdateStyle = (styleName, updates) => {
    dispatch({
      type: 'connectorStyle/update',
      styleName,
      updates,
    })
  }

  const handleAddStyle = () => {
    if (!newStyleName.trim()) return
    const safeName = newStyleName.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!safeName || diagram.connectorStyles[safeName]) return

    dispatch({
      type: 'connectorStyle/add',
      styleName: safeName,
      style: {
        color: 'zinc',
        strokeWidth: 2,
        label: newStyleName,
        dashed: false,
        showArrow: true,
        showEndpoints: true,
      },
    })
    setNewStyleName('')
  }

  const handleDeleteStyle = (styleName) => {
    dispatch({
      type: 'connectorStyle/delete',
      styleName,
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
        Connector Styles
      </h3>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Define reusable styles for connectors. Click a style to edit it.
      </p>

      {/* Style list */}
      <div className="space-y-2">
        {Object.entries(diagram.connectorStyles).map(([name, style]) => (
          <StyleEditor
            key={name}
            styleName={name}
            style={style}
            onUpdate={(updates) => handleUpdateStyle(name, updates)}
            onDelete={() => handleDeleteStyle(name)}
            connectorsUsingStyle={styleUsage[name] || 0}
          />
        ))}
      </div>

      {/* Add new style */}
      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
          Add New Style
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newStyleName}
            onChange={(e) => setNewStyleName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStyle()}
            placeholder="Style name..."
            className="flex-1 px-2 py-1.5 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
          />
          <button
            onClick={handleAddStyle}
            disabled={!newStyleName.trim()}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Connector list */}
      <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setShowConnectors(!showConnectors)}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white mb-2"
        >
          {showConnectors ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          Connections ({diagram.connectors.length})
        </button>

        {showConnectors && (
          <div className="space-y-1">
            {diagram.connectors.map((connector, index) => {
              const fromNode = diagram.nodeData[connector.from]?.name || connector.from
              const toNode = diagram.nodeData[connector.to]?.name || connector.to
              const style = diagram.connectorStyles[connector.style]

              return (
                <button
                  key={index}
                  onClick={() => actions.selectConnector(index)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <div className={`w-2 h-2 rounded-full ${colorSwatches[style?.color] || 'bg-zinc-400'}`} />
                  <span className="text-zinc-600 dark:text-zinc-400 truncate">
                    {fromNode} → {toNode}
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-500 ml-auto">
                    {connector.style}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Grid settings */}
      <GridSettings />
    </div>
  )
}
