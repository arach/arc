import { describe, expect, test } from 'bun:test'
import {
  isoToScreen,
  isoFloorRect,
  isoFloorEllipse,
  canvasToIsoFloor,
  COS_30,
  SIN_30,
} from '../src/utils/isometric'

function parsePathPoints(d: string): Array<{ x: number; y: number }> {
  return [...d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2]),
  }))
}

function near(a: number, b: number, eps = 1e-6) {
  return Math.abs(a - b) < eps
}

/** Same math DiagramCanvas uses on mouseup when finishing a group drag. */
function groupFromDrag(start: { x: number; y: number }, end: { x: number; y: number }) {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }
}

describe('iso floor projection', () => {
  test('isoFloorRect projects a world rectangle onto the XY plane as a parallelogram', () => {
    const d = isoFloorRect(10, 20, 100, 40, 400, 500)
    const points = parsePathPoints(d)
    expect(points.length).toBeGreaterThanOrEqual(4)

    const expected = [
      isoToScreen(10, 20, 0),
      isoToScreen(110, 20, 0),
      isoToScreen(110, 60, 0),
      isoToScreen(10, 60, 0),
    ].map((p) => ({ x: 400 + p.screenX, y: 500 + p.screenY }))

    for (const corner of expected) {
      const hit = points.some((p) => near(p.x, corner.x) && near(p.y, corner.y))
      expect(hit).toBe(true)
    }
  })

  test('a circle on the floor projects to the classic isometric ellipse', () => {
    const r = 50
    const d = isoFloorEllipse(0, 0, r, r, 0, 0, 0, 64)
    const points = parsePathPoints(d)
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const rx = (Math.max(...xs) - Math.min(...xs)) / 2
    const ry = (Math.max(...ys) - Math.min(...ys)) / 2
    // Circle of radius r in XY → axis-aligned ellipse: r√2·cos30 by r√2·sin30
    expect(rx).toBeCloseTo(r * Math.SQRT2 * COS_30, 5)
    expect(ry).toBeCloseTo(r * Math.SQRT2 * SIN_30, 5)
  })

  test('canvasToIsoFloor is the inverse of isoToScreen at the canvas origin', () => {
    const originX = 450
    const originY = 800
    const world = { x: 120, y: 80 }
    const screen = isoToScreen(world.x, world.y, 0)
    const back = canvasToIsoFloor(originX + screen.screenX, originY + screen.screenY, originX, originY)
    expect(back.x).toBeCloseTo(world.x, 8)
    expect(back.y).toBeCloseTo(world.y, 8)
  })

  test('dragging two canvas points in iso view yields a floor rect that projects back onto those corners', () => {
    const originX = 450
    const originY = 400
    const startWorld = { x: 40, y: 20 }
    const endWorld = { x: 180, y: 140 }
    const startScreen = isoToScreen(startWorld.x, startWorld.y, 0)
    const endScreen = isoToScreen(endWorld.x, endWorld.y, 0)
    const start = canvasToIsoFloor(originX + startScreen.screenX, originY + startScreen.screenY, originX, originY)
    const end = canvasToIsoFloor(originX + endScreen.screenX, originY + endScreen.screenY, originX, originY)
    const group = groupFromDrag(start, end)

    expect(group.width).toBeCloseTo(140, 8)
    expect(group.height).toBeCloseTo(120, 8)

    const path = isoFloorRect(group.x, group.y, group.width, group.height, originX, originY)
    const points = parsePathPoints(path)
    const corners = [
      { x: group.x, y: group.y },
      { x: group.x + group.width, y: group.y },
      { x: group.x + group.width, y: group.y + group.height },
      { x: group.x, y: group.y + group.height },
    ].map((c) => {
      const p = isoToScreen(c.x, c.y, 0)
      return { x: originX + p.screenX, y: originY + p.screenY }
    })

    for (const corner of corners) {
      expect(points.some((p) => near(p.x, corner.x) && near(p.y, corner.y))).toBe(true)
    }

    const isGroupCorner = (pt: { x: number; y: number }) =>
      (near(pt.x, group.x) && near(pt.y, group.y)) ||
      (near(pt.x, group.x + group.width) && near(pt.y, group.y)) ||
      (near(pt.x, group.x + group.width) && near(pt.y, group.y + group.height)) ||
      (near(pt.x, group.x) && near(pt.y, group.y + group.height))

    expect(isGroupCorner(start)).toBe(true)
    expect(isGroupCorner(end)).toBe(true)
  })

  test('a circle drag uses the same bounding box, projected as an ellipse', () => {
    const originX = 400
    const originY = 500
    const start = canvasToIsoFloor(410, 480, originX, originY)
    const end = canvasToIsoFloor(520, 400, originX, originY)
    const group = groupFromDrag(start, end)
    const path = isoFloorEllipse(
      group.x + group.width / 2,
      group.y + group.height / 2,
      group.width / 2,
      group.height / 2,
      originX,
      originY,
    )
    expect(parsePathPoints(path).length).toBeGreaterThan(16)
  })
})

