import { useState } from 'react'
import { DIAGRAM_ICONS, getIconComponent } from '../../utils/iconRegistry'
import { Search } from 'lucide-react'

export default function IconPicker({ value, onChange }) {
  const [search, setSearch] = useState('')

  const filteredIcons = search
    ? DIAGRAM_ICONS.filter(name => name.toLowerCase().includes(search.toLowerCase()))
    : DIAGRAM_ICONS

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
        />
      </div>

      {/* Icon grid */}
      <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto p-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        {filteredIcons.map(iconName => {
          const Icon = getIconComponent(iconName)
          const isSelected = value === iconName
          return (
            <button
              key={iconName}
              onClick={() => onChange(iconName)}
              title={iconName}
              className={`
                p-2 rounded-lg transition-colors
                ${isSelected
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                }
              `}
            >
              <Icon className="w-5 h-5 mx-auto" />
            </button>
          )
        })}
      </div>

      {/* Current selection */}
      <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
        Selected: {value}
      </div>
    </div>
  )
}
