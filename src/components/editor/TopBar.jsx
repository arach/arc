import React from 'react'
import { File, FolderOpen, Save, Share, Sun, Moon } from 'lucide-react'
import { useMeta } from './EditorProvider'
import TemplateSelector from './TemplateSelector'

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

export default function TopBar({ onNew, onOpen, onSave, onShare, isDark, onToggleTheme }) {
  const meta = useMeta()

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      {/* Left: File operations */}
      <div className="flex items-center gap-1">
        <TopBarButton icon={File} label="New diagram" onClick={onNew} />
        <TopBarButton icon={FolderOpen} label="Open diagram" onClick={onOpen} />
        <TopBarButton icon={Save} label="Save diagram" onClick={onSave} />
        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
        <TemplateSelector />
      </div>

      {/* Center: File name and status */}
      <div className="flex items-center gap-2 text-sm">
        {meta.filename && (
          <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
            {meta.filename}
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
