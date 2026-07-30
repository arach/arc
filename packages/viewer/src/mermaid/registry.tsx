/**
 * Family → renderer registry.
 * Adding a Mermaid family registers here; UI code must not grow type conditionals.
 */

import type { ComponentType } from 'react'
import type { MermaidFamily, ArcMermaidDocument } from './types'
import type { ThemeId } from '../themes'
import type { SequencePresentationOptions } from './sequence/types'
import { SequenceRenderer } from './sequence/SequenceRenderer'

export interface MermaidRendererProps {
  document: ArcMermaidDocument
  mode?: 'light' | 'dark'
  theme?: ThemeId
  interactive?: boolean
  className?: string
  title?: string
  description?: string
  sequence?: SequencePresentationOptions
}

export type MermaidFamilyRenderer = ComponentType<MermaidRendererProps>

function SequenceFamilyRenderer({
  document,
  mode,
  theme,
  interactive,
  className,
  title,
  description,
  sequence,
}: MermaidRendererProps) {
  if (document.family !== 'sequence') return null
  return (
    <SequenceRenderer
      document={document}
      mode={mode}
      theme={theme}
      interactive={interactive}
      className={className}
      title={title}
      description={description}
      presentation={sequence}
    />
  )
}

function PendingFamilyRenderer({ document, className }: MermaidRendererProps) {
  return (
    <div
      className={className}
      data-arc-mermaid-family={document.family}
      style={{
        padding: 16,
        borderRadius: 12,
        border: '1px dashed #a1a1aa',
        color: '#52525b',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: 13,
      }}
    >
      Native <strong>{document.family}</strong> renderer is not registered yet.
      Use <code>importMermaid()</code> for an architecture projection.
    </div>
  )
}

const registry = new Map<MermaidFamily, MermaidFamilyRenderer>([
  ['sequence', SequenceFamilyRenderer],
  ['flowchart', PendingFamilyRenderer],
  ['state', PendingFamilyRenderer],
])

export function registerMermaidRenderer(
  family: MermaidFamily,
  renderer: MermaidFamilyRenderer,
): void {
  registry.set(family, renderer)
}

export function getMermaidRenderer(
  family: MermaidFamily,
): MermaidFamilyRenderer | undefined {
  return registry.get(family)
}

export function listMermaidRenderers(): MermaidFamily[] {
  return [...registry.keys()]
}

