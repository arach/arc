import { COLOR_OPTIONS, NODE_COLOR_HEX } from '../../utils/constants'

export default function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="arc-insp-swatch-row">
      {COLOR_OPTIONS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          title={color}
          className={`arc-insp-swatch${value === color ? ' is-selected' : ''}`}
          style={{ backgroundColor: NODE_COLOR_HEX[color] }}
        />
      ))}
    </div>
  )
}