/**
 * Native Mermaid semantic document model.
 *
 * Sequence diagrams are first-class here — not projected through ArcDiagramData.
 */

export type MermaidFamily = 'flowchart' | 'sequence' | 'state'

export type MermaidDiagnosticSeverity = 'error' | 'warning' | 'unsupported'

export interface MermaidSourceRange {
  /** 1-based line number in the normalized source */
  startLine: number
  endLine: number
  startColumn?: number
  endColumn?: number
}

export interface MermaidDiagnostic {
  severity: MermaidDiagnosticSeverity
  code: string
  message: string
  /** Capability name for unsupported features (de-duplicated in consumers) */
  capability?: string
  range?: MermaidSourceRange
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export interface ArcMermaidDocumentBase {
  family: MermaidFamily
  /** Original declaration token, e.g. sequenceDiagram */
  declaration: string
}

// ---------------------------------------------------------------------------
// Sequence
// ---------------------------------------------------------------------------

export type SequenceParticipantKind = 'actor' | 'participant'

export interface SequenceParticipant {
  id: string
  label: string
  kind: SequenceParticipantKind
  /** Source order, 0-based */
  order: number
  range?: MermaidSourceRange
}

export type SequenceMessageLine = 'solid' | 'dashed'
export type SequenceArrowHead = 'filled' | 'open'

export interface SequenceMessageEvent {
  type: 'message'
  id: string
  from: string
  to: string
  /** Structured label lines (from <br> splits) */
  label: string[]
  line: SequenceMessageLine
  arrow: SequenceArrowHead
  /** Activation markers present on the arrow (+/-) are recorded but not yet rendered */
  activateTarget?: boolean
  deactivateTarget?: boolean
  order: number
  range?: MermaidSourceRange
}

export type SequenceNotePlacement = 'left' | 'right' | 'over'

export interface SequenceNoteEvent {
  type: 'note'
  id: string
  placement: SequenceNotePlacement
  /** One or more participant ids; range notes list [from, to] in source order */
  participants: string[]
  /** Structured text lines */
  text: string[]
  order: number
  range?: MermaidSourceRange
}

/** Supported fragment kinds for the first native slice */
export type SequenceFragmentKind = 'alt' | 'else' | 'opt' | 'loop' | 'par' | 'critical' | 'break' | 'rect'

export interface SequenceFragmentStartEvent {
  type: 'fragmentStart'
  id: string
  kind: SequenceFragmentKind
  /** Lane / branch label after the keyword */
  label?: string
  depth: number
  order: number
  range?: MermaidSourceRange
}

export interface SequenceFragmentElseEvent {
  type: 'fragmentElse'
  id: string
  /** Matches the opening fragment id */
  fragmentId: string
  label?: string
  depth: number
  order: number
  range?: MermaidSourceRange
}

export interface SequenceFragmentEndEvent {
  type: 'fragmentEnd'
  id: string
  fragmentId: string
  depth: number
  order: number
  range?: MermaidSourceRange
}

export type SequenceEvent =
  | SequenceMessageEvent
  | SequenceNoteEvent
  | SequenceFragmentStartEvent
  | SequenceFragmentElseEvent
  | SequenceFragmentEndEvent

export interface ArcSequenceDocument extends ArcMermaidDocumentBase {
  family: 'sequence'
  participants: SequenceParticipant[]
  events: SequenceEvent[]
}

// ---------------------------------------------------------------------------
// Flowchart / state stubs (typed shell until native renderers land)
// ---------------------------------------------------------------------------

export interface ArcFlowchartDocument extends ArcMermaidDocumentBase {
  family: 'flowchart'
  /** Raw declaration body retained; architecture projection via importMermaid() */
  raw: string
}

export interface ArcStateDocument extends ArcMermaidDocumentBase {
  family: 'state'
  raw: string
}

export type ArcMermaidDocument =
  | ArcFlowchartDocument
  | ArcSequenceDocument
  | ArcStateDocument

export interface ArcMermaidParseResult {
  document: ArcMermaidDocument | null
  diagnostics: MermaidDiagnostic[]
  /** Normalized source (LF line endings) retained for editing */
  source: string
}

// ---------------------------------------------------------------------------
// Renderer registry + component props
// ---------------------------------------------------------------------------

export interface ArcMermaidProps {
  source?: string
  document?: ArcMermaidDocument
  mode?: 'light' | 'dark'
  theme?: import('../themes').ThemeId
  interactive?: boolean
  className?: string
  title?: string
  description?: string
  /** Sequence-only presentation overrides */
  sequence?: import('./sequence/types').SequencePresentationOptions
}
