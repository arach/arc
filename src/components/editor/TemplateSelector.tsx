// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Layers, Palette } from 'lucide-react'
import { useEditor, useTemplate, useThemeId } from './EditorProvider'
import { getTemplateList } from '../../utils/templates'
import { getThemeList } from '../../utils/themes'
import { TEMPLATE_THEME_DEFAULT_ID, type StyleSourceSelection } from './StyleSourcePane'

function clsx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export default function TemplateSelector({
  onOpenStyles,
}: {
  onOpenStyles: (selection: StyleSourceSelection) => void
}) {
  const { actions } = useEditor()
  const currentTemplate = useTemplate()
  const currentThemeId = useThemeId()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const templates = useMemo(() => getTemplateList(), [])
  const themes = useMemo(() => ([
    {
      id: TEMPLATE_THEME_DEFAULT_ID,
      name: 'Template Defaults',
      description: 'Use template-defined colors and canvas styling.',
    },
    ...getThemeList(),
  ]), [])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  const handleApplyTemplate = useCallback((templateId: string) => {
    actions.setTemplate(templateId)
    setIsOpen(false)
  }, [actions])

  const handleApplyTheme = useCallback((themeId: string) => {
    actions.setTheme(themeId === TEMPLATE_THEME_DEFAULT_ID ? null : themeId)
    setIsOpen(false)
  }, [actions])

  const handleOpenStyles = useCallback((selection: StyleSourceSelection) => {
    setIsOpen(false)
    onOpenStyles(selection)
  }, [onOpenStyles])

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        title="Open styles"
      >
        <Palette className="h-4 w-4" />
        <span className="hidden sm:inline">Styles</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Styles</div>
            <div className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Templates control structure. Themes control palette and background treatment.
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto px-3 py-3">
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                <Layers className="h-3.5 w-3.5" />
                Templates
              </div>
              <div className="space-y-1.5">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={clsx(
                      'rounded-xl border px-3 py-3',
                      currentTemplate === template.id
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10'
                        : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/70',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{template.name}</div>
                        <div className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{template.description}</div>
                      </div>
                      {currentTemplate === template.id && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          Using
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleApplyTemplate(template.id)}
                        className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => handleOpenStyles({ kind: 'template', id: template.id })}
                        className="rounded-md border border-sky-300/40 px-2.5 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-50 dark:border-sky-500/40 dark:text-sky-300 dark:hover:bg-sky-950/40"
                      >
                        Edit Source
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                <Palette className="h-3.5 w-3.5" />
                Themes
              </div>
              <div className="space-y-1.5">
                {themes.map((theme) => {
                  const isActive = (currentThemeId || TEMPLATE_THEME_DEFAULT_ID) === theme.id

                  return (
                    <div
                      key={theme.id}
                      className={clsx(
                        'rounded-xl border px-3 py-3',
                        isActive
                          ? 'border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10'
                          : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/70',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{theme.name}</div>
                          <div className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{theme.description}</div>
                        </div>
                        {isActive && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            Using
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => handleApplyTheme(theme.id)}
                          className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          {theme.id === TEMPLATE_THEME_DEFAULT_ID ? 'Use Defaults' : 'Apply'}
                        </button>
                        <button
                          onClick={() => handleOpenStyles({ kind: 'theme', id: theme.id })}
                          className="rounded-md border border-sky-300/40 px-2.5 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-50 dark:border-sky-500/40 dark:text-sky-300 dark:hover:bg-sky-950/40"
                        >
                          Edit Source
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
