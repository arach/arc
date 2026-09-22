import { randomBytes } from 'node:crypto'
import type { ArcDiagramData } from '../src/types/diagram.ts'

export interface EditorHandoff {
  sessionId: string
  editorUrl: string
  playerUrl: string
  showcaseUrl: string
}

export function editorBaseUrl(env: Record<string, string | undefined> = process.env): string {
  return (env.ARC_EDITOR_URL || 'http://localhost:5188').replace(/\/+$/, '')
}

export function encodeHashData(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')
}

export function generateSessionId(): string {
  return randomBytes(4).toString('hex')
}

export function buildEditorHandoff(
  diagram: ArcDiagramData,
  options: { sessionId?: string; baseUrl?: string; theme?: string; mode?: 'light' | 'dark'; view?: string } = {},
): EditorHandoff {
  const sessionId = options.sessionId ?? generateSessionId()
  const origin = (options.baseUrl ?? editorBaseUrl()).replace(/\/+$/, '')
  const payload = {
    ...diagram,
    ...(options.theme ? { _theme: options.theme } : {}),
    ...(options.mode ? { _mode: options.mode } : {}),
  }
  return {
    sessionId,
    editorUrl: `${origin}/editor/${sessionId}#data=${encodeHashData(payload)}`,
    playerUrl: `${origin}/player/${sessionId}${options.view ? `?view=${encodeURIComponent(options.view)}` : ''}`,
    showcaseUrl: `${origin}/showcase`,
  }
}
