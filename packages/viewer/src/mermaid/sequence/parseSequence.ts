/**
 * Native sequenceDiagram parser → ArcSequenceDocument
 */

import type {
  ArcSequenceDocument,
  MermaidDiagnostic,
  MermaidSourceRange,
  SequenceEvent,
  SequenceFragmentKind,
  SequenceParticipant,
  SequenceParticipantKind,
} from '../types'

const SUPPORTED_FRAGMENTS = new Set<string>([
  'alt',
  'else',
  'opt',
  'loop',
  'par',
  'critical',
  'break',
  'rect',
])

/** Fully unsupported constructs — recorded, body not silently dropped when we can detect end */
const UNSUPPORTED_LINE_START =
  /^(activate|deactivate|autonumber|box|create|destroy)\b/i

function range(line: number): MermaidSourceRange {
  return { startLine: line, endLine: line }
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function splitStructuredText(raw: string): string[] {
  return raw
    .split(/<br\s*\/?\s*>/gi)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

function stripQuotes(s: string): string {
  const t = s.trim()
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1)
  }
  return t
}

export interface ParseSequenceResult {
  document: ArcSequenceDocument
  diagnostics: MermaidDiagnostic[]
}

/**
 * Parse a sequenceDiagram body (including the declaration line).
 * `baseLine` is the 1-based line number of the declaration in the full source.
 */
export function parseSequenceSource(
  source: string,
  baseLine = 1,
): ParseSequenceResult {
  const diagnostics: MermaidDiagnostic[] = []
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const declaration = lines[0]?.trim() || 'sequenceDiagram'

  const participants: SequenceParticipant[] = []
  const participantIndex = new Map<string, number>() // raw id → index
  const events: SequenceEvent[] = []
  let order = 0
  let eventSeq = 0
  let fragmentSeq = 0

  type FragFrame = { id: string; kind: SequenceFragmentKind; depth: number }
  const fragStack: FragFrame[] = []

  const ensureParticipant = (
    rawId: string,
    label: string | undefined,
    kind: SequenceParticipantKind,
    lineNo: number,
  ): string => {
    const existingIndex = participantIndex.get(rawId)
    if (existingIndex !== undefined) {
      const existing = participants[existingIndex]
      if (
        label &&
        existing &&
        (existing.label === rawId || existing.label === existing.id)
      ) {
        existing.label = label
      }
      if (existing && kind === 'actor') existing.kind = 'actor'
      return existing?.id ?? sanitizeId(rawId)
    }

    const baseId = sanitizeId(rawId) || `participant_${participants.length + 1}`
    let id = baseId
    if (participants.some((p) => p.id === baseId)) {
      diagnostics.push({
        severity: 'error',
        code: 'id-collision',
        message: `Participant id collision after sanitization: "${rawId}" → "${baseId}"`,
        range: range(lineNo),
      })
      let suffix = 2
      while (participants.some((p) => p.id === `${baseId}_${suffix}`)) {
        suffix += 1
      }
      id = `${baseId}_${suffix}`
    }
    const p: SequenceParticipant = {
      id,
      label: label ?? rawId,
      kind,
      order: participants.length,
      range: range(lineNo),
    }
    participantIndex.set(rawId, participants.length)
    participants.push(p)
    return id
  }

  // Skip declaration line
  for (let i = 1; i < lines.length; i++) {
    const lineNo = baseLine + i
    const rawLine = lines[i]
    const line = rawLine.trim()
    if (!line || line.startsWith('%%')) continue

    // participant / actor
    const pMatch = line.match(
      /^(participant|actor)\s+(\S+)(?:\s+as\s+(.+))?$/i,
    )
    if (pMatch) {
      const kind = pMatch[1].toLowerCase() as SequenceParticipantKind
      const rawId = pMatch[2]
      const alias = pMatch[3] ? stripQuotes(pMatch[3]) : undefined
      ensureParticipant(rawId, alias, kind, lineNo)
      continue
    }

    // Notes: Note left of X: text | Note right of X: text | Note over A,B: text
    const noteMatch = line.match(
      /^Note\s+(left of|right of|over)\s+([^:]+)\s*:\s*(.+)$/i,
    )
    if (noteMatch) {
      const placementRaw = noteMatch[1].toLowerCase()
      const placement =
        placementRaw === 'left of'
          ? 'left'
          : placementRaw === 'right of'
            ? 'right'
            : 'over'
      const targetRaw = noteMatch[2].trim()
      const text = splitStructuredText(noteMatch[3])
      const targetIds = targetRaw.split(/\s*,\s*/).map((t) => {
        const cleaned = stripQuotes(t.trim())
        return ensureParticipant(cleaned, undefined, 'participant', lineNo)
      })
      events.push({
        type: 'note',
        id: `note-${++eventSeq}`,
        placement,
        participants: targetIds,
        text: text.length ? text : [noteMatch[3].trim()],
        order: order++,
        range: range(lineNo),
      })
      continue
    }

    // Messages — arrows: ->>, -->>, ->, -->, -), --), ->>+, etc.
    // Order matters: longer dashed forms first
    const msgMatch = line.match(
      /^(\S+?)\s*(-->>|->>|-->|->|--\)|-\)|--x|-x)\s*([+-])?\s*(\S+?)\s*:\s*(.+)$/,
    )
    if (msgMatch) {
      const fromRaw = msgMatch[1]
      const arrowTok = msgMatch[2]
      const actMark = msgMatch[3]
      const toRaw = msgMatch[4]
      const labelRaw = msgMatch[5]
      const from = ensureParticipant(fromRaw, undefined, 'participant', lineNo)
      const to = ensureParticipant(toRaw, undefined, 'participant', lineNo)
      const dashed = arrowTok.startsWith('--')
      const open = arrowTok.endsWith(')') || arrowTok.endsWith('x')
      events.push({
        type: 'message',
        id: `msg-${++eventSeq}`,
        from,
        to,
        label: splitStructuredText(labelRaw).length
          ? splitStructuredText(labelRaw)
          : [labelRaw.trim()],
        line: dashed ? 'dashed' : 'solid',
        arrow: open ? 'open' : 'filled',
        activateTarget: actMark === '+',
        deactivateTarget: actMark === '-',
        order: order++,
        range: range(lineNo),
      })
      continue
    }

    // Fragment keywords
    const fragMatch = line.match(
      /^(alt|else|opt|loop|par|critical|break|rect)(?:\s+(.*))?$/i,
    )
    if (fragMatch) {
      const keyword = fragMatch[1].toLowerCase()
      const label = fragMatch[2]?.trim() || undefined

      if (keyword === 'else') {
        const parent = fragStack[fragStack.length - 1]
        if (!parent) {
          diagnostics.push({
            severity: 'error',
            code: 'orphan-else',
            message: '`else` without matching fragment',
            range: range(lineNo),
          })
          continue
        }
        events.push({
          type: 'fragmentElse',
          id: `frag-else-${++fragmentSeq}`,
          fragmentId: parent.id,
          label,
          depth: parent.depth,
          order: order++,
          range: range(lineNo),
        })
        continue
      }

      const kind = keyword as SequenceFragmentKind
      if (!SUPPORTED_FRAGMENTS.has(keyword)) {
        diagnostics.push({
          severity: 'unsupported',
          code: 'unsupported-fragment',
          message: `Fragment kind "${keyword}" is not rendered yet`,
          capability: keyword,
          range: range(lineNo),
        })
      }

      // First slice fully models alt (and else/end). Other kinds are recorded
      // in the tree so bodies are not dropped, with an unsupported diagnostic
      // when they are not alt.
      if (kind !== 'alt' && kind !== 'opt' && kind !== 'loop') {
        diagnostics.push({
          severity: 'unsupported',
          code: 'partial-fragment',
          message: `Fragment "${kind}" is parsed but has limited visual treatment`,
          capability: kind,
          range: range(lineNo),
        })
      }

      const id = `frag-${++fragmentSeq}`
      const depth = fragStack.length
      fragStack.push({ id, kind, depth })
      events.push({
        type: 'fragmentStart',
        id,
        kind,
        label,
        depth,
        order: order++,
        range: range(lineNo),
      })
      continue
    }

    if (/^end$/i.test(line)) {
      const frame = fragStack.pop()
      if (!frame) {
        diagnostics.push({
          severity: 'warning',
          code: 'orphan-end',
          message: '`end` without matching fragment',
          range: range(lineNo),
        })
        continue
      }
      events.push({
        type: 'fragmentEnd',
        id: `frag-end-${++fragmentSeq}`,
        fragmentId: frame.id,
        depth: frame.depth,
        order: order++,
        range: range(lineNo),
      })
      continue
    }

    if (UNSUPPORTED_LINE_START.test(line)) {
      const cap = line.split(/\s/)[0].toLowerCase()
      diagnostics.push({
        severity: 'unsupported',
        code: 'unsupported-construct',
        message: `Unsupported sequence construct: ${cap}`,
        capability: cap,
        range: range(lineNo),
      })
      continue
    }

    diagnostics.push({
      severity: 'warning',
      code: 'unrecognized-line',
      message: `Skipped unrecognized line: "${line.substring(0, 80)}"`,
      range: range(lineNo),
    })
  }

  while (fragStack.length) {
    const frame = fragStack.pop()!
    diagnostics.push({
      severity: 'error',
      code: 'unclosed-fragment',
      message: `Unclosed fragment "${frame.kind}" (${frame.id})`,
    })
  }

  return {
    document: {
      family: 'sequence',
      declaration,
      participants,
      events,
    },
    diagnostics,
  }
}
