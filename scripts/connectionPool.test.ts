import { describe, expect, test } from 'bun:test'
import { advancePool, createPoolState, LEASE_TICKS, POOL_SIZE, QUEUE_LIMIT, poolReadout } from '../src/components/explainers/connectionPoolModel'
import { connectionPoolDiagram, poolChapterState } from '../src/components/explainers/connectionPoolDiagram'
import { validateDiagram } from '../src/utils/diagramDiagnostics'
import { flowPositionAt, resolveDiagramFlow } from '../src/utils/flowAnimation'

describe('connection pool teaching model', () => {
  test('holds every lease for two seconds then reuses the connection for the oldest request', () => {
    let state = advancePool(createPoolState(), 4, 25)
    expect(state.slots.map(lease => lease?.id)).toEqual([1, 2, 3, 4])
    expect(state.queue.map(request => request.id)).toEqual([5])
    const releaseAt = state.slots[0]!.startedAt + LEASE_TICKS
    state = advancePool(state, 0, releaseAt - state.tick - 1)
    expect(state.completed).toBe(0)
    state = advancePool(state, 0)
    expect(state.completed).toBe(1)
    expect(state.slots[0]?.id).toBe(5)
    expect(state.slots[0]?.connection).toBe(0)
  })
  test('conserves every arrival through overload, queue rejection and a full drain', () => {
    let state = createPoolState()
    for (let tick = 0; tick < 1600; tick++) {
      state = advancePool(state, tick < 600 ? 6 : 0)
      const readout = poolReadout(state)
      expect(readout.busy).toBeLessThanOrEqual(POOL_SIZE)
      expect(readout.waiting).toBeLessThanOrEqual(QUEUE_LIMIT)
      expect(readout.arrived).toBe(state.completed + state.rejected + readout.busy + readout.waiting)
      expect(new Set([...state.queue, ...state.slots.filter(Boolean)].map(request => request!.id)).size).toBe(readout.busy + readout.waiting)
    }
    expect(state.rejected).toBeGreaterThan(0)
    expect(state.completed + state.rejected).toBe(180)
    expect(state.queue).toHaveLength(0)
    expect(state.slots.every(slot => !slot)).toBe(true)
    expect(state.recent).toHaveLength(0)
  })
  test('is immutable and produces identical results regardless of playback batching', () => {
    const initial = createPoolState()
    let stepped = initial
    for (let tick = 0; tick < 600; tick++) stepped = advancePool(stepped, 3.5)
    expect(advancePool(initial, 3.5, 600)).toEqual(stepped)
    expect(initial).toEqual(createPoolState())
  })
  test('has no queue below capacity and drains after demand changes', () => {
    let state = advancePool(createPoolState(), 1, 1000)
    expect(state.queue).toHaveLength(0)
    expect(state.rejected).toBe(0)
    state = advancePool(state, 4, 200)
    expect(state.queue.length).toBeGreaterThan(0)
    state = advancePool(state, 0, 600)
    expect(state.completed).toBe(90)
    expect(poolReadout(state).busy).toBe(0)
  })
  test('checks invalid inputs', () => {
    expect(() => advancePool(createPoolState(), NaN)).toThrow()
    expect(() => advancePool(createPoolState(), 7)).toThrow()
    expect(() => advancePool(createPoolState(), 1, -1)).toThrow()
  })
})

describe('connection pool Arc projection', () => {
  test('validates both layouts at rest, under load and after draining', () => {
    const overloaded = advancePool(createPoolState(), 4, 300)
    for (const state of [createPoolState(), overloaded, advancePool(overloaded, 0, 600)]) {
      for (const compact of [true, false]) {
        expect(validateDiagram(connectionPoolDiagram(state, compact))).toEqual([])
      }
    }
  })
  test('shows the FIFO handoff on the same connection after a result returns', () => {
    const before = poolChapterState('wait')
    const after = advancePool(before, 0, 10)
    const diagram = connectionPoolDiagram(after)
    expect(before.queue[0].id).toBe(5)
    expect(connectionPoolDiagram(before).nodeData.queue.subtitle).toContain('Next: #5')
    expect(after.slots[0]?.id).toBe(5)
    expect(diagram.nodeData.c1.name).toBe('C1 · request #5')
    expect(diagram.nodeData.c1.description).toContain('Reused: #1 → #5')
    expect(diagram.nodeData.c1.description).toContain('Waited 1.0 s in queue')
    expect(diagram.nodeData.queue.subtitle).toContain('Next: #7')
    expect(Object.keys(diagram.nodes).filter(id => /^c[1-4]$/.test(id))).toHaveLength(4)
    expect(diagram.flows!.find(flow => flow.id === 'out-5')!.legs).toEqual([{ id: 'borrow-c1' }, { id: 'query-c1' }])
    expect(diagram.flows!.some(flow => flow.id === 'out-1')).toBe(false)
  })
  test('chapters open directly on borrowing, waiting and reuse without requiring playback', () => {
    expect(poolReadout(poolChapterState('borrow')).busy).toBe(1)
    expect(poolChapterState('wait').queue.map(request => request.id)).toEqual([5, 6, 7, 8])
    expect(connectionPoolDiagram(poolChapterState('reuse')).nodeData.c1.description).toContain('Reused: #1 → #5')
    const drained = connectionPoolDiagram(advancePool(poolChapterState('reuse'), 0, 200))
    expect(drained.nodeData.queue.subtitle).toBe('0 / 24 waiting')
    for (const id of ['c1', 'c2', 'c3', 'c4']) expect(drained.nodeData[id].name).toContain('Available')
  })
  test('derives one-shot packets from lease events and returns before release', () => {
    const state = advancePool(createPoolState(), 1, 20)
    const diagram = connectionPoolDiagram(state)
    const lease = state.slots[0]!
    const start = lease.startedAt * 0.05
    const outgoing = resolveDiagramFlow(diagram, diagram.flows![0])!
    const returning = resolveDiagramFlow(diagram, diagram.flows![1])!
    expect(flowPositionAt(outgoing, start - 0.01)).toBeNull()
    expect(flowPositionAt(outgoing, start + 0.2)).not.toBeNull()
    expect(flowPositionAt(returning, start + 1.8)).not.toBeNull()
    expect(flowPositionAt(returning, start + 2.001)).toBeNull()
  })
})
