import { describe, expect, test } from 'bun:test'
import { poolHandoffs } from '../src/components/explainers/usePoolHandoffs'
import { poolChapterState } from '../src/components/explainers/connectionPoolDiagram'
import { advancePool, createPoolState } from '../src/components/explainers/connectionPoolModel'

describe('visual pool handoffs', () => {
  test('a half-second step moves the oldest queued identities to their assigned slots', () => {
    const before = poolChapterState('wait')
    const next = advancePool(before, 0, 10)
    expect(poolHandoffs(before, next).map(lease => [lease?.id, lease?.connection])).toEqual([[5, 0], [6, 1]])
    expect(before.queue.slice(0, 2).map(request => request.id)).toEqual([5, 6])
    expect(poolHandoffs(next, advancePool(next, 0))).toEqual([])
  })
  test('new arrivals can borrow immediately and backward resets do not replay leases', () => {
    const before = createPoolState()
    const next = advancePool(before, 1, 20)
    expect(poolHandoffs(before, next).map(lease => lease?.id)).toEqual([1])
    expect(poolHandoffs(next, before)).toEqual([])
    expect(poolHandoffs(next, next)).toEqual([])
  })
})
