import { describe, expect, test } from 'bun:test'
import { resolveFocusState } from '../src/components/ArcDiagram'
import { toExportFormat, type ArcDiagram } from '../src/types/diagram'

const connectors = [
  { from: 'browser', to: 'api', fromAnchor: 'right' as const, toAnchor: 'left' as const, style: 'http' },
  { from: 'api', to: 'queue', fromAnchor: 'right' as const, toAnchor: 'left' as const, style: 'publish' },
  { from: 'queue', to: 'worker', fromAnchor: 'right' as const, toAnchor: 'left' as const, style: 'consume' },
]

describe('declarative focus stories', () => {
  test('preserves the existing node focus behavior without a story', () => {
    const result = resolveFocusState('api', connectors)

    expect([...result.nodeIds]).toEqual(['api'])
    expect([...result.connectorIndexes]).toEqual([0, 1])
  })

  test('appends direct neighbors when a story extends the focus', () => {
    const result = resolveFocusState('api', connectors, {
      api: { nodes: ['worker'] },
    })

    expect([...result.nodeIds]).toEqual(['api', 'browser', 'queue', 'worker'])
    expect([...result.connectorIndexes]).toEqual([0, 1])
  })

  test('can replace direct neighbors with an explicit directed path', () => {
    const result = resolveFocusState('browser', connectors, {
      browser: {
        mode: 'replace',
        nodes: ['worker'],
        connectors: [{ from: 'api', to: 'queue' }],
      },
    })

    expect([...result.nodeIds]).toEqual(['browser', 'worker', 'api', 'queue'])
    expect([...result.connectorIndexes]).toEqual([1])
  })

  test('preserves focus stories in exported diagram data', () => {
    const diagram: ArcDiagram = {
      layout: { width: 600, height: 320 },
      grid: { enabled: true, size: 24, color: '#ddd', opacity: 0.4, type: 'dots' },
      nodes: {},
      nodeData: {},
      connectors: [],
      connectorStyles: {},
      focusTargets: {
        api: {
          caption: 'Requests are accepted before work is queued.',
          steps: [{ icon: 'Server', label: 'Accept request' }],
        },
      },
    }

    expect(toExportFormat(diagram).focusTargets).toEqual(diagram.focusTargets)
  })
})
