// @ts-nocheck

import { File, FolderOpen, Save, Share, Sun, Moon } from 'lucide-react'
import { useMeta } from './EditorProvider'
import TemplateSelector from './TemplateSelector'
import type { StyleSourceSelection } from './StyleSourcePane'

type EditorSurfaceView = 'canvas' | 'render' | 'source' | 'styles'

function TopBarButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}

function ViewButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
        active
          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
          : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
      }`}
    >
      {label}
    </button>
  )
}

export default function TopBar({
  onNew,
  onOpen,
  onSave,
  onShare,
  isDark,
  onToggleTheme,
  view,
  onViewChange,
  onOpenStyles,
}: {
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onShare: () => void
  isDark: boolean
  onToggleTheme: () => void
  view: EditorSurfaceView
  onViewChange: (view: EditorSurfaceView) => void
  onOpenStyles: (selection: StyleSourceSelection) => void
}) {
  const meta = useMeta()
  const diagramMeta = (meta.diagramMeta || {}) as Record<string, any>
  const sourceFile = diagramMeta.file

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      {/* Left: File operations */}
      <div className="flex items-center gap-1">
        <TopBarButton icon={File} label="New diagram" onClick={onNew} />
        <TopBarButton icon={FolderOpen} label="Open diagram" onClick={onOpen} />
        <TopBarButton icon={Save} label="Save diagram" onClick={onSave} />
        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
        <TemplateSelector onOpenStyles={onOpenStyles} />
      </div>

      {/* Center: File name and status */}
      <div className="flex items-center gap-3 text-sm min-w-0">
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950/80">
          <ViewButton label="Canvas" active={view === 'canvas'} onClick={() => onViewChange('canvas')} />
          <ViewButton label="Render" active={view === 'render'} onClick={() => onViewChange('render')} />
          <ViewButton label="Diagram" active={view === 'source'} onClick={() => onViewChange('source')} />
          <ViewButton label="Styles" active={view === 'styles'} onClick={() => onViewChange('styles')} />
        </div>
        {meta.filename && (
          <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
            {meta.filename}
          </span>
        )}
        {sourceFile && (
          <span className="hidden md:block text-xs text-zinc-500 truncate max-w-[340px]" title={sourceFile}>
            {sourceFile}
          </span>
        )}
        {meta.isDirty && (
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Edited
          </span>
        )}
      </div>

      {/* Right: Theme and Share */}
      <div className="flex items-center gap-1">
        {onToggleTheme && (
          <TopBarButton
            icon={isDark ? Sun : Moon}
            label={isDark ? 'Light mode' : 'Dark mode'}
            onClick={onToggleTheme}
          />
        )}
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          <Share className="w-4 h-4" />
          Share
        </button>
      </div>
    </div>
  )
}
