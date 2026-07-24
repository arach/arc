import type { SVGProps } from 'react'

type ArcMarkProps = SVGProps<SVGSVGElement> & {
  title?: string
}

/**
 * Arc's identity mark: a routed curve between two explicit system endpoints.
 * The corner ticks borrow the editor's registration-guide language without
 * turning the mark into a literal diagram node.
 */
export default function ArcMark({ title, className = '', ...props }: ArcMarkProps) {
  const isDecorative = !title

  return (
    <svg
      className={`arc-mark ${className}`.trim()}
      viewBox="0 0 32 32"
      fill="none"
      role={isDecorative ? undefined : 'img'}
      aria-hidden={isDecorative ? true : undefined}
      aria-label={title}
      {...props}
    >
      <path className="arc-mark__guide" d="M4 10V4h6M22 4h6v6M28 22v6h-6M10 28H4v-6" />
      <path className="arc-mark__route" d="M7 24C7 14.6 14.6 7 24 7" />
      <path className="arc-mark__axis" d="M7 18v6h6M18 7h6v6" />
      <rect className="arc-mark__origin" x="4.5" y="21.5" width="5" height="5" />
      <rect className="arc-mark__terminal" x="21.5" y="4.5" width="5" height="5" />
    </svg>
  )
}
