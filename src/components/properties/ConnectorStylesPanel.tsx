import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useEditor, useDiagram } from '../editor/EditorProvider'
import { COLOR_OPTIONS, NODE_COLOR_HEX } from '../../utils/constants'
import {
  InspSection,
  InspTitle,
  InspHint,
  InspField,
  InspLabel,
  InspInput,
  InspCheckbox,
  InspDivider,
  InspAccordion,
  InspRange,
} from '../editor/inspector-ui'
import GridSettings from './GridSettings'

function StyleEditor({
  styleName,
  style,
  onUpdate,
  onDelete,
  connectorsUsingStyle,
}: {
  styleName: string
  style: any
  onUpdate: (updates: Record<string, unknown>) => void
  onDelete: () => void
  connectorsUsingStyle: number
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <InspAccordion
      title={styleName}
      meta={`${connectorsUsingStyle} conn.`}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      leading={<span className="arc-insp-dot" style={{ backgroundColor: NODE_COLOR_HEX[style.color] || '#6b757a' }} />}
    >
      <InspField>
        <InspLabel>Label</InspLabel>
        <InspInput
          type="text"
          value={style.label || ''}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Optional label"
        />
      </InspField>

      <InspField>
        <InspLabel>Color</InspLabel>
        <div className="arc-insp-swatch-row">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              className={`arc-insp-swatch${style.color === color ? ' is-selected' : ''}`}
              style={{ backgroundColor: NODE_COLOR_HEX[color] }}
              onClick={() => onUpdate({ color })}
            />
          ))}
        </div>
      </InspField>

      <InspRange
        label="Stroke width"
        value={style.strokeWidth || 2}
        min={1}
        max={6}
        onChange={(v) => onUpdate({ strokeWidth: v })}
      />

      <InspCheckbox label="Dashed" checked={style.dashed === true} onChange={(v) => onUpdate({ dashed: v })} />
      <InspCheckbox label="Show arrow" checked={style.showArrow !== false} onChange={(v) => onUpdate({ showArrow: v })} />
      <InspCheckbox label="Show endpoint dots" checked={style.showEndpoints !== false} onChange={(v) => onUpdate({ showEndpoints: v })} />

      {connectorsUsingStyle === 0 && (
        <button type="button" className="arc-insp-link" onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Trash2 size={12} />
          Delete style
        </button>
      )}
    </InspAccordion>
  )
}

export default function ConnectorStylesPanel() {
  const { dispatch, actions } = useEditor()
  const diagram = useDiagram()
  const [newStyleName, setNewStyleName] = useState('')
  const [showConnectors, setShowConnectors] = useState(true)

  const styleUsage: Record<string, number> = {}
  for (const styleName of Object.keys(diagram.connectorStyles)) {
    styleUsage[styleName] = diagram.connectors.filter((c) => c.style === styleName).length
  }

  const handleUpdateStyle = (styleName: string, updates: Record<string, unknown>) => {
    dispatch({ type: 'connectorStyle/update', styleName, updates })
  }

  const handleAddStyle = () => {
    if (!newStyleName.trim()) return
    const safeName = newStyleName.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!safeName || diagram.connectorStyles[safeName]) return

    dispatch({
      type: 'connectorStyle/add',
      styleName: safeName,
      style: {
        color: 'zinc',
        strokeWidth: 2,
        label: newStyleName,
        dashed: false,
        showArrow: true,
        showEndpoints: true,
      },
    })
    setNewStyleName('')
  }

  const handleDeleteStyle = (styleName: string) => {
    dispatch({ type: 'connectorStyle/delete', styleName })
  }

  return (
    <InspSection>
      <InspTitle>Connector styles</InspTitle>
      <InspHint>Reusable styles for diagram connections. Expand a style to edit it.</InspHint>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(diagram.connectorStyles).map(([name, style]) => (
          <StyleEditor
            key={name}
            styleName={name}
            style={style}
            onUpdate={(updates) => handleUpdateStyle(name, updates)}
            onDelete={() => handleDeleteStyle(name)}
            connectorsUsingStyle={styleUsage[name] || 0}
          />
        ))}
      </div>

      <InspField>
        <InspLabel>Add style</InspLabel>
        <div className="arc-insp-add-row">
          <InspInput
            type="text"
            value={newStyleName}
            onChange={(e) => setNewStyleName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStyle()}
            placeholder="Style name…"
          />
          <button type="button" className="arc-insp-add-btn" onClick={handleAddStyle} disabled={!newStyleName.trim()}>
            <Plus size={16} />
          </button>
        </div>
      </InspField>

      <InspDivider />

      <button
        type="button"
        className="arc-insp-subsection-toggle"
        onClick={() => setShowConnectors(!showConnectors)}
      >
        <span className="arc-insp-accordion-chevron" aria-hidden="true">{showConnectors ? '▾' : '▸'}</span>
        <span className="arc-insp-accordion-title">Connections ({diagram.connectors.length})</span>
      </button>

      {showConnectors && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {diagram.connectors.map((connector, index) => {
            const fromNode = diagram.nodeData[connector.from]?.name || connector.from
            const toNode = diagram.nodeData[connector.to]?.name || connector.to
            const style = diagram.connectorStyles[connector.style]

            return (
              <button
                key={index}
                type="button"
                className="arc-insp-list-item"
                onClick={() => actions.selectConnector(index)}
              >
                <span
                  className="arc-insp-dot"
                  style={{ backgroundColor: NODE_COLOR_HEX[style?.color] || '#6b757a' }}
                />
                <span className="arc-insp-list-item-label">{fromNode} → {toNode}</span>
                <span className="arc-insp-list-item-meta">{connector.style}</span>
              </button>
            )
          })}
        </div>
      )}

      <GridSettings />
    </InspSection>
  )
}