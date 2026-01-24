
import { useDiagram, useEditor } from '../editor/EditorProvider'
import { Trash2 } from 'lucide-react'

export default function ImageProperties({ imageId }) {
  const { actions } = useEditor()
  const diagram = useDiagram()

  const images = diagram.images || []
  const image = images.find(img => img.id === imageId)

  if (!image) return null

  const handleUpdate = (updates) => {
    actions.updateImage(imageId, updates)
  }

  const handleDelete = () => {
    actions.removeImage(imageId)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
          Image
        </h3>
        <button
          onClick={handleDelete}
          className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
          title="Delete image"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Preview */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-800">
        <img
          src={image.src}
          alt={image.name || 'Dropped image'}
          className="w-full h-auto max-h-32 object-contain"
        />
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
          Name
        </label>
        <input
          type="text"
          value={image.name || ''}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded
            bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
            focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Image name"
        />
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            X
          </label>
          <input
            type="number"
            value={image.x}
            onChange={(e) => handleUpdate({ x: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded
              bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Y
          </label>
          <input
            type="number"
            value={image.y}
            onChange={(e) => handleUpdate({ y: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded
              bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Size */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Width
          </label>
          <input
            type="number"
            value={image.width}
            onChange={(e) => handleUpdate({ width: parseInt(e.target.value) || 100 })}
            className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded
              bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Height
          </label>
          <input
            type="number"
            value={image.height}
            onChange={(e) => handleUpdate({ height: parseInt(e.target.value) || 100 })}
            className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded
              bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Opacity */}
      <div>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
          Opacity
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={image.opacity ?? 1}
          onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) })}
          className="w-full"
        />
        <div className="text-xs text-zinc-500 text-right">
          {Math.round((image.opacity ?? 1) * 100)}%
        </div>
      </div>
    </div>
  )
}
