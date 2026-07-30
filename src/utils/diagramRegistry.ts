// @ts-nocheck
const REGISTRY_STORAGE_KEY = 'arc-diagram-registry'

export interface DiagramReferenceSource {
  kind: 'file' | 'src'
  value: string
}

export interface DiagramReferenceEntry {
  id: string
  source: DiagramReferenceSource
  updatedAt: number
}

type DiagramReferenceRegistry = Record<string, DiagramReferenceEntry>

function readRegistry(): DiagramReferenceRegistry {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as DiagramReferenceRegistry
  } catch (error) {
    console.warn('Failed to read diagram registry:', error)
    return {}
  }
}

function writeRegistry(registry: DiagramReferenceRegistry) {
  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry))
  } catch (error) {
    console.warn('Failed to write diagram registry:', error)
  }
}

function sameSource(a: DiagramReferenceSource, b: DiagramReferenceSource) {
  return a.kind === b.kind && a.value === b.value
}

export function registerDiagramReference(id: string, source: DiagramReferenceSource) {
  const registry = readRegistry()
  const existing = registry[id]

  if (existing && !sameSource(existing.source, source)) {
    throw new Error(
      `Diagram ID "${id}" is already registered to ${existing.source.kind}:${existing.source.value}. ` +
      `Use a different id or reopen the existing source.`,
    )
  }

  const entry: DiagramReferenceEntry = {
    id,
    source,
    updatedAt: Date.now(),
  }

  registry[id] = entry
  writeRegistry(registry)
  return entry
}

export function getDiagramReference(id: string) {
  return readRegistry()[id] || null
}

export function listDiagramReferences() {
  return Object.values(readRegistry()).sort((a, b) => b.updatedAt - a.updatedAt)
}

