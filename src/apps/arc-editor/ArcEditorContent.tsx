import ErrorBoundary from '../../components/ErrorBoundary'
import SettingsRail from '../../components/chrome/SettingsRail'
import DiagramCanvas from '../../components/editor/DiagramCanvas'
import FloatingToolbar from '../../components/editor/FloatingToolbar'
import { useEditorState, useThemeId } from '../../components/editor/EditorProvider'
import { useArcEditorViewport } from './ArcEditorContext'

export default function ArcEditorContent() {
  const editor = useEditorState()
  const themeId = useThemeId()
  const { setViewportBounds } = useArcEditorViewport()
  const isDark = editor.colorMode === 'dark'

  return (
    <div className="arc-shell-row">
      <SettingsRail />
      <div className="arc-editor-canvas arc-shell-main">
      <ErrorBoundary>
        <DiagramCanvas
          onViewportChange={setViewportBounds}
          embedConfig={{ enableViewModeToggle: true }}
          themeOverride={themeId || undefined}
          isDark={isDark}
        />
      </ErrorBoundary>
      <FloatingToolbar />
      </div>
    </div>
  )
}