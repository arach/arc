// Nav slots for /showcase — same chrome vocabulary as the editor nav.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Link2 } from 'lucide-react'
import { useShowcase } from './ShowcaseContext'

export function ShowcaseNavCenter() {
  const s = useShowcase()
  return (
    <div className="arc-editor-nav-center">
      <strong>{s.doc.name}</strong>
      <span className="is-dirty">· player harness</span>
    </div>
  )
}

export function ShowcaseNavActions() {
  const s = useShowcase()
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    await navigator.clipboard.writeText(s.shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="arc-editor-actions">
      <Link to="/" className="arc-editor-btn-ghost" title="Back to home">
        Home
      </Link>
      <span className="arc-editor-divider" />
      <Link to="/docs" className="arc-editor-btn-ghost" title="Documentation">
        Docs
      </Link>
      <span className="arc-editor-divider" />
      <Link to="/editor" className="arc-editor-btn-ghost" title="Open the editor">
        Editor
      </Link>
      <button
        type="button"
        onClick={copyLink}
        className="arc-editor-btn-primary"
        title="Copy a link that restores this exact setup"
      >
        {copied ? <Check size={12} strokeWidth={2} /> : <Link2 size={12} strokeWidth={2} />}
        <span>{copied ? 'Copied' : 'Share setup'}</span>
      </button>
    </div>
  )
}
