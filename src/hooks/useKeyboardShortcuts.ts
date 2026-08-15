import { useEffect, useCallback } from 'react'

import type { EditorMode } from '../types/editor'

interface KeyboardShortcuts {
  onDelete?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onSave?: () => void
  onNew?: () => void
  onEscape?: () => void
  onSetMode?: (mode: EditorMode) => void
}

/**
 * Is the event coming from somewhere the user is typing?
 *
 * Tag names alone are not enough: the markup pane is CodeMirror, whose editable
 * surface is a contenteditable <div>. Without this check the single-key mode
 * shortcuts (v/h/n/c) swallow those letters — preventDefault stops the
 * insertion — and Delete removes the selected node instead of a character.
 */
export function isTextEntry(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || el.nodeType !== 1) return false
  if (el.isContentEditable) return true
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return !!el.closest?.('.cm-editor, [role="textbox"], [contenteditable="true"]')
}

export default function useKeyboardShortcuts({
  onDelete,
  onUndo,
  onRedo,
  onSave,
  onNew,
  onEscape,
  onSetMode,
}: KeyboardShortcuts) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMeta = e.metaKey || e.ctrlKey

    if (isTextEntry(e.target)) {
      // Saving is the one command worth taking from a text field — otherwise
      // ⌘S hands the diagram to the browser's "save page" dialog. Everything
      // else, including undo, belongs to whatever has focus.
      if (isMeta && e.key.toLowerCase() === 's') {
        e.preventDefault()
        onSave?.()
      }
      // Escape steps out of the field first; a second press reaches the canvas.
      if (e.key === 'Escape') (e.target as HTMLElement).blur?.()
      return
    }

    // Delete/Backspace - delete selected
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isMeta) {
      e.preventDefault()
      onDelete?.()
      return
    }

    // Escape - clear selection/cancel mode
    if (e.key === 'Escape') {
      e.preventDefault()
      onEscape?.()
      return
    }

    // Cmd/Ctrl + Z - undo
    if (isMeta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault()
      onUndo?.()
      return
    }

    // Cmd/Ctrl + Shift + Z - redo
    if (isMeta && e.key.toLowerCase() === 'z' && e.shiftKey) {
      e.preventDefault()
      onRedo?.()
      return
    }

    // Cmd/Ctrl + S - save
    if (isMeta && e.key.toLowerCase() === 's') {
      e.preventDefault()
      onSave?.()
      return
    }

    // Cmd/Ctrl + N - new
    if (isMeta && e.key.toLowerCase() === 'n') {
      e.preventDefault()
      onNew?.()
      return
    }

    // Mode shortcuts (single keys, no modifiers)
    if (!isMeta && !e.shiftKey && !e.altKey) {
      switch (e.key.toLowerCase()) {
        case 'v':
          e.preventDefault()
          onSetMode?.('select')
          return
        case 'h':
          e.preventDefault()
          onSetMode?.('pan')
          return
        case 'n':
          e.preventDefault()
          onSetMode?.('addNode')
          return
        case 'c':
          e.preventDefault()
          onSetMode?.('addConnector')
          return
      }
    }
  }, [onDelete, onUndo, onRedo, onSave, onNew, onEscape, onSetMode])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
