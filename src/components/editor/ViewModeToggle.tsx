import { Box, Layers } from 'lucide-react'
import type { ViewMode } from '../../types/editor'

interface ViewModeToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export default function ViewModeToggle({
  viewMode,
  onViewModeChange,
}: ViewModeToggleProps) {
  return (
    <div className="absolute bottom-3 right-44 flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 p-1">
      <button
        onClick={() => onViewModeChange('2d')}
        className={`p-1.5 rounded transition-colors ${
          viewMode === '2d'
            ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400'
            : 'hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
        }`}
        title="2D View"
      >
        <Layers className="w-4 h-4" />
      </button>

      <button
        onClick={() => onViewModeChange('isometric')}
        className={`p-1.5 rounded transition-colors ${
          viewMode === 'isometric'
            ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400'
            : 'hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
        }`}
        title="Isometric View"
      >
        <Box className="w-4 h-4" />
      </button>
    </div>
  )
}
