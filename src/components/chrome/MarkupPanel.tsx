// The diagram's markup, as a pane beside the drawing.
//
// Opening it splits the surface — source on the left, rendering on the right —
// so an edit and its effect are visible at once. Editing runs the other way
// too: valid JSON is applied back to the diagram as you type.
//
// The editor is Hudson's CodeEditor from hudsonkit/controls (CodeMirror 6),
// which brings the syntax highlighting and gutter with it, so we only supply
// the language and the document. Its CodeMirror packages are optional peers of
// hudsonkit and are installed here.
//
// Two formats, deliberately different in kind:
//   .json  the document itself — editable, round-trips
//   .ts    a generated module for pasting into a repo — read-only, since
//          parsing arbitrary TypeScript back into a diagram is a different
//          problem to the one this pane solves

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { CodeEditor } from 'hudsonkit/controls'

export type MarkupFormat = 'ts' | 'json'

const WIDTH_KEY = 'arc-markup-width'
const MIN_WIDTH = 280
/** Leave the drawing at least a third of the surface. */
const MAX_FRACTION = 0.68

function loadWidth(): number {
  if (typeof window === 'undefined') return 460
  const stored = Number(window.localStorage.getItem(WIDTH_KEY))
  return Number.isFinite(stored) && stored >= MIN_WIDTH ? stored : 460
}

/** TypeScript module — what you paste into a repo. */
export function toTsSource(data: unknown, name = 'diagram'): string {
  const json = JSON.stringify(data, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'")
  return `import type { ArcDiagramData } from '@arach/arc'\n\nconst ${name}: ArcDiagramData = ${json}\n\nexport default ${name}\n`
}

/** A parsed payload has to look like a diagram before it is applied. */
function validateDiagram(value: unknown): string | null {
  if (!value || typeof value !== 'object') return 'Expected an object'
  const d = value as Record<string, unknown>
  if (!d.layout || typeof d.layout !== 'object') return 'Missing `layout`'
  if (!d.nodes || typeof d.nodes !== 'object') return 'Missing `nodes`'
  if (!d.nodeData || typeof d.nodeData !== 'object') return 'Missing `nodeData`'
  if (d.connectors != null && !Array.isArray(d.connectors)) return '`connectors` must be an array'
  return null
}

type Status =
  | { kind: 'clean' }
  | { kind: 'applied' }
  | { kind: 'error'; message: string }

interface MarkupPanelProps {
  title: string
  /** Clean export payload — no editor-only fields. */
  data: unknown
  /** Supplied by surfaces that can take an edit back. Omit for read-only. */
  onApply?: (next: Record<string, unknown>) => void
  onClose: () => void
}

export default function MarkupPanel({ title, data, onApply, onClose }: MarkupPanelProps) {
  const [format, setFormat] = useState<MarkupFormat>('json')
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: 'clean' })
  // Text the user is editing; null means "follow the diagram".
  const [draft, setDraft] = useState<string | null>(null)
  const applyTimer = useRef<number | null>(null)
  const [width, setWidth] = useState(loadWidth)
  const drag = useRef<{ startX: number; startWidth: number } | null>(null)

  const rendered = useMemo(
    () => (format === 'ts' ? toTsSource(data) : JSON.stringify(data, null, 2)),
    [format, data],
  )
  const editable = format === 'json' && !!onApply
  const source = draft ?? rendered

  // A diagram change from the canvas wins over a stale draft.
  useEffect(() => {
    setDraft(null)
    setStatus({ kind: 'clean' })
  }, [rendered])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => () => { if (applyTimer.current) window.clearTimeout(applyTimer.current) }, [])

  // --- resize ---

  const clampWidth = (px: number) =>
    Math.min(Math.max(px, MIN_WIDTH), Math.round(window.innerWidth * MAX_FRACTION))

  const onResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { startX: e.clientX, startWidth: width }
  }, [width])

  const onResizeMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return
    setWidth(clampWidth(drag.current.startWidth + (e.clientX - drag.current.startX)))
  }, [])

  const onResizeEnd = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return
    drag.current = null
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
    try { window.localStorage.setItem(WIDTH_KEY, String(width)) } catch { /* private mode */ }
  }, [width])

  // Double-click the handle to snap back to a readable default.
  const onResizeReset = useCallback(() => {
    setWidth(460)
    try { window.localStorage.setItem(WIDTH_KEY, '460') } catch { /* private mode */ }
  }, [])

  const handleChange = (next: string) => {
    setDraft(next)
    if (!editable) return
    if (applyTimer.current) window.clearTimeout(applyTimer.current)
    // Debounced: parsing on every keystroke would fight half-typed JSON.
    applyTimer.current = window.setTimeout(() => {
      let parsed: unknown
      try {
        parsed = JSON.parse(next)
      } catch (err) {
        setStatus({ kind: 'error', message: (err as Error).message.replace(/^JSON\.parse: /, '') })
        return
      }
      const problem = validateDiagram(parsed)
      if (problem) {
        setStatus({ kind: 'error', message: problem })
        return
      }
      onApply?.(parsed as Record<string, unknown>)
      setStatus({ kind: 'applied' })
    }, 400)
  }

  const copy = async () => {
    await navigator.clipboard.writeText(source)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const lines = source.split('\n').length
  const footer =
    status.kind === 'error'
      ? `⚠ ${status.message}`
      : status.kind === 'applied'
        ? `${lines} lines · applied to canvas`
        : `${lines} lines · ${format === 'ts' ? 'read-only export' : editable ? 'edit to update the diagram' : 'diagram JSON'}`

  return (
    <aside className="arc-markup-pane" style={{ width }} aria-label="Diagram markup">
      <div className="arc-markup-head">
        <span className="arc-markup-title">{title}</span>
        <div className="arc-markup-formats">
          <button
            type="button"
            className={`arc-settings-segment${format === 'json' ? ' is-active' : ''}`}
            onClick={() => setFormat('json')}
          >
            .json
          </button>
          <button
            type="button"
            className={`arc-settings-segment${format === 'ts' ? ' is-active' : ''}`}
            onClick={() => setFormat('ts')}
          >
            .ts
          </button>
        </div>
        <button type="button" className="arc-editor-btn" onClick={copy} title="Copy markup" aria-label="Copy markup">
          {copied ? <Check /> : <Copy />}
        </button>
        <button type="button" className="arc-editor-btn" onClick={onClose} title="Close" aria-label="Close markup">
          <X />
        </button>
      </div>

      <div className="arc-markup-source">
        <CodeEditor
          key={format}
          code={source}
          language={format === 'ts' ? 'typescript' : 'json'}
          filename={format === 'ts' ? 'diagram.ts' : 'diagram.json'}
          readOnly={!editable}
          showLineNumbers
          onChange={handleChange}
        />
      </div>

      <div className={`arc-markup-foot${status.kind === 'error' ? ' is-error' : ''}`}>{footer}</div>

      <div
        className="arc-markup-resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize markup pane"
        onPointerDown={onResizeStart}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeEnd}
        onPointerCancel={onResizeEnd}
        onDoubleClick={onResizeReset}
      />
    </aside>
  )
}
