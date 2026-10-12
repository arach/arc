/** Fixed-step, FIFO teaching model. One tick is 50 ms; a lease lasts 2 s. */
export const POOL_SIZE = 4
export const TICK_SECONDS = 0.05
export const LEASE_TICKS = 40
export const QUEUE_LIMIT = 24

export interface PoolRequest { id: number; arrivedAt: number }
export interface PoolLease extends PoolRequest { startedAt: number; connection: number }
export interface PoolState {
  tick: number
  arrivalCredit: number
  nextId: number
  slots: (PoolLease | null)[]
  queue: PoolRequest[]
  completed: number
  rejected: number
  totalWaitTicks: number
  started: number
  recent: PoolLease[]
}

export function createPoolState(): PoolState {
  return { tick: 0, arrivalCredit: 0, nextId: 1, slots: Array(POOL_SIZE).fill(null), queue: [], completed: 0, rejected: 0, totalWaitTicks: 0, started: 0, recent: [] }
}

/** Demand is requests/second. Releases happen before arrivals and FIFO dispatch. */
export function advancePool(previous: PoolState, demand: number, ticks = 1): PoolState {
  if (!Number.isFinite(demand) || demand < 0 || demand > 6) throw new RangeError('Demand must be between 0 and 6 requests/s')
  if (!Number.isInteger(ticks) || ticks < 0) throw new RangeError('Ticks must be a nonnegative integer')
  const state: PoolState = { ...previous, slots: [...previous.slots], queue: [...previous.queue], recent: [...previous.recent] }
  for (let step = 0; step < ticks; step++) {
    state.tick++
    state.slots = state.slots.map(lease => {
      if (lease && state.tick - lease.startedAt >= LEASE_TICKS) { state.completed++; return null }
      return lease
    })
    state.arrivalCredit += demand * TICK_SECONDS
    const arrivals = Math.floor(state.arrivalCredit + 1e-9)
    state.arrivalCredit = Math.max(0, state.arrivalCredit - arrivals)
    for (let n = 0; n < arrivals; n++) {
      const request = { id: state.nextId++, arrivedAt: state.tick }
      const idle = state.slots.findIndex(slot => slot === null)
      // An arrival may use an idle slot without consuming a waiting-room place.
      if (state.queue.length < QUEUE_LIMIT || idle >= 0) state.queue.push(request)
      else state.rejected++
    }
    state.slots = state.slots.map((lease, connection) => {
      if (lease || !state.queue.length) return lease
      const request = state.queue.shift()!
      const next = { ...request, connection, startedAt: state.tick }
      state.started++
      state.totalWaitTicks += state.tick - request.arrivedAt
      state.recent.push(next)
      return next
    })
    // Retain the preceding lease so the diagram can show which request a connection replaced.
    state.recent = state.recent.filter(lease => state.tick - lease.startedAt <= LEASE_TICKS * 2)
  }
  return state
}

export function poolReadout(state: PoolState) {
  return {
    busy: state.slots.filter(Boolean).length,
    waiting: state.queue.length,
    arrived: state.nextId - 1,
    oldestWait: state.queue.length ? (state.tick - state.queue[0].arrivedAt) * TICK_SECONDS : 0,
    averageWait: state.started ? state.totalWaitTicks / state.started * TICK_SECONDS : 0,
    time: state.tick * TICK_SECONDS,
  }
}
