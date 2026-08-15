// Does this payload look like an Arc diagram?
//
// Used wherever a document arrives from outside the editor — an opened file,
// text typed into the markup pane. The canvas reads `layout.width` and iterates
// `nodes` without guarding, so a plain object that happens to be JSON takes the
// whole view down; catching it here turns a crash into a sentence.

/** Human-readable reason this is not a diagram, or null if it is. */
export function validateDiagramShape(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Expected an object'

  const d = value as Record<string, unknown>

  const layout = d.layout as Record<string, unknown> | undefined
  if (!layout || typeof layout !== 'object') return 'Missing `layout`'
  if (typeof layout.width !== 'number' || typeof layout.height !== 'number') {
    return '`layout` needs numeric `width` and `height`'
  }

  if (!d.nodes || typeof d.nodes !== 'object' || Array.isArray(d.nodes)) return 'Missing `nodes`'
  if (!d.nodeData || typeof d.nodeData !== 'object' || Array.isArray(d.nodeData)) return 'Missing `nodeData`'

  if (d.connectors != null && !Array.isArray(d.connectors)) return '`connectors` must be an array'
  if (d.groups != null && !Array.isArray(d.groups)) return '`groups` must be an array'
  if (d.images != null && !Array.isArray(d.images)) return '`images` must be an array'

  // A node with no matching nodeData entry renders as an unlabelled box, which
  // reads as a bug rather than as an edit in progress.
  const nodes = d.nodes as Record<string, unknown>
  const nodeData = d.nodeData as Record<string, unknown>
  const orphan = Object.keys(nodes).find(
    id => !Object.prototype.hasOwnProperty.call(nodeData, id),
  )
  if (orphan) return `\`nodeData\` has no entry for "${orphan}"`

  return null
}

export function isDiagramShape(value: unknown): boolean {
  return validateDiagramShape(value) === null
}
