import React, { useState, useEffect, useRef } from 'react'
import { ChevronRight, ChevronLeft, PanelRight } from 'lucide-react'
import { useEditorState } from './EditorProvider'
import NodeProperties from '../properties/NodeProperties'
import ConnectorProperties from '../properties/ConnectorProperties'
import GroupProperties from '../properties/GroupProperties'
import ImageProperties from '../properties/ImageProperties'
import ConnectorStylesPanel from '../properties/ConnectorStylesPanel'

export default function PropertiesPanel() {
  const editor = useEditorState()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [manuallyCollapsed, setManuallyCollapsed] = useState(false)
  const prevHasSelection = useRef(false)

  const hasNodeSelected = editor.selectedNodeIds?.length > 0
  const hasConnectorSelected = editor.selectedConnectorIndex !== null
  const hasGroupSelected = editor.selectedGroupId !== null
  const hasImageSelected = editor.selectedImageId !== null
  const hasSelection = hasNodeSelected || hasConnectorSelected || hasGroupSelected || hasImageSelected
  const selectedNodeId = editor.selectedNodeIds?.[0] // Show first selected node's properties

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
        {hasNodeSelected && (
          <>
            {editor.selectedNodeIds.length > 1 && (
              <div className="mb-3 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                {editor.selectedNodeIds.length} nodes selected
              </div>
            )}
            <NodeProperties nodeId={selectedNodeId} />
          </>
        )}

        {hasConnectorSelected && (
          <ConnectorProperties connectorIndex={editor.selectedConnectorIndex} />
        )}

        {hasGroupSelected && (
          <GroupProperties groupId={editor.selectedGroupId} />
        )}

        {hasImageSelected && (
          <ImageProperties imageId={editor.selectedImageId} />
        )}

        {!hasSelection && (
          <ConnectorStylesPanel />
        )}
      </div>
      </div>
    </>
  )
}
