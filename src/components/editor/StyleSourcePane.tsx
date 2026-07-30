// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Layers, Palette, RefreshCw, Save } from 'lucide-react'
import { useEditor, useTemplate, useThemeId } from './EditorProvider'
import { getTemplateList, TEMPLATE_SOURCE_PATH, type TemplateId } from '../../utils/templates'
import { getThemeList, THEME_SOURCE_PATH, type ThemeId } from '../../utils/themes'

export type StyleSourceKind = 'template' | 'theme'

export interface StyleSourceSelection {
  kind: StyleSourceKind
  id: string
}

export const TEMPLATE_THEME_DEFAULT_ID = '__template-default__'

async function loadDevTextFile(filePath: string) {
  const response = await fetch(`/__arc/dev/file?path=${encodeURIComponent(filePath)}&format=text`)
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new Error(errorBody?.error || `Failed to load source file (${response.status})`)
  }
  return response.text()
}

async function saveDevTextFile(filePath: string, content: string) {
  const response = await fetch(`/__arc/dev/file?path=${encodeURIComponent(filePath)}&format=text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
    body: content,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new Error(errorBody?.error || `Failed to save source file (${response.status})`)
  }
}

function clsx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export default function StyleSourcePane({
  selection,
  onSelectionChange,
}: {
  selection: StyleSourceSelection
  onSelectionChange: (selection: StyleSourceSelection) => void
}) {
  const { actions } = useEditor()
  const currentTemplate = useTemplate()
  const currentThemeId = useThemeId()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [sourceText, setSourceText] = useState('')
  const [savedSourceText, setSavedSourceText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const templates = useMemo(() => getTemplateList(), [])
  const themes = useMemo(() => ([
    {
      id: TEMPLATE_THEME_DEFAULT_ID,
      name: 'Template Defaults',
      description: 'No palette override. Use the current template styling as-is.',
      sourcePath: THEME_SOURCE_PATH,
    },
    ...getThemeList(),
  ]), [])

  const isDirty = sourceText !== savedSourceText

  const selectedSourcePath = selection.kind === 'template'
    ? TEMPLATE_SOURCE_PATH
    : THEME_SOURCE_PATH

  const selectedItem = selection.kind === 'template'
    ? templates.find((item) => item.id === selection.id)
    : themes.find((item) => item.id === selection.id)

  const selectedMarker = selection.kind === 'theme' && selection.id === TEMPLATE_THEME_DEFAULT_ID
    ? null
    : `id: '${selection.id}'`

  const activeThemeSelection = currentThemeId || TEMPLATE_THEME_DEFAULT_ID

  const handleSelectionChange = useCallback((nextSelection: StyleSourceSelection) => {
    const nextSourcePath = nextSelection.kind === 'template' ? TEMPLATE_SOURCE_PATH : THEME_SOURCE_PATH

    if (isDirty && nextSourcePath !== selectedSourcePath) {
      const shouldDiscard = window.confirm('Discard unsaved style source changes?')
      if (!shouldDiscard) return
    }

    setError(null)
    setStatus(null)
    onSelectionChange(nextSelection)
  }, [isDirty, onSelectionChange, selectedSourcePath])

  const loadSource = useCallback(async (filePath: string) => {
    setIsLoading(true)
    setError(null)
    setStatus(null)

    try {
      const content = await loadDevTextFile(filePath)
      setSourceText(content)
      setSavedSourceText(content)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load style source')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSource(selectedSourcePath)
  }, [loadSource, selectedSourcePath])

  useEffect(() => {
    if (!selectedMarker || !sourceText || !textareaRef.current) return

    const markerIndex = sourceText.indexOf(selectedMarker)
    if (markerIndex < 0) return

    const textarea = textareaRef.current
    const lineCount = sourceText.slice(0, markerIndex).split('\n').length

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(markerIndex, markerIndex + selectedMarker.length)
      textarea.scrollTop = Math.max(0, (lineCount - 4) * 24)
    })
  }, [selectedMarker, sourceText])

  const handleReload = useCallback(() => {
    if (isDirty) {
      const shouldDiscard = window.confirm('Discard unsaved style source changes and reload from disk?')
      if (!shouldDiscard) return
    }

    void loadSource(selectedSourcePath)
  }, [isDirty, loadSource, selectedSourcePath])

  const handleSave = useCallback(async () => {
    try {
      await saveDevTextFile(selectedSourcePath, sourceText)
      setSavedSourceText(sourceText)
      setStatus(`Saved ${selectedSourcePath}`)
      setError(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save style source')
    }
  }, [selectedSourcePath, sourceText])

  const handleApply = useCallback(() => {
    if (selection.kind === 'template') {
      actions.setTemplate(selection.id as TemplateId)
      setStatus(`Applied template "${selectedItem?.name || selection.id}"`)
      return
    }

    const nextThemeId = selection.id === TEMPLATE_THEME_DEFAULT_ID ? null : selection.id as ThemeId
    actions.setTheme(nextThemeId)
    setStatus(nextThemeId ? `Applied theme "${selectedItem?.name || selection.id}"` : 'Using template defaults')
  }, [actions, selectedItem?.name, selection.id, selection.kind])

  const isUsingSelection = selection.kind === 'template'
    ? currentTemplate === selection.id
    : activeThemeSelection === selection.id

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="w-[320px] flex-shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Styles</div>
          <div className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Templates define editor chrome. Themes define palettes and background treatment.
          </div>
        </div>

        <div className="px-3 py-4">
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              <Layers className="h-3.5 w-3.5" />
              Templates
            </div>
            <div className="space-y-1.5">
              {templates.map((template) => {
                const isSelected = selection.kind === 'template' && selection.id === template.id
                const isActive = currentTemplate === template.id

                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectionChange({ kind: 'template', id: template.id })}
                    className={clsx(
                      'w-full rounded-xl border px-3 py-3 text-left transition-colors',
                      isSelected
                        ? 'border-blue-300 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10'
                        : 'border-transparent bg-white hover:border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{template.name}</div>
                      {isActive && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          Using
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      {template.description}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              <Palette className="h-3.5 w-3.5" />
              Themes
            </div>
            <div className="space-y-1.5">
              {themes.map((theme) => {
                const isSelected = selection.kind === 'theme' && selection.id === theme.id
                const isActive = activeThemeSelection === theme.id

                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectionChange({ kind: 'theme', id: theme.id })}
                    className={clsx(
                      'w-full rounded-xl border px-3 py-3 text-left transition-colors',
                      isSelected
                        ? 'border-blue-300 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10'
                        : 'border-transparent bg-white hover:border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{theme.name}</div>
                      {isActive && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          Using
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      {theme.description}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {selection.kind}
                </span>
                {isUsingSelection && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <Check className="h-3 w-3" />
                    Active
                  </span>
                )}
              </div>
              <div className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {selectedItem?.name || 'Styles'}
              </div>
              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {selectedItem?.description}
              </div>
              <div className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                Source: <span className="font-mono">{selectedSourcePath}</span>
              </div>
              {selectedMarker && (
                <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Jump target: <span className="font-mono">{selectedMarker}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReload}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload
              </button>
              <button
                onClick={handleApply}
                disabled={isUsingSelection}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  isUsingSelection
                    ? 'cursor-default bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    : 'border border-sky-300/40 text-sky-700 hover:bg-sky-50 dark:border-sky-500/40 dark:text-sky-300 dark:hover:bg-sky-950/40',
                )}
              >
                {selection.kind === 'template'
                  ? isUsingSelection ? 'Template Active' : 'Apply Template'
                  : selection.id === TEMPLATE_THEME_DEFAULT_ID
                    ? isUsingSelection ? 'Using Template Defaults' : 'Use Template Defaults'
                    : isUsingSelection ? 'Theme Active' : 'Apply Theme'}
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  isDirty
                    ? 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
                    : 'cursor-default bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
                )}
              >
                <Save className="h-3.5 w-3.5" />
                Save Source
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <div>
              Edit the real source file directly. Saving writes back to disk and should hot-reload the editor.
            </div>
            <div className="font-medium">
              {isDirty ? 'Unsaved changes' : 'Synced with disk'}
            </div>
          </div>

          {status && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              {status}
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden bg-zinc-50/80 dark:bg-zinc-950/80">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
              Loading style source...
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={sourceText}
              onChange={(event) => {
                setSourceText(event.target.value)
                setStatus(null)
              }}
              spellCheck={false}
              className="h-full w-full resize-none border-0 bg-transparent px-4 py-4 font-mono text-[12px] leading-6 text-zinc-800 outline-none dark:text-zinc-200"
            />
          )}
        </div>
      </section>
    </div>
  )
}
