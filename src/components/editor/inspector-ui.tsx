import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

export function InspRoot({ children }: { children: ReactNode }) {
  return <div className="arc-insp">{children}</div>
}

export function InspSection({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={`arc-insp-section ${className}`.trim()}>{children}</section>
}

export function InspTitle({ children }: { children: ReactNode }) {
  return <h3 className="arc-insp-title">{children}</h3>
}

export function InspHint({ children }: { children: ReactNode }) {
  return <p className="arc-insp-hint">{children}</p>
}

export function InspMeta({ children }: { children: ReactNode }) {
  return <div className="arc-insp-meta">{children}</div>
}

export function InspSubsectionTitle({ children }: { children: ReactNode }) {
  return <div className="arc-insp-subsection-title">{children}</div>
}

export function InspLabel({
  children,
  htmlFor,
}: {
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <label className="arc-insp-label" htmlFor={htmlFor}>
      {children}
    </label>
  )
}

export function InspField({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`arc-insp-field ${className}`.trim()}>{children}</div>
}

export function InspInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="arc-insp-input" {...props} />
}

export function InspSelect({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className="arc-insp-select" {...props}>
      {children}
    </select>
  )
}

export function InspTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="arc-insp-textarea" {...props} />
}

export function InspDivider() {
  return <div className="arc-insp-divider" role="separator" />
}

export function InspBadge({ children }: { children: ReactNode }) {
  return <div className="arc-insp-badge">{children}</div>
}

export function InspLinkButton({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button type="button" className="arc-insp-link" onClick={onClick}>
      {children}
    </button>
  )
}

export function InspCheckbox({
  label,
  checked,
  onChange,
  id,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  id?: string
}) {
  const inputId = id ?? `insp-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <label className="arc-insp-check" htmlFor={inputId}>
      <input
        type="checkbox"
        id={inputId}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

export function InspRow({ children }: { children: ReactNode }) {
  return <div className="arc-insp-row">{children}</div>
}

export function InspGrid2({ children }: { children: ReactNode }) {
  return <div className="arc-insp-grid-2">{children}</div>
}

export function InspSegmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="arc-insp-segmented" role="group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`arc-insp-segment${value === opt.value ? ' is-active' : ''}`}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function InspRange({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  suffix?: string
}) {
  return (
    <InspField>
      <InspLabel>
        {label}
        {suffix ? `: ${value}${suffix}` : ''}
      </InspLabel>
      <InspInput
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
      />
    </InspField>
  )
}

export function InspIconButton({
  label,
  onClick,
  children,
  tone = 'default',
}: {
  label: string
  onClick: () => void
  children: ReactNode
  tone?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      className={`arc-insp-icon-btn${tone === 'danger' ? ' is-danger' : ''}`}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  )
}

export function InspAccordion({
  title,
  meta,
  expanded,
  onToggle,
  children,
  leading,
}: {
  title: string
  meta?: string
  expanded: boolean
  onToggle: () => void
  children: ReactNode
  leading?: ReactNode
}) {
  return (
    <div className={`arc-insp-accordion${expanded ? ' is-open' : ''}`}>
      <button type="button" className="arc-insp-accordion-trigger" onClick={onToggle}>
        <span className="arc-insp-accordion-chevron" aria-hidden="true">
          {expanded ? '▾' : '▸'}
        </span>
        {leading}
        <span className="arc-insp-accordion-title">{title}</span>
        {meta && <span className="arc-insp-accordion-meta">{meta}</span>}
      </button>
      {expanded && <div className="arc-insp-accordion-body">{children}</div>}
    </div>
  )
}