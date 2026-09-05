import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'
import { useDiagram, useEditor, useViewMode } from './EditorProvider'
import { NODE_COLOR_HEX } from '../../utils/constants'

export type CtxTarget =
  | { kind: 'connector'; index: number }
  | { kind: 'node'; id: string }
  | { kind: 'group'; id: string }
  | { kind: 'image'; id: string }

export interface CtxMenuState {
  x: number
  y: number
  target: CtxTarget
}

const FLOOR_NUDGE = 16
const MENU_PAD = 8

export function CanvasContextMenu({
  menu,
  onClose,
}: {
  menu: CtxMenuState | null
  onClose: () => void
}) {
  const { actions } = useEditor()
  const diagram = useDiagram()
  const viewMode = useViewMode()
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !menu) return
    const rect = el.getBoundingClientRect()
    let x = menu.x
    let y = menu.y
    if (x + rect.width > window.innerWidth - MENU_PAD) x = window.innerWidth - MENU_PAD - rect.width
    if (y + rect.height > window.innerHeight - MENU_PAD) y = window.innerHeight - MENU_PAD - rect.height
    if (x < MENU_PAD) x = MENU_PAD
    if (y < MENU_PAD) y = MENU_PAD
    el.style.left = `${Math.round(x)}px`
    el.style.top = `${Math.round(y)}px`
  }, [menu])

  useEffect(() => {
    if (!menu) return
    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 2) return
      if (ref.current?.contains(e.target as Node)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKey)
    window.addEventListener('blur', onClose)
    window.addEventListener('resize', onClose)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', onClose)
      window.removeEventListener('resize', onClose)
    }
  }, [menu, onClose])

  if (!menu) return null

  const run = (fn: () => void) => {
    fn()
    onClose()
  }

  let body: ReactNode = null

  if (menu.target.kind === 'connector') {
    const index = menu.target.index
    const connector = diagram.connectors[index]
    if (!connector) return null
    const styles = Object.entries(diagram.connectorStyles)
    const fromName = diagram.nodeData[connector.from]?.name || connector.from
    const toName = diagram.nodeData[connector.to]?.name || connector.to

    body = (
      <>
        <div className="arc-ctx-kicker">Line</div>
        <div className="arc-ctx-meta">{fromName} → {toName}</div>
        <button
          type="button"
          role="menuitem"
          className="arc-ctx-item"
          onClick={() => run(() => actions.updateConnector(index, {
            from: connector.to,
            to: connector.from,
            fromAnchor: connector.toAnchor,
            toAnchor: connector.fromAnchor,
          }))}
        >
          Reverse
        </button>
        <div className="arc-ctx-sep" role="separator" />
        <div className="arc-ctx-kicker">Style</div>
        {styles.map(([key, style]) => {
          const active = connector.style === key
          const color = (style.color || 'zinc') as keyof typeof NODE_COLOR_HEX
          return (
            <button
              key={key}
              type="button"
              role="menuitem"
              className={`arc-ctx-item${active ? ' is-active' : ''}`}
              aria-checked={active}
              onClick={() => run(() => {
                if (!active) actions.updateConnector(index, { style: key })
              })}
            >
              <span
                className="arc-ctx-dot"
                style={{ background: NODE_COLOR_HEX[color] || NODE_COLOR_HEX.zinc }}
              />
              <span className="arc-ctx-label">{style.label || key}</span>
              {active && <Check className="arc-ctx-check" strokeWidth={2} />}
            </button>
          )
        })}
        <div className="arc-ctx-sep" role="separator" />
        <button
          type="button"
          role="menuitem"
          className="arc-ctx-item is-danger"
          onClick={() => run(() => actions.removeConnector(index))}
        >
          Delete
          <span className="arc-ctx-shortcut">Del</span>
        </button>
      </>
    )
  } else if (menu.target.kind === 'node') {
    const nodeId = menu.target.id
    const node = diagram.nodes[nodeId]
    const data = diagram.nodeData[nodeId]
    if (!node || !data) return null
    const isIso = viewMode === 'isometric'

    body = (
      <>
        <div className="arc-ctx-kicker">Node</div>
        <div className="arc-ctx-meta">{data.name || nodeId}</div>
        <button
          type="button"
          role="menuitem"
          className="arc-ctx-item"
          onClick={() => run(() => actions.duplicateNode(nodeId))}
        >
          Duplicate
        </button>
        {isIso && (
          <>
            <div className="arc-ctx-sep" role="separator" />
            <button
              type="button"
              role="menuitem"
              className="arc-ctx-item"
              onClick={() => run(() => actions.updateNodePosition(nodeId, {
                x: Math.round(node.x - FLOOR_NUDGE),
                y: Math.round(node.y - FLOOR_NUDGE),
              }))}
            >
              Nudge behind
            </button>
            <button
              type="button"
              role="menuitem"
              className="arc-ctx-item"
              onClick={() => run(() => actions.updateNodePosition(nodeId, {
                x: Math.round(node.x + FLOOR_NUDGE),
                y: Math.round(node.y + FLOOR_NUDGE),
              }))}
            >
              Nudge forward
            </button>
            <button
              type="button"
              role="menuitem"
              className="arc-ctx-item"
              onClick={() => run(() => actions.updateNodePosition(nodeId, {
                isoOrder: (node.isoOrder ?? 0) - 1,
              }))}
            >
              Send under
            </button>
            <button
              type="button"
              role="menuitem"
              className="arc-ctx-item"
              onClick={() => run(() => actions.updateNodePosition(nodeId, {
                isoOrder: (node.isoOrder ?? 0) + 1,
              }))}
            >
              Bring over
            </button>
          </>
        )}
        <div className="arc-ctx-sep" role="separator" />
        <button
          type="button"
          role="menuitem"
          className="arc-ctx-item is-danger"
          onClick={() => run(() => actions.removeNode(nodeId))}
        >
          Delete
          <span className="arc-ctx-shortcut">Del</span>
        </button>
      </>
    )
  } else if (menu.target.kind === 'group') {
    const groupId = menu.target.id
    const group = diagram.groups?.find((g: { id: string }) => g.id === groupId)
    if (!group) return null
    body = (
      <>
        <div className="arc-ctx-kicker">Group</div>
        <div className="arc-ctx-meta">{group.label || group.type || 'Group'}</div>
        <button
          type="button"
          role="menuitem"
          className="arc-ctx-item is-danger"
          onClick={() => run(() => actions.removeGroup(group.id))}
        >
          Delete
          <span className="arc-ctx-shortcut">Del</span>
        </button>
      </>
    )
  } else if (menu.target.kind === 'image') {
    const imageId = menu.target.id
    const image = diagram.images?.find((img: { id: string }) => img.id === imageId)
    if (!image) return null
    body = (
      <>
        <div className="arc-ctx-kicker">Image</div>
        <div className="arc-ctx-meta">{image.name || 'Image'}</div>
        <button
          type="button"
          role="menuitem"
          className="arc-ctx-item is-danger"
          onClick={() => run(() => actions.removeImage(image.id))}
        >
          Delete
          <span className="arc-ctx-shortcut">Del</span>
        </button>
      </>
    )
  }

  const host =
    (typeof document !== 'undefined' &&
      ((document.querySelector('.arc-editor-root [data-hudson-theme]') as HTMLElement | null) ||
        (document.querySelector('.arc-editor-root') as HTMLElement | null))) ||
    document.body

  return createPortal(
    <div
      ref={ref}
      className="arc-ctx"
      role="menu"
      style={{ left: menu.x, top: menu.y }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {body}
    </div>,
    host
  )
}
