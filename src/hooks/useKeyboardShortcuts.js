import { useEffect, useCallback } from 'react'

export default function useKeyboardShortcuts({
  onDelete,
  onUndo,
  onRedo,
  onSave,
  onNew,
  onEscape,
  onSetMode,
}) {
  const handleKeyDown = useCallback((e) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (e.key === 'Escape') {
        e.target.blur()
      }
      return
    }

    const isMeta = e.metaKey || e.ctrlKey

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
    if (isMeta && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      onUndo?.()
      return
    }

    // Cmd/Ctrl + Shift + Z - redo
    if (isMeta && e.key === 'z' && e.shiftKey) {
      e.preventDefault()
      onRedo?.()
      return
    }

    // Cmd/Ctrl + S - save
    if (isMeta && e.key === 's') {
      e.preventDefault()
      onSave?.()
      return
    }

    // Cmd/Ctrl + N - new
    if (isMeta && e.key === 'n') {
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
