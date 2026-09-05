import { describe, expect, test } from 'bun:test'
import {
  compareIsoWorldBoxes,
  isoWorldBox,
  sortIsoNodeIds,
  type IsoWorldBox,
} from '../src/utils/isoBlueprint'
import type { NodePosition } from '../src/types/editor'

function box(id: string, overrides: Partial<IsoWorldBox> = {}): IsoWorldBox {
  return {
    id,
    minX: 0,
    maxX: 80,
    minY: 0,
    maxY: 50,
    minZ: 0,
    maxZ: 25,
    order: 0,
    ...overrides,
  }
}

function node(overrides: Partial<NodePosition> = {}): NodePosition {
  return { x: 0, y: 0, size: 'm', ...overrides }
}

describe('iso painter sort', () => {
  test('a box nearer the camera (larger maxX+maxY) draws later', () => {
    const far = box('far', { minX: 0, maxX: 40, minY: 0, maxY: 40 })
    const near = box('near', { minX: 80, maxX: 120, minY: 80, maxY: 120 })
    expect(compareIsoWorldBoxes(far, near)).toBeLessThan(0)
    expect(compareIsoWorldBoxes(near, far)).toBeGreaterThan(0)
  })

  test('a taller box in the same footprint draws later', () => {
    const floor = box('floor', { maxZ: 20 })
    const tower = box('tower', { maxZ: 80 })
    expect(compareIsoWorldBoxes(floor, tower)).toBeLessThan(0)
  })

  test('overlapping volumes honour isoOrder so Under / Over is explicit', () => {
    const watch = box('watch', { minX: 20, maxX: 60, minY: 10, maxY: 40, order: -1 })
    const phone = box('phone', { minX: 0, maxX: 80, minY: 0, maxY: 50, order: 0 })
    expect(compareIsoWorldBoxes(watch, phone)).toBeLessThan(0)
    expect(sortIsoNodeIds(
      {
        watch: node({ x: 20, y: 10, width: 50, isoDepth: 40, isoOrder: -1 }),
        phone: node({ x: 0, y: 0, width: 100, isoDepth: 50 }),
      },
      { watch: { icon: 'Watch', name: 'Watch', color: 'zinc' }, phone: { icon: 'Smartphone', name: 'Phone', color: 'blue' } },
    )).toEqual(['watch', 'phone'])
  })

  test('isoWorldBox uses isoOrder default 0', () => {
    expect(isoWorldBox('a', node()).order).toBe(0)
    expect(isoWorldBox('a', node({ isoOrder: 2 })).order).toBe(2)
  })
})
