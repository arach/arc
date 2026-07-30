/**
 * parseMermaid — native Mermaid → typed ArcMermaidDocument
 */

import type {
  ArcMermaidDocument,
  ArcMermaidParseResult,
  MermaidDiagnostic,
} from './types'
import { parseSequenceSource } from './sequence/parseSequence'

function normalizeSource(source: string): string {
  return source.replace(/\r\n?/g, '\n')
}

function findDeclaration(lines: string[]): number {
  return lines.findIndex((line) => {
    const trimmed = line.trim()
    return trimmed.length > 0 && !trimmed.startsWith('%%')
  })
}

/**
 * Parse Mermaid source into a typed native document.
 * Does not project into ArcDiagramData.
 */
export function parseMermaid(source: string): ArcMermaidParseResult {
  const normalized = normalizeSource(source)
  const lines = normalized.split('\n')
  const declarationIndex = findDeclaration(lines)

  if (declarationIndex === -1) {
    return {
      document: null,
      diagnostics: [
        {
          severity: 'error',
          code: 'no-declaration',
          message: 'Mermaid source does not contain a diagram declaration',
        },
      ],
      source: normalized,
    }
  }

  const body = lines.slice(declarationIndex).join('\n').trim()
  const firstLine = body.split('\n')[0].trim()
  const baseLine = declarationIndex + 1
  const diagnostics: MermaidDiagnostic[] = []

  if (/^sequenceDiagram\b/i.test(firstLine)) {
    const result = parseSequenceSource(body, baseLine)
    return {
      document: result.document,
      diagnostics: result.diagnostics,
      source: normalized,
    }
  }

  if (/^flowchart\b/i.test(firstLine) || /^graph\b/i.test(firstLine)) {
    const document: ArcMermaidDocument = {
      family: 'flowchart',
      declaration: firstLine.split(/\s/)[0],
      raw: body,
    }
    diagnostics.push({
      severity: 'unsupported',
      code: 'native-renderer-pending',
      message:
        'Flowchart native renderer is not yet available; use importMermaid() for architecture projection',
      capability: 'flowchart-native-renderer',
    })
    return { document, diagnostics, source: normalized }
  }

  if (/^stateDiagram-v2\b/i.test(firstLine) || /^stateDiagram\b/i.test(firstLine)) {
    const document: ArcMermaidDocument = {
      family: 'state',
      declaration: firstLine.split(/\s/)[0],
      raw: body,
    }
    diagnostics.push({
      severity: 'unsupported',
      code: 'native-renderer-pending',
      message:
        'State diagram native renderer is not yet available; use importMermaid() for architecture projection',
      capability: 'state-native-renderer',
    })
    return { document, diagnostics, source: normalized }
  }

  return {
    document: null,
    diagnostics: [
      {
        severity: 'error',
        code: 'unrecognized-type',
        message: `Unrecognized diagram type: "${firstLine}"`,
        capability: firstLine.split(/\s/)[0],
      },
    ],
    source: normalized,
  }
}
