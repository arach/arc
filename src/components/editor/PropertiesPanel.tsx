import React, { useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { useEditorState } from './EditorProvider'
import NodeProperties from '../properties/NodeProperties'
import ConnectorProperties from '../properties/ConnectorProperties'
import GroupProperties from '../properties/GroupProperties'
import ImageProperties from '../properties/ImageProperties'
import ConnectorStylesPanel from '../properties/ConnectorStylesPanel'

export default function PropertiesPanel() {
  const editor = useEditorState()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const hasNodeSelected = editor.selectedNodeIds?.length > 0
  const hasConnectorSelected = editor.selectedConnectorIndex !== null
  const hasGroupSelected = editor.selectedGroupId !== null
  const hasImageSelected = editor.selectedImageId !== null
  const hasSelection = hasNodeSelected || hasConnectorSelected || hasGroupSelected || hasImageSelected
  const selectedNodeId = editor.selectedNodeIds?.[0] // Show first selected node's properties

  return (
    <div className={`flex-shrink-0 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-0 overflow-hidden border-l-0' : 'w-72 overflow-y-auto'}`}>
      {/* Collapse/Expand toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute top-4 z-10 p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all ${isCollapsed ? '-left-10' : '-left-3'}`}
        title={isCollapsed ? 'Show inspector' : 'Hide inspector'}
      >
        {isCollapsed ? (
          <ChevronLeft className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        )}
      </button>

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
  )
}
