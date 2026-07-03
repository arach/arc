import { Grid3X3 } from 'lucide-react'
import { useEditor, useDiagram } from '../editor/EditorProvider'
import { GRID_COLORS, DEFAULT_GRID } from '../../utils/constants'
import {
  InspSection,
  InspTitle,
  InspField,
  InspLabel,
  InspCheckbox,
  InspSegmented,
  InspDivider,
} from '../editor/inspector-ui'

export default function GridSettings() {
  const { dispatch } = useEditor()
  const diagram = useDiagram()
  const grid = diagram.grid || DEFAULT_GRID

  const handleUpdate = (updates: Record<string, unknown>) => {
    dispatch({ type: 'grid/update', updates })
  }

  return (
    <InspSection>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Grid3X3 size={14} strokeWidth={1.75} color="var(--arc-muted)" />
        <InspTitle>Grid</InspTitle>
      </div>

      <InspCheckbox label="Show grid" checked={grid.enabled} onChange={(v) => handleUpdate({ enabled: v })} />

      {grid.enabled && (
        <>
          <InspField>
            <InspLabel>Type</InspLabel>
            <InspSegmented
              value={grid.type || 'dots'}
              options={[
                { value: 'dots', label: 'Dots' },
                { value: 'lines', label: 'Lines' },
              ]}
              onChange={(v) => handleUpdate({ type: v })}
            />
          </InspField>

          <InspField>
            <InspLabel>Spacing: {grid.size}px</InspLabel>
            <input
              type="range"
              className="arc-insp-input"
              min={8}
              max={48}
              step={4}
              value={grid.size}
              onChange={(e) => handleUpdate({ size: parseInt(e.target.value, 10) })}
            />
          </InspField>

          <InspField>
            <InspLabel>Opacity: {Math.round((grid.opacity ?? 0.1) * 100)}%</InspLabel>
            <input
              type="range"
              className="arc-insp-input"
              min={0}
              max={100}
              value={Math.round((grid.opacity ?? 0.1) * 100)}
              onChange={(e) => handleUpdate({ opacity: parseInt(e.target.value, 10) / 100 })}
            />
          </InspField>

          <InspField>
            <InspLabel>Color</InspLabel>
            <div className="arc-insp-swatch-row">
              {GRID_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.name}
                  className={`arc-insp-swatch${grid.color === color.value ? ' is-selected' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleUpdate({ color: color.value })}
                />
              ))}
            </div>
          </InspField>
        </>
      )}

      <InspDivider />
    </InspSection>
  )
}