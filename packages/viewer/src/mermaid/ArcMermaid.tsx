/**
 * <ArcMermaid /> — family-aware Mermaid renderer via registry.
 */

import { useMemo } from 'react'
import type { ArcMermaidProps } from './types'
import { parseMermaid } from './parseMermaid'
import { getMermaidRenderer } from './registry'

export function ArcMermaid({
  source,
  document: documentProp,
  mode = 'light',
  theme = 'default',
  interactive = true,
  className = '',
  title,
  description,
  sequence,
}: ArcMermaidProps) {
  const parsed = useMemo(() => {
    if (documentProp) {
      return {
        document: documentProp,
        diagnostics: [] as ReturnType<typeof parseMermaid>['diagnostics'],
        source: source ?? '',
      }
    }
    if (source != null) return parseMermaid(source)
    return {
      document: null,
      diagnostics: [
        {
          severity: 'error' as const,
          code: 'no-input',
          message: 'ArcMermaid requires source or document',
        },
      ],
      source: '',
    }
  }, [source, documentProp])

  const { document, diagnostics } = parsed

  if (!document) {
    return (
      <div
        className={className}
        role="alert"
        style={{
          padding: 16,
          borderRadius: 12,
          border: '1px solid #fca5a5',
          background: '#fef2f2',
          color: '#991b1b',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: 13,
        }}
      >
        {diagnostics.map((d, i) => (
          <div key={i}>{d.message}</div>
        ))}
      </div>
    )
  }

  const Renderer = getMermaidRenderer(document.family)
  if (!Renderer) {
    return (
      <div className={className} role="alert">
        No renderer registered for family “{document.family}”.
      </div>
    )
  }

  return (
    <Renderer
      document={document}
      mode={mode}
      theme={theme}
      interactive={interactive}
      className={className}
      title={title}
      description={description}
      sequence={sequence}
    />
  )
}

export default ArcMermaid
