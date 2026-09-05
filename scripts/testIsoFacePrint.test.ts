import { describe, expect, test } from 'bun:test'
import { isoToScreen, isoTopFaceMatrix, resolveIsoLabelDir } from '../src/utils/isometric'
import { fitFacePrint } from '../src/components/editor/IsoFacePrint'

function applyMatrix(matrix: string, x: number, y: number) {
  const [a, b, c, d, e, f] = matrix.split(',').map(Number)
  return { x: a * x + c * y + e, y: b * x + d * y + f }
}

describe('iso top-face print', () => {
  test('local +x follows world +X on the top face', () => {
    const p = applyMatrix(isoTopFaceMatrix('x'), 1, 0)
    const world = isoToScreen(1, 0, 0)
    expect(p.x).toBeCloseTo(world.screenX, 8)
    expect(p.y).toBeCloseTo(world.screenY, 8)
  })

  test('local +y (SVG down) runs toward the camera along −Y', () => {
    const p = applyMatrix(isoTopFaceMatrix('x'), 0, 1)
    const towardCamera = isoToScreen(0, -1, 0)
    expect(p.x).toBeCloseTo(towardCamera.screenX, 8)
    expect(p.y).toBeCloseTo(towardCamera.screenY, 8)
  })

  test('depth axis runs local +x along world +Y', () => {
    const p = applyMatrix(isoTopFaceMatrix('y'), 1, 0)
    const world = isoToScreen(0, 1, 0)
    expect(p.x).toBeCloseTo(world.screenX, 8)
    expect(p.y).toBeCloseTo(world.screenY, 8)
  })

  test('auto follows the longer top-face edge, flip turns 180°', () => {
    expect(resolveIsoLabelDir('auto', 120, 40)).toBe('x')
    expect(resolveIsoLabelDir('auto', 40, 120)).toBe('y')
    expect(resolveIsoLabelDir('auto', 120, 40, true)).toBe('x-')
    expect(resolveIsoLabelDir('y', 120, 40, true)).toBe('y-')
  })

  test('fitFacePrint keeps the stack inside the top face', () => {
    const wide = fitFacePrint('TalkieServer', true, 128, 50)
    expect(wide.stackH).toBeLessThanOrEqual(50)
    expect(wide.fontSize * 'TalkieServer'.length * 0.62).toBeLessThanOrEqual(128)

    const tiny = fitFacePrint('Watch', true, 40, 28)
    expect(tiny.stackH).toBeLessThanOrEqual(28)
    expect(tiny.fontSize).toBeGreaterThan(0)
  })
})
