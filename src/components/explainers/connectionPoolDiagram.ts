import type { ArcDiagramData, DiagramFlow } from '../../types/diagram'
import { advancePool, createPoolState, LEASE_TICKS, POOL_SIZE, QUEUE_LIMIT, TICK_SECONDS, poolReadout, type PoolState } from './connectionPoolModel'

export const POOL_CHAPTERS = [
  { id: 'borrow', title: 'Borrow', caption: 'A request borrows an open connection for two seconds.' },
  { id: 'wait', title: 'Wait', caption: 'Four busy connections. New arrivals wait their turn.' },
  { id: 'reuse', title: 'Reuse', caption: 'The request changes. The connection stays open.' },
] as const
export type PoolChapter = typeof POOL_CHAPTERS[number]['id']

/** Each chapter opens a reproducible point in the same simulation. */
export function poolChapterState(chapter: PoolChapter) {
  return advancePool(createPoolState(), chapter === 'borrow' ? 1 : 4, chapter === 'borrow' ? 20 : chapter === 'wait' ? 40 : 45)
}

export function connectionPoolDiagram(state: PoolState, compact = false, chapter: PoolChapter = 'borrow'): ArcDiagramData {
  const readout = poolReadout(state)
  const connections = Array.from({ length: POOL_SIZE }, (_, index) => `c${index + 1}`)
  const nodes: ArcDiagramData['nodes'] = {
    queue: { x: compact ? 40 : 20, y: compact ? 15 : 205, size: 'l' },
    database: { x: compact ? 40 : 720, y: compact ? 705 : 205, size: 'l' },
  }
  const waiting = state.queue
  const following = waiting.slice(1, 4).map(request => `#${request.id}`).join(' · ')
  const overflow = waiting.length > 4 ? ` +${waiting.length - 4}` : ''
  const nodeData: ArcDiagramData['nodeData'] = {
    queue: {
      name: 'Waiting queue · FIFO',
      subtitle: waiting.length ? `Next: #${waiting[0].id} · ${waiting.length} / ${QUEUE_LIMIT} waiting` : `0 / ${QUEUE_LIMIT} waiting`,
      description: waiting.length
        ? `${following ? `Then ${following}${overflow}` : 'No one behind this request'}\nOldest wait: ${readout.oldestWait.toFixed(1)} s`
        : 'No requests waiting\nBorrow an idle connection',
      icon: 'ListOrdered', color: waiting.length ? 'amber' : 'zinc',
    },
    database: { name: 'Database', subtitle: `${state.completed} ${state.completed === 1 ? 'request' : 'requests'} completed`, description: 'Query → result\nEach lease lasts 2 seconds', icon: 'Database', color: 'emerald' },
  }
  const connectors: ArcDiagramData['connectors'] = []
  connections.forEach((id, index) => {
    const lease = state.slots[index]
    const age = lease ? (state.tick - lease.startedAt) * TICK_SECONDS : 0
    const previous = state.recent.filter(item => item.connection === index && (!lease || item.startedAt < lease.startedAt)).slice(-1)[0]
    nodes[id] = { x: compact ? 40 : 370, y: compact ? 195 + index * 115 : 40 + index * 115, size: 'l' }
    nodeData[id] = {
      name: `C${index + 1} · ${lease ? `request #${lease.id}` : 'Available'}`,
      subtitle: lease ? `${age < 0.5 ? 'Borrowing' : age >= 1.6 ? 'Returning' : 'Querying'} · ${(LEASE_TICKS * TICK_SECONDS - age).toFixed(1)} s left` : 'Open · ready to borrow',
      description: lease
        ? `${previous ? `Reused: #${previous.id} → #${lease.id}` : 'Same connection, held for 2 s'}\n${lease.startedAt > lease.arrivedAt ? `Waited ${((lease.startedAt - lease.arrivedAt) * TICK_SECONDS).toFixed(1)} s in queue` : 'Borrowed without waiting'}`
        : previous ? `Request #${previous.id} finished\nConnection remains open` : 'No request assigned\nConnection remains open',
      icon: 'Cable', color: !lease || age >= 1.6 ? 'emerald' : 'blue',
    }
    connectors.push(
      { id: `borrow-${id}`, from: 'queue', to: id, fromAnchor: compact ? 'left' : 'right', toAnchor: 'left', curve: 'natural', curveDepth: compact ? 4600 / (nodes[id].y - nodes.queue.y) : 40, style: 'borrow' },
      { id: `query-${id}`, from: id, to: 'database', fromAnchor: 'right', toAnchor: compact ? 'right' : 'left', curve: 'natural', curveDepth: compact ? 4600 / (nodes.database.y - nodes[id].y) : 40, style: 'query' },
    )
  })
  const flows: DiagramFlow[] = state.recent.filter(lease => state.tick - lease.startedAt <= LEASE_TICKS).flatMap(lease => {
    const start = lease.startedAt * TICK_SECONDS
    const connection = `c${lease.connection + 1}`
    return [
      { id: `out-${lease.id}`, legs: [{ id: `borrow-${connection}` }, { id: `query-${connection}` }], delay: start, duration: 0.5, repeat: 1, marker: 'packet', color: 'blue', size: 9 },
      { id: `return-${lease.id}`, legs: [{ id: `query-${connection}`, direction: 'reverse' }], delay: start + LEASE_TICKS * TICK_SECONDS - 0.4, duration: 0.4, repeat: 1, marker: 'packet', color: 'emerald', size: 9 },
    ] as DiagramFlow[]
  })
  return {
    id: 'connection-pool',
    layout: compact ? { width: 300, height: 820 } : { width: 960, height: 510 },
    nodes, nodeData, connectors,
    groups: [{ id: 'pool', x: compact ? 26 : 352, y: compact ? 155 : 0, width: compact ? 248 : 256, height: 500, type: 'rect', color: chapter === 'reuse' ? 'emerald' : 'blue', label: `4 OPEN CONNECTIONS · ${readout.busy} BUSY` }],
    connectorStyles: {
      borrow: { color: 'blue', strokeWidth: chapter === 'reuse' ? 1.5 : 2.5, showArrow: true },
      query: { color: 'emerald', strokeWidth: chapter === 'reuse' ? 2.5 : 1.5, bidirectional: true },
    },
    flows,
    views: POOL_CHAPTERS.map(item => ({ ...item, nodes: ['queue', ...connections, 'database'], connectors: connectors.filter(connector => item.id === 'reuse' ? connector.style === 'query' : connector.style === 'borrow').map(connector => ({ id: connector.id })) })),
  }
}
