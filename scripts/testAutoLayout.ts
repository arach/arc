import { describe, expect, test } from 'bun:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ArcDiagram from '../src/components/ArcDiagram'
import type { ArcDiagramData } from '../src/types/diagram'
import { autoLayout, createAutoLayout } from '../src/utils/autoLayout'

const groupedDiagram: ArcDiagramData = {
  id: 'group-layout-test',
  layout: { width: 720, height: 420 },
  groups: [
    {
      id: 'runtime',
      x: 100,
      y: 80,
      width: 500,
      height: 260,
      type: 'rect',
      color: 'violet',
      label: 'Runtime',
    },
  ],
  layoutHints: {
    nodes: {
      api: { group: 'runtime' },
      worker: { group: 'runtime' },
    },
    groups: {
      runtime: { direction: 'horizontal', padding: 20 },
    },
  },
  nodes: {
    api: { x: 0, y: 0, size: 'm' },
    worker: { x: 0, y: 0, size: 'm' },
    external: { x: 5, y: 6, size: 's' },
  },
  nodeData: {
    api: { icon: 'Server', name: 'API', color: 'violet' },
    worker: { icon: 'Cpu', name: 'Worker', color: 'blue' },
    external: { icon: 'Cloud', name: 'External', color: 'zinc' },
  },
  connectors: [
    { from: 'api', to: 'worker', fromAnchor: 'bottom', toAnchor: 'top', style: 'call' },
  ],
  connectorStyles: {
    call: { color: 'violet', strokeWidth: 2 },
  },
}

describe('declarative group layout', () => {
  test('places grouped nodes inside their frame and preserves ungrouped positions', () => {
    const result = autoLayout(groupedDiagram)

    expect(result.nodes.external).toEqual(groupedDiagram.nodes.external)
    expect(result.nodes.api.x).toBeGreaterThanOrEqual(120)
    expect(result.nodes.api.y).toBeGreaterThanOrEqual(122)
    expect(result.nodes.worker.x + 160).toBeLessThanOrEqual(580)
    expect(result.nodes.worker.y + 75).toBeLessThanOrEqual(320)
    expect(result.nodes.api.x).toBeLessThan(result.nodes.worker.x)
    expect(result.connectors[0]).toMatchObject({ fromAnchor: 'right', toAnchor: 'left' })
  })

  test('honors explicit layer and order hints deterministically', () => {
    const result = autoLayout({
      ...groupedDiagram,
      layoutHints: {
        nodes: {
          api: { group: 'runtime', layer: 0, order: 2 },
          worker: { group: 'runtime', layer: 0, order: 1 },
        },
        groups: {
          runtime: { direction: 'vertical', align: 'start', justify: 'start' },
        },
      },
    })

    expect(result.nodes.worker.x).toBeLessThan(result.nodes.api.x)
    expect(result.nodes.worker.y).toBe(result.nodes.api.y)
  })

  test('carries group metadata through minimal auto-layout input', () => {
    const result = createAutoLayout({
      groups: groupedDiagram.groups,
      layoutHints: groupedDiagram.layoutHints,
      nodeData: groupedDiagram.nodeData,
      connectors: groupedDiagram.connectors,
      connectorStyles: groupedDiagram.connectorStyles,
    })

    expect(result.groups).toEqual(groupedDiagram.groups)
    expect(result.layoutHints).toEqual(groupedDiagram.layoutHints)
  })

  test('renders group boundaries in the public player', () => {
    const markup = renderToStaticMarkup(createElement(ArcDiagram, {
      data: groupedDiagram,
      interactive: false,
      mode: 'light',
      showArcToggle: false,
    }))

    expect(markup).toContain('Runtime')
    expect(markup).toContain('stroke-opacity="0.55"')
  })
})
