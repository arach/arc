
import { Palette } from 'lucide-react'
import { useEditor, useTemplate } from './EditorProvider'
import { getTemplateList } from '../../utils/templates'

export default function TemplateSelector() {
  const { actions } = useEditor()
  const currentTemplate = useTemplate()
  const templates = getTemplateList()

  return (
    <div className="relative group">
      <button
        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
        title="Change template"
      >
        <Palette className="w-4 h-4" />
      </button>

      {/* Dropdown */}
      <div className="absolute left-0 top-full mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 py-1 min-w-[180px]">
          <div className="px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">
            Style Template
          </div>
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => actions.setTemplate(template.id)}
              className={`
                w-full px-3 py-2 text-left text-sm transition-colors
                ${currentTemplate === template.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }
              `}
            >
              <div className="font-medium">{template.name}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                {template.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
