import { describe, expect, test } from 'bun:test'
import {
  NODE_KINDS,
  NODE_KIND_DEFAULTS,
  isNodeKind,
  resolveNodeColor,
  resolveNodeIcon,
  suggestKind,
} from '../src/utils/nodeKinds'

describe('node kinds', () => {
  test('every kind has a default icon and palette color', () => {
    for (const kind of NODE_KINDS) {
      expect(NODE_KIND_DEFAULTS[kind].icon).toBeTruthy()
      expect(NODE_KIND_DEFAULTS[kind].color).toBeTruthy()
    }
  })

  test('isNodeKind', () => {
    expect(isNodeKind('database')).toBe(true)
    expect(isNodeKind('databse')).toBe(false)
    expect(isNodeKind(42)).toBe(false)
    expect(isNodeKind(undefined)).toBe(false)
  })

  test('explicit fields win over kind defaults', () => {
    expect(resolveNodeColor({ kind: 'database', color: 'rose' })).toBe('rose')
    expect(resolveNodeIcon({ kind: 'database', icon: 'Shield' })).toBe('Shield')
  })

  test('kind supplies defaults', () => {
    expect(resolveNodeColor({ kind: 'gateway' })).toBe('sky')
    expect(resolveNodeIcon({ kind: 'gateway' })).toBe('Globe')
  })

  test('fallbacks keep old behavior', () => {
    expect(resolveNodeColor({})).toBe('zinc')
    expect(resolveNodeIcon({})).toBe('Box')
    expect(resolveNodeColor(undefined)).toBe('zinc')
    expect(resolveNodeIcon(undefined)).toBe('Box')
  })

  test('suggestKind reads names, never guesses', () => {
    expect(suggestKind('Postgres Primary')).toBe('database')
    expect(suggestKind('React SPA')).toBe('frontend')
    expect(suggestKind('Kafka Topic')).toBe('queue')
    expect(suggestKind('Widget Co.')).toBeUndefined()
  })
})
