import { useState } from 'react'
import { Search } from 'lucide-react'
import { DIAGRAM_ICONS, getIconComponent } from '../../utils/iconRegistry'

export default function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const [search, setSearch] = useState('')

  const filteredIcons = search
    ? DIAGRAM_ICONS.filter((name) => name.toLowerCase().includes(search.toLowerCase()))
    : DIAGRAM_ICONS

  return (
    <div className="arc-insp-icon-picker">
      <div className="arc-insp-search">
        <Search />
        <input
          type="text"
          className="arc-insp-input"
          placeholder="Search icons…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {value && <span className="arc-insp-search-value">{value}</span>}
      </div>

      <div className="arc-insp-icon-grid">
        {filteredIcons.map((iconName) => {
          const Icon = getIconComponent(iconName)
          const isSelected = value === iconName
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onChange(iconName)}
              title={iconName}
              className={`arc-insp-icon-btn${isSelected ? ' is-selected' : ''}`}
            >
              <Icon size={14} strokeWidth={1.75} />
            </button>
          )
        })}
      </div>
    </div>
  )
}