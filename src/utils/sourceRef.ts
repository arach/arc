// Source evidence links: resolve a node's `source` ref into a display label
// or a clickable URL. `sourceUrl` stays transport-agnostic — give it a
// `repo` ('owner/name') and it produces a GitHub blob link pinned at `ref` ??
// `source.commit` ?? 'HEAD'; without one it returns a relative `path#L<line>`
// fragment suitable for local tooling.

import type { DiagramSource } from '../types/diagram'

function lineFragment(source: DiagramSource): string {
  if (!source.line) return ''
  return `#L${source.line}${source.endLine ? `-L${source.endLine}` : ''}`
}

/** `src/auth/session.ts:12-20` — compact label for tooltips and lists. */
export function sourceLabel(source: DiagramSource): string {
  return `${source.path}${lineFragment(source).replace('#L', ':').replace('-L', '-')}`.replace(/:$/, '')
}

/** Resolve a source ref to a URL. */
export function sourceUrl(source: DiagramSource, opts?: { repo?: string; ref?: string }): string {
  const cleanPath = source.path.replace(/^\/+/, '')
  if (!opts?.repo) return `${cleanPath}${lineFragment(source)}`
  const ref = opts.ref ?? source.commit ?? 'HEAD'
  const repo = opts.repo.replace(/\.git$/, '').replace(/^https?:\/\/github\.com\//, '').replace(/^\/+|\/+$/g, '')
  return `https://github.com/${repo}/blob/${ref}/${cleanPath}${lineFragment(source)}`
}
