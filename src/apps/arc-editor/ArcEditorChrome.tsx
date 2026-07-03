import { Link } from 'react-router-dom'
import { File, FolderOpen, Save, Share, Palette } from 'lucide-react'
import { useEditor, useMeta, useTemplate } from '../../components/editor/EditorProvider'
import { getTemplateList } from '../../utils/templates'
import { useArcEditor } from './ArcEditorContext'

function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: typeof File
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="arc-editor-btn"
      title={label}
      aria-label={label}
      disabled={disabled}
    >
      <Icon size={14} strokeWidth={1.75} />
    </button>
  )
}

function TemplateMenu() {
  const { actions } = useEditor()
  const currentTemplate = useTemplate()
  const templates = getTemplateList()

  return (
    <div className="arc-editor-menu-wrap relative">
      <button
        type="button"
        className="arc-editor-btn"
        title="Change template"
        aria-label="Change template"
      >
        <Palette size={14} strokeWidth={1.75} />
      </button>
      <div className="arc-editor-menu" role="menu">
        <div className="arc-editor-menu-label">Style template</div>
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            role="menuitem"
            onClick={() => actions.setTemplate(template.id)}
            className={`arc-editor-menu-item ${currentTemplate === template.id ? 'is-active' : ''}`}
          >
            <div className="arc-editor-menu-item-name">{template.name}</div>
            <div className="arc-editor-menu-item-desc">{template.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export function ArcEditorNavCenter() {
  const meta = useMeta()

  return (
    <div className="arc-editor-nav-center">
      <strong>{meta.filename || 'Untitled diagram'}</strong>
      {meta.isDirty && <span className="is-dirty">· edited</span>}
    </div>
  )
}

export function ArcEditorNavActions() {
  const { handleNew, handleOpen, handleSave, openShare } = useArcEditor()

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
      <IconButton icon={File} label="New diagram" onClick={handleNew} />
      <IconButton icon={FolderOpen} label="Open diagram" onClick={() => { void handleOpen() }} />
      <IconButton icon={Save} label="Save diagram" onClick={() => { void handleSave() }} />
      <span className="arc-editor-divider" />
      <TemplateMenu />
      <span className="arc-editor-divider" />
      <button
        type="button"
        onClick={openShare}
        className="arc-editor-btn-primary"
        title="Share diagram"
      >
        <Share size={12} strokeWidth={2} />
        <span>Share</span>
      </button>
    </div>
  )
}