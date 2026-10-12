import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pause, Play, RotateCcw, StepForward } from 'lucide-react'
import PoolMechanism from './PoolMechanism'
import { useMeta } from '../../hooks/useMeta'
import { advancePool, createPoolState, POOL_SIZE, TICK_SECONDS, poolReadout } from './connectionPoolModel'
import { poolChapterState, POOL_CHAPTERS, type PoolChapter } from './connectionPoolDiagram'
import './connection-pool.css'

export default function ConnectionPoolExplainer() {
  useMeta({ title: 'How a connection pool works | Arc', description: 'Borrow, wait, reuse. Explore a connection pool with a live, deterministic model.', url: '/examples/connection-pool' })
  const [state, setState] = useState(() => poolChapterState('borrow'))
  const [demand, setDemand] = useState(1)
  const [running, setRunning] = useState(false)
  const [scene, setScene] = useState(0)
  const [chapter, setChapter] = useState<PoolChapter>('borrow')
  const [visible, setVisible] = useState(!document.hidden)
  const [inView, setInView] = useState(true)
  const figure = useRef<HTMLElement>(null)
  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    const observer = new IntersectionObserver(entries => setInView(entries[0].isIntersecting))
    if (figure.current) observer.observe(figure.current)
    return () => { document.removeEventListener('visibilitychange', onVisibility); observer.disconnect() }
  }, [])
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const pause = () => { if (media.matches) setRunning(false) }
    media.addEventListener('change', pause)
    return () => media.removeEventListener('change', pause)
  }, [])
  useEffect(() => {
    if (!running || !visible || !inView) return
    const timer = window.setInterval(() => setState(previous => advancePool(previous, demand)), TICK_SECONDS * 1000)
    return () => window.clearInterval(timer)
  }, [running, demand, visible, inView])
  const readout = poolReadout(state)
  const activeChapter = POOL_CHAPTERS.find(item => item.id === chapter)
  const condition = readout.waiting ? 'Requests are waiting' : readout.busy === POOL_SIZE ? 'Every connection is busy' : 'Connections are available'
  const chooseChapter = (id: PoolChapter) => {
    setScene(value => value + 1)
    setChapter(id)
    setState(poolChapterState(id))
    setDemand(id === 'borrow' ? 1 : id === 'wait' ? 4 : 0)
  }
  const reset = () => { setScene(value => value + 1); setState(createPoolState()); setDemand(1); setChapter('borrow'); setRunning(false) }

  return (
    <div className="pool-page">
      <header className="pool-nav">
        <Link to="/" className="pool-brand"><img src={`${import.meta.env.BASE_URL}arc-mark.svg`} alt="" width="24" height="24" /> Arc</Link>
        <Link to="/showcase"><ArrowLeft size={14} aria-hidden="true" /> Player showcase</Link>
      </header>
      <main className="pool-main">
        <header className="pool-intro">
          <h1>Four connections.<br /><span>Many more requests.</span></h1>
          <p>A pool lends out a small set of database connections. Turn up demand to see what happens when every connection is taken.</p>
        </header>
        <figure className="pool-figure" ref={figure} aria-label="Interactive connection pool model">
          <div className="pool-figure-heading">
            <h2>Explore the pool</h2>
            <span className="pool-clock">Model time <output>{readout.time.toFixed(1)} s</output></span>
          </div>
          <div className="pool-chapters" role="group" aria-label="Explore the pool">
            {POOL_CHAPTERS.map((item, index) => <button key={item.id} aria-pressed={chapter === item.id} onClick={() => chooseChapter(item.id)}><span>{index + 1}</span>{item.title}</button>)}
          </div>
          <p className="pool-caption" aria-live="polite">{activeChapter?.caption ?? 'Adjust demand and follow each request through the pool.'}</p>
          <PoolMechanism key={scene} state={state} playing={running && visible && inView} />
          <div className="pool-controls">
            <div className="pool-demand">
              <label htmlFor="pool-demand">Incoming demand <output>{demand.toFixed(1)} requests / s</output></label>
              <input id="pool-demand" type="range" min="0" max="6" step="0.5" value={demand} aria-valuetext={`${demand} requests per second`} onChange={event => setDemand(Number(event.target.value))} />
              <div className="pool-scale"><span>0</span><span>Pool capacity: 2 / s</span><span>6</span></div>
            </div>
            <div className="pool-playback">
              <button className="pool-primary" onClick={() => setRunning(value => !value)}>{running ? <Pause size={15} /> : <Play size={15} />}{running ? 'Pause' : 'Run'}</button>
              <button disabled={running} onClick={() => setState(previous => advancePool(previous, demand, 10))}><StepForward size={15} />Step 0.5 s</button>
              <button onClick={reset}><RotateCcw size={15} />Reset</button>
            </div>
          </div>
          <figcaption className="pool-status">
            <span aria-live="polite">{condition}</span>
            <span>{state.completed} completed · {state.rejected} rejected</span>
          </figcaption>
        </figure>
        <section className="pool-explanation" aria-labelledby="pool-capacity-heading">
          <h2 id="pool-capacity-heading">The pool has a speed limit.</h2>
          <div><p>Four connections, held for two seconds each, can complete at most <strong>two requests per second</strong>. Above that rate, the waiting room grows. Set demand to zero to watch the pool finish its work and become available again.</p>
          <p className="pool-assumptions">This is an illustrative model: evenly spaced arrivals, identical two-second leases including the round trip, and a waiting room of 24. Arrivals beyond a full waiting room are rejected. Real queries take different amounts of time.</p>
          <p className="pool-assumptions">Each chapter opens a fresh example. Press Run to start the clock, or Step to advance half a second. Playback pauses when the figure leaves the screen.</p></div>
        </section>
      </main>
    </div>
  )
}
