import { useRef, useState } from 'react'
import { ArrowDown, ArrowRight, Database } from 'lucide-react'
import { usePoolHandoffs } from './usePoolHandoffs'
import { connectionPoolDiagram } from './connectionPoolDiagram'
import { LEASE_TICKS, POOL_SIZE, poolReadout, type PoolState } from './connectionPoolModel'

/** A compact teaching view of the same semantic nodes and deterministic state. */
export default function PoolMechanism({ state, playing }: { state: PoolState; playing: boolean }) {
  const mechanism = useRef<HTMLDivElement>(null)
  usePoolHandoffs(mechanism, state, playing)
  const [selected, setSelected] = useState<number | null>(null)
  const readout = poolReadout(state)
  const diagram = connectionPoolDiagram(state)
  const recentHandoff = state.slots.find(lease => lease && lease.startedAt > lease.arrivedAt)
  const previous = recentHandoff && state.recent.filter(item => item.connection === recentHandoff.connection && item.startedAt < recentHandoff.startedAt).slice(-1)[0]
  return <>
    <div ref={mechanism} className="pool-mechanism" aria-label={`${readout.waiting} waiting, ${readout.busy} of four connections borrowed, ${state.completed} completed`}>
      <section className="pool-waiting" aria-label="Waiting queue">
        <div className="pool-stage-title"><h3>Waiting queue</h3><span>{readout.waiting}</span></div>
        <div className="pool-tickets">
          {state.queue.length ? state.queue.slice(0, 6).map((request, index) => <div className={`pool-ticket ${index === 0 ? 'is-next' : ''}`} key={request.id} data-queue-request={request.id}><span>#{String(request.id).padStart(2, '0')}</span>{index === 0 && <small>Next</small>}</div>) : <div className="pool-empty">No waiting.<br />An open slot is yours.</div>}
          {state.queue.length > 6 && <span className="pool-overflow">+{state.queue.length - 6} more</span>}
        </div>
        <p>First in, first out</p>
      </section>
      <div className="pool-route" aria-hidden="true"><span>borrow</span><i /><ArrowRight size={16} /></div>
      <section className="pool-bank" aria-label="Four reusable connections">
        <div className="pool-stage-title"><h3>Connection pool</h3><span>{readout.busy} / {POOL_SIZE} in use</span></div>
        <div className="pool-slots">
          {state.slots.map((lease, index) => {
            const age = lease ? state.tick - lease.startedAt : 0
            const returning = !!lease && age >= LEASE_TICKS - 8
            return <button key={index} className={`pool-slot ${lease ? returning ? 'is-returning' : 'is-busy' : 'is-idle'}`} aria-pressed={selected === index} aria-label={`Connection ${index + 1}, ${lease ? `request ${lease.id}, ${returning ? 'returning' : 'borrowed'}` : 'available'}. Show details`} onClick={() => setSelected(selected === index ? null : index)}>
              <span className="pool-slot-heading"><span>C{index + 1}</span><i /></span>
              <strong data-slot-request={lease?.id}>{lease ? `#${String(lease.id).padStart(2, '0')}` : 'Open'}</strong>
              <span className="pool-slot-state">{lease ? returning ? 'Returning' : age < 10 ? 'Borrowing' : 'Querying' : 'Ready to borrow'}</span>
              <span className="pool-lease-track"><span style={{ width: `${lease ? 100 * (1 - age / LEASE_TICKS) : 0}%` }} /></span>
            </button>
          })}
        </div>
        <p>Same four connections. Every time.</p>
      </section>
      <div className="pool-route" aria-hidden="true"><span>query</span><i /><ArrowRight size={16} /></div>
      <section className="pool-database" aria-label={`Database, ${state.completed} completed`}>
        <div className="pool-db-icon"><Database size={36} strokeWidth={1.25} /></div>
        <h3>Database</h3><p><strong>{state.completed}</strong> completed</p>
      </section>
    </div>
    <div className="pool-insight" aria-live="polite">
      {selected !== null ? <><span className="pool-insight-tag">C{selected + 1}</span><span>{diagram.nodeData[`c${selected + 1}`].subtitle}. {diagram.nodeData[`c${selected + 1}`].description?.replace('\n', '. ')}</span></>
        : recentHandoff && previous ? <><span className="pool-insight-tag is-reuse">Reused</span><span>C{recentHandoff.connection + 1} finished <strong>#{previous.id}</strong> and picked up <strong>#{recentHandoff.id}</strong> from the queue.</span></>
        : <><ArrowDown size={15} /><span>{readout.waiting ? `All four are busy. Request #${state.queue[0].id} gets the next free connection.` : 'Select a connection to inspect its request and lease.'}</span></>}
    </div>
  </>
}
