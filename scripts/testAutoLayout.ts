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
    expect(result.nodes.external).not.toMatchObject({ x: 0, y: 0 })
    expect(new Set(Object.values(result.nodes).map(node => `${node.x},${node.y}`)).size).toBe(3)
  })

  test('expands undersized groups so every member remains inside the frame', () => {
    const result = autoLayout({
      ...groupedDiagram,
      layout: { width: 260, height: 180 },
      groups: [{
        ...groupedDiagram.groups![0],
        x: 10,
        y: 10,
        width: 180,
        height: 100,
      }],
      layoutHints: {
        nodes: {
          api: { group: 'runtime', layer: 0 },
          worker: { group: 'runtime', layer: 1 },
          external: { group: 'runtime', layer: 2 },
        },
        groups: {
          runtime: { direction: 'horizontal', padding: 20, layerGap: 28 },
        },
      },
    })

    const group = result.groups![0]
    expect(group.width).toBeGreaterThan(180)
    expect(group.height).toBeGreaterThanOrEqual(100)
    for (const node of Object.values(result.nodes)) {
      const width = node.size === 's' ? 110 : 160
      const height = node.size === 's' ? 48 : 75
      expect(node.x).toBeGreaterThanOrEqual(group.x)
      expect(node.y).toBeGreaterThanOrEqual(group.y)
      expect(node.x + width).toBeLessThanOrEqual(group.x + group.width)
      expect(node.y + height).toBeLessThanOrEqual(group.y + group.height)
    }
    expect(result.layout.width).toBeGreaterThanOrEqual(group.x + group.width)
    expect(result.layout.height).toBeGreaterThanOrEqual(group.y + group.height)
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
