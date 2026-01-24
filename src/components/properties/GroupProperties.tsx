
import { useEditor, useDiagram } from '../editor/EditorProvider'
import { COLOR_OPTIONS } from '../../utils/constants'

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

function ColorPicker({ value, onChange }: any) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_OPTIONS.map(color => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={`
            w-6 h-6 rounded-full transition-all
            ${value === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
          `}
          style={{
            backgroundColor: {
              violet: '#8b5cf6',
              emerald: '#34d399',
              blue: '#60a5fa',
              amber: '#fbbf24',
              zinc: '#71717a',
              sky: '#38bdf8',
            }[color],
          }}
        />
      ))}
    </div>
  )
}

function ShapeTypePicker({ value, onChange }: any) {
  return (
    <div className="flex gap-2">
      {['rect', 'circle'].map(type => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`
            flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize
            ${value === type
              ? 'bg-blue-500 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }
          `}
        >
          {type === 'rect' ? 'Rectangle' : 'Circle'}
        </button>
      ))}
    </div>
  )
}

export default function GroupProperties({ groupId }: any) {
  const { actions } = useEditor()
  const diagram = useDiagram()

  const group = diagram.groups?.find(g => g.id === groupId)
  if (!group) return null

  const handleUpdate = (field, value) => {
    actions.updateGroup(groupId, { [field]: value })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
        Group Properties
      </h3>

      <InputField
        label="Label"
        value={group.label}
        onChange={(v) => handleUpdate('label', v)}
        placeholder="Group label"
      />

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          Shape
        </label>
        <ShapeTypePicker value={group.type} onChange={(v) => handleUpdate('type', v)} />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          Color
        </label>
        <ColorPicker value={group.color} onChange={(v) => handleUpdate('color', v)} />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="dashed"
          checked={group.dashed ?? true}
          onChange={(e) => handleUpdate('dashed', e.target.checked)}
          className="rounded border-zinc-300 dark:border-zinc-600"
        />
        <label htmlFor="dashed" className="text-xs text-zinc-500 dark:text-zinc-400">
          Dashed border
        </label>
      </div>

      {/* Dimensions */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          Dimensions
        </label>
        <div className="grid grid-cols-2 gap-2">
          <InputField
            label="X"
            type="number"
            value={group.x}
            onChange={(v) => handleUpdate('x', v)}
          />
          <InputField
            label="Y"
            type="number"
            value={group.y}
            onChange={(v) => handleUpdate('y', v)}
          />
          <InputField
            label="Width"
            type="number"
            value={group.width}
            onChange={(v) => handleUpdate('width', v)}
          />
          <InputField
            label="Height"
            type="number"
            value={group.height}
            onChange={(v) => handleUpdate('height', v)}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
        <div className="text-xs text-zinc-400">
          ID: {groupId}
        </div>
      </div>
    </div>
  )
}
