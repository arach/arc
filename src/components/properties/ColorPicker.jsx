import React from 'react'
import { COLOR_OPTIONS } from '../../utils/constants'

const colorClasses = {
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  zinc: 'bg-zinc-500',
  sky: 'bg-sky-500',
}

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {COLOR_OPTIONS.map(color => (
        <button
          key={color}
          onClick={() => onChange(color)}
          title={color}
          className={`
            w-7 h-7 rounded-full transition-all
            ${colorClasses[color]}
            ${value === color
              ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-zinc-900 scale-110'
              : 'hover:scale-110'
            }
          `}
        />
      ))}
    </div>
  )
}
