// @ts-nocheck
// LocalStorage-based diagram session persistence
// Enables URL-based session recovery: /editor/:sessionId

const STORAGE_PREFIX = 'arc-session-'

export interface DiagramSession {
  diagram: any
  themeId: string | null
  colorMode: 'light' | 'dark'
  diagramMeta: Record<string, any>
  updatedAt: number
  name?: string
  originalDiagram?: any  // Pre-offset original data for player rendering
}

/** Generate a short session ID (first 8 hex chars of a UUID for brevity in URLs) */
export function generateSessionId(): string {
  return crypto.randomUUID().slice(0, 8)
}

/** Derive a URL-safe session ID from a diagram's source path or ID */
export function deriveSessionId(source: string): string {
  // e.g. "OPERATE.CONTROL.001" → "operate-control-001"
  // e.g. "operate/control-plane" → "operate-control-plane"
  return source
    .toLowerCase()
    .replace(/[./]/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Save a diagram session to localStorage */
export function saveDiagramSession(id: string, data: Omit<DiagramSession, 'updatedAt'>): void {
  const session: DiagramSession = {
    ...data,
    updatedAt: Date.now(),
  }
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify(session))
  } catch (e) {
    console.warn('Failed to save diagram session:', e)
  }
}

/** Load a diagram session from localStorage */
export function loadDiagramSession(id: string): DiagramSession | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.warn('Failed to load diagram session:', e)
    return null
  }
}

/** List all saved diagram sessions, sorted by most recent */
export function listDiagramSessions(): Array<{ id: string; name?: string; updatedAt: number }> {
  const sessions: Array<{ id: string; name?: string; updatedAt: number }> = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(STORAGE_PREFIX)) continue
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const session = JSON.parse(raw) as DiagramSession
      sessions.push({
        id: key.slice(STORAGE_PREFIX.length),
        name: session.name,
        updatedAt: session.updatedAt,
      })
    } catch {
      // skip corrupt entries
    }
  }
  return sessions.sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Delete a diagram session */
export function deleteDiagramSession(id: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${id}`)
}
