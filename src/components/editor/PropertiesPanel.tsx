// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { ChevronRight, PanelRight } from 'lucide-react'
import { useEditorState } from './EditorProvider'
import NodeProperties from '../properties/NodeProperties'
import ConnectorProperties from '../properties/ConnectorProperties'
import GroupProperties from '../properties/GroupProperties'
import ImageProperties from '../properties/ImageProperties'
import ConnectorStylesPanel from '../properties/ConnectorStylesPanel'

export type PropertiesInspectorVariant = 'standalone' | 'hudson'

export function PropertiesInspectorContent({
  variant = 'standalone',
}: {
  variant?: PropertiesInspectorVariant
}) {
  const editor = useEditorState()
  const isHudson = variant === 'hudson'

  const hasNodeSelected = editor.selectedNodeIds?.length > 0
  const hasConnectorSelected = editor.selectedConnectorIndex !== null
  const hasGroupSelected = editor.selectedGroupId !== null
  const hasImageSelected = editor.selectedImageId !== null
  const hasSelection = hasNodeSelected || hasConnectorSelected || hasGroupSelected || hasImageSelected
  const selectedNodeId = editor.selectedNodeIds?.[0]

  return (
    <div className={isHudson ? 'space-y-5' : 'space-y-4'}>
      {hasNodeSelected && (
        <>
          {editor.selectedNodeIds.length > 1 && (
            <div
              className={isHudson
                ? 'rounded-lg border border-blue-500/20 bg-blue-500/5 px-2.5 py-2 text-[10px] font-medium text-blue-300'
                : 'mb-3 rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}
            >
              {editor.selectedNodeIds.length} nodes selected
            </div>
          )}
          <NodeProperties nodeId={selectedNodeId} showHeading={!isHudson} />
        </>
      )}

      {hasConnectorSelected && (
        <ConnectorProperties
          connectorIndex={editor.selectedConnectorIndex}
          showHeading={!isHudson}
        />
      )}

      {hasGroupSelected && (
        <GroupProperties
          groupId={editor.selectedGroupId}
          showHeading={!isHudson}
        />
      )}

      {hasImageSelected && (
        <ImageProperties
          imageId={editor.selectedImageId}
          showHeading={!isHudson}
        />
      )}

      {!hasSelection && (
        <ConnectorStylesPanel
          showHeading={!isHudson}
          showDescription={!isHudson}
        />
      )}
    </div>
  )
}

export default function PropertiesPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [manuallyCollapsed, setManuallyCollapsed] = useState(false)
  const prevHasSelection = useRef(false)
  const editor = useEditorState()

  const hasNodeSelected = editor.selectedNodeIds?.length > 0
  const hasConnectorSelected = editor.selectedConnectorIndex !== null
  const hasGroupSelected = editor.selectedGroupId !== null
  const hasImageSelected = editor.selectedImageId !== null
  const hasSelection = hasNodeSelected || hasConnectorSelected || hasGroupSelected || hasImageSelected

  // Auto-expand when selecting something (unless manually collapsed)
  useEffect(() => {
    if (hasSelection && !prevHasSelection.current && isCollapsed && !manuallyCollapsed) {
      setIsCollapsed(false)
    }
    prevHasSelection.current = hasSelection
  }, [hasSelection, isCollapsed, manuallyCollapsed])

  const handleToggle = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    setManuallyCollapsed(newCollapsed) // Track manual collapse
  }

  return (
    <>
      {/* Floating expand button when collapsed */}
      {isCollapsed && (
        <button
          onClick={() => { setIsCollapsed(false); setManuallyCollapsed(false) }}
          className="absolute right-4 top-4 z-20 p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
          title="Show inspector"
        >
          <PanelRight className="w-4 h-4 text-zinc-500" />
        </button>
      )}

      <div className={`flex-shrink-0 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-0 overflow-hidden border-l-0' : 'w-72 overflow-y-auto'}`}>
        {/* Collapse button (only visible when expanded) */}
        {!isCollapsed && (
          <button
            onClick={handleToggle}
            className="absolute top-4 -left-3 z-10 p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
            title="Hide inspector"
          >
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>
        )}

        <div className={`p-4 ${isCollapsed ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}>
          <PropertiesInspectorContent />
        </div>
      </div>
    </>
  )
}
