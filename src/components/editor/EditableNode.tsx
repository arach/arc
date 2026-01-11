import React from 'react'
import { getIconComponent } from '../../utils/iconRegistry'
import { NODE_SIZES } from '../../utils/constants'

// Color mappings for different accent positions
const accentClasses = {
  left: {
    violet: 'border-l-4 border-l-violet-500',
    emerald: 'border-l-4 border-l-emerald-500',
    blue: 'border-l-4 border-l-blue-500',
    amber: 'border-l-4 border-l-amber-500',
    zinc: 'border-l-4 border-l-zinc-500',
    sky: 'border-l-4 border-l-sky-500',
  },
  top: {
    violet: 'border-t-3 border-t-violet-500',
    emerald: 'border-t-3 border-t-emerald-500',
    blue: 'border-t-3 border-t-blue-500',
    amber: 'border-t-3 border-t-amber-500',
    zinc: 'border-t-3 border-t-zinc-500',
    sky: 'border-t-3 border-t-sky-500',
  },
  none: {
    violet: '', emerald: '', blue: '', amber: '', zinc: '', sky: '',
  },
}

// Icon container border colors
const iconBorderColors = {
  colored: {
    violet: 'border-violet-500/50',
    emerald: 'border-emerald-500/50',
    blue: 'border-blue-500/50',
    amber: 'border-amber-500/50',
    zinc: 'border-zinc-600',
    sky: 'border-sky-500/50',
  },
  muted: {
    violet: 'border-zinc-600',
    emerald: 'border-zinc-600',
    blue: 'border-zinc-600',
    amber: 'border-zinc-600',
    zinc: 'border-zinc-600',
    sky: 'border-zinc-600',
  },
  none: {
    violet: 'border-transparent',
    emerald: 'border-transparent',
    blue: 'border-transparent',
    amber: 'border-transparent',
    zinc: 'border-transparent',
    sky: 'border-transparent',
  },
}

// Icon colors
const iconColors = {
  violet: 'text-violet-400',
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  amber: 'text-amber-400',
  zinc: 'text-zinc-400',
  sky: 'text-sky-400',
}

// Subtitle colors
const subtitleColorMap = {
  colored: {
    violet: 'text-violet-400',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    zinc: 'text-zinc-500',
    sky: 'text-sky-400',
  },
  muted: {
    violet: 'text-zinc-500',
    emerald: 'text-zinc-500',
    blue: 'text-zinc-500',
    amber: 'text-zinc-500',
    zinc: 'text-zinc-500',
    sky: 'text-zinc-500',
  },
}

export default function EditableNode({
  nodeId,
  node,
  data,
  layout,
  template,
  isSelected,
  onPointerDown,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) {
  const Icon = getIconComponent(data.icon)
  const size = node.size || 'm'
  const color = data.color || 'violet'
  // Custom dimensions override preset sizes
  const presetSize = NODE_SIZES[size] || NODE_SIZES.m
  const width = node.width || presetSize.width
  const height = node.height || presetSize.height

  const isLarge = size === 'l'
  const isSmall = size === 's' || size === 'xs'
  const isExtraSmall = size === 'xs'

  // Convert to percentages for proper scaling with SVG viewBox
  const leftPercent = (node.x / layout.width) * 100
  const topPercent = (node.y / layout.height) * 100
  const widthPercent = (width / layout.width) * 100
  const heightPercent = (height / layout.height) * 100

  // Get template-specific styles
  const nodeStyle = template?.node || {}
  const accentPosition = nodeStyle.accentPosition || 'left'
  const accentClass = accentClasses[accentPosition]?.[color] || ''
  const iconBorderStyle = nodeStyle.iconBorderStyle || 'colored'
  const iconBorderClass = iconBorderColors[iconBorderStyle]?.[color] || ''
  const subtitleStyle = nodeStyle.subtitleStyle || 'colored'
  const subtitleColorClass = subtitleColorMap[subtitleStyle]?.[color] || 'text-zinc-500'

  // Ring offset color based on canvas background
  const ringOffsetClass = template?.canvas?.background?.includes('white')
    ? 'ring-offset-white'
    : 'ring-offset-zinc-950'

  return (
    <div
      className="absolute cursor-move select-none pointer-events-auto"
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPointerDown={(e) => onPointerDown(e, nodeId)}
      onClick={(e) => {
        e.stopPropagation()
        onClick(nodeId, e)
      }}
    >
      <div
        className={`
          relative h-full
          ${nodeStyle.background || 'bg-zinc-900'}
          border ${nodeStyle.border || 'border-zinc-800'}
          ${nodeStyle.borderRadius || 'rounded-xl'}
          ${accentClass}
          ${isLarge ? 'px-5 py-4' : isSmall ? 'px-3 py-2.5' : 'px-4 py-3'}
          transition-all duration-150
          ${isSelected ? `ring-2 ring-blue-500 ring-offset-2 ${ringOffsetClass}` : ''}
        `}
      >
        <div className="flex items-start gap-3">
          {/* Icon container */}
          <div
            className={`
              flex-shrink-0 rounded-lg
              ${isLarge ? 'w-12 h-12' : isSmall ? 'w-8 h-8' : 'w-10 h-10'}
              flex items-center justify-center
              ${nodeStyle.iconBackground || 'bg-zinc-900'}
              border ${iconBorderClass}
            `}
          >
            <Icon className={`${isLarge ? 'w-6 h-6' : isSmall ? 'w-4 h-4' : 'w-5 h-5'} ${iconColors[color]}`} />
          </div>

          {/* Text content */}
          <div className="min-w-0 flex-1 pt-0.5">
            <div className={`font-semibold ${nodeStyle.textColor || 'text-white'} ${isLarge ? 'text-base' : isSmall ? 'text-xs' : 'text-sm'}`}>
              {data.name}
            </div>
            {data.subtitle && (
              <div className={`font-mono ${subtitleColorClass} ${isExtraSmall ? 'text-[8px]' : isSmall ? 'text-[9px]' : 'text-[11px]'}`}>
                {data.subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {data.description && !isSmall && !isExtraSmall && (
          <div className={`mt-2 ${nodeStyle.descriptionColor || 'text-zinc-500'} ${isLarge ? 'text-xs' : 'text-[11px]'}`}>
            {data.description}
          </div>
        )}
      </div>
    </div>
  )
}
