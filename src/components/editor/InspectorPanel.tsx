import { useEditorState } from './EditorProvider'
import { InspRoot, InspBadge } from './inspector-ui'
import NodeProperties from '../properties/NodeProperties'
import ConnectorProperties from '../properties/ConnectorProperties'
import GroupProperties from '../properties/GroupProperties'
import ImageProperties from '../properties/ImageProperties'
import ConnectorStylesPanel from '../properties/ConnectorStylesPanel'

export default function InspectorPanel() {
  const editor = useEditorState()

  const hasNodeSelected = editor.selectedNodeIds?.length > 0
  const hasConnectorSelected = editor.selectedConnectorIndex !== null
  const hasGroupSelected = editor.selectedGroupId !== null
  const hasImageSelected = editor.selectedImageId !== null
  const selectedNodeId = editor.selectedNodeIds?.[0]

  return (
    <InspRoot>
      {hasNodeSelected && (
        <>
          {editor.selectedNodeIds.length > 1 && (
            <InspBadge>{editor.selectedNodeIds.length} nodes selected</InspBadge>
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

      {!hasNodeSelected && !hasConnectorSelected && !hasGroupSelected && !hasImageSelected && (
        <ConnectorStylesPanel />
      )}
    </InspRoot>
  )
}