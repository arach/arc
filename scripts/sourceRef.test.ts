import { describe, expect, test } from 'bun:test'
import { sourceLabel, sourceUrl } from '../src/utils/sourceRef'

describe('sourceLabel', () => {
  test('plain path and line ranges', () => {
    expect(sourceLabel({ path: 'src/foo.ts' })).toBe('src/foo.ts')
    expect(sourceLabel({ path: 'src/foo.ts', line: 12 })).toBe('src/foo.ts:12')
    expect(sourceLabel({ path: 'src/foo.ts', line: 12, endLine: 20 })).toBe('src/foo.ts:12-20')
  })
})

describe('sourceUrl', () => {
  test('relative form without a repo', () => {
    expect(sourceUrl({ path: 'src/foo.ts' })).toBe('src/foo.ts')
    expect(sourceUrl({ path: 'src/foo.ts', line: 12 })).toBe('src/foo.ts#L12')
    expect(sourceUrl({ path: 'src/foo.ts', line: 12, endLine: 20 })).toBe('src/foo.ts#L12-L20')
  })

  test('GitHub blob link pinned to the recorded commit', () => {
    const source = { path: 'src/foo.ts', line: 12, commit: 'abc123' }
    expect(sourceUrl(source, { repo: 'arach/arc' }))
      .toBe('https://github.com/arach/arc/blob/abc123/src/foo.ts#L12')
    expect(sourceUrl(source, { repo: 'arach/arc', ref: 'main' }))
      .toBe('https://github.com/arach/arc/blob/main/src/foo.ts#L12')
  })

  test('repo normalization and leading-slash paths', () => {
    expect(sourceUrl({ path: '/src/foo.ts' }, { repo: 'https://github.com/arach/arc.git' }))
      .toBe('https://github.com/arach/arc/blob/HEAD/src/foo.ts')
    expect(sourceUrl({ path: 'src/foo.ts' }, { repo: 'arach/arc/' }))
      .toBe('https://github.com/arach/arc/blob/HEAD/src/foo.ts')
  })
})
