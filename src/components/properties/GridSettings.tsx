import React from 'react'
import { Grid3X3 } from 'lucide-react'
import { useEditor, useDiagram } from '../editor/EditorProvider'
import { GRID_COLORS, DEFAULT_GRID } from '../../utils/constants'

export default function GridSettings() {
  const { dispatch } = useEditor()
  const diagram = useDiagram()
  const grid = diagram.grid || DEFAULT_GRID

  const handleUpdate = (updates) => {
    dispatch({ type: 'grid/update', updates })
  }

  return (
    <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center gap-2">
        <Grid3X3 className="w-4 h-4 text-zinc-500" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Grid Settings
        </h3>
      </div>

      {/* Enable/disable grid */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={grid.enabled}
          onChange={(e) => handleUpdate({ enabled: e.target.checked })}
          className="rounded border-zinc-300 dark:border-zinc-600"
        />
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Show grid</span>
      </label>

      {grid.enabled && (
        <>
          {/* Grid type */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Grid Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdate({ type: 'dots' })}
                className={`
                  flex-1 px-3 py-1.5 text-xs rounded border transition-colors
                  ${grid.type === 'dots'
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }
                `}
              >
                Dots
              </button>
              <button
                onClick={() => handleUpdate({ type: 'lines' })}
                className={`
                  flex-1 px-3 py-1.5 text-xs rounded border transition-colors
                  ${grid.type === 'lines'
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }
                `}
              >
                Lines
              </button>
            </div>
          </div>

          {/* Grid size */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Grid Size: {grid.size}px
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={grid.size}
              onChange={(e) => handleUpdate({ size: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Grid color */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Grid Color
            </label>
            <div className="flex gap-2">
              {GRID_COLORS.map(({ name, value }) => (
                <button
                  key={value}
                  onClick={() => handleUpdate({ color: value })}
                  className={`
                    w-6 h-6 rounded-full border-2 transition-all
                    ${grid.color === value
                      ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-zinc-900'
                      : 'border-transparent'
                    }
                  `}
                  style={{ backgroundColor: value }}
                  title={name}
                />
              ))}
              {/* Custom color input */}
              <input
                type="color"
                value={grid.color}
                onChange={(e) => handleUpdate({ color: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                title="Custom color"
              />
            </div>
          </div>

          {/* Grid opacity */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Opacity: {Math.round(grid.opacity * 100)}%
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={grid.opacity * 100}
              onChange={(e) => handleUpdate({ opacity: parseInt(e.target.value) / 100 })}
              className="w-full"
            />
          </div>
        </>
      )}
    </div>
  )
}
