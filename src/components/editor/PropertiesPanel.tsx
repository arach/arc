import React from 'react'
import { useEditorState } from './EditorProvider'
import NodeProperties from '../properties/NodeProperties'
import ConnectorProperties from '../properties/ConnectorProperties'
import GroupProperties from '../properties/GroupProperties'
import ImageProperties from '../properties/ImageProperties'
import ConnectorStylesPanel from '../properties/ConnectorStylesPanel'

export default function PropertiesPanel() {
  const editor = useEditorState()

  const hasNodeSelected = editor.selectedNodeIds?.length > 0
  const hasConnectorSelected = editor.selectedConnectorIndex !== null
  const hasGroupSelected = editor.selectedGroupId !== null
  const hasImageSelected = editor.selectedImageId !== null
  const hasSelection = hasNodeSelected || hasConnectorSelected || hasGroupSelected || hasImageSelected
  const selectedNodeId = editor.selectedNodeIds?.[0] // Show first selected node's properties

  return (
    <div className="w-72 flex-shrink-0 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto">
      <div className="p-4">
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
