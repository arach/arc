import { useLayoutEffect, useRef, type RefObject } from 'react'
import type { PoolState } from './connectionPoolModel'

/** Only leases acquired since the last rendered state are handoffs, not chapter snapshots. */
export function poolHandoffs(previous: PoolState, next: PoolState) {
  if (next.tick <= previous.tick) return []
  return next.slots.filter(lease => lease && lease.startedAt > previous.tick && previous.slots[lease.connection]?.id !== lease.id)
}

type Flight = { animation: Animation; token: HTMLElement; target: HTMLElement; request: number; connection: number }

export function usePoolHandoffs(root: RefObject<HTMLDivElement | null>, state: PoolState, playing: boolean) {
  const prior = useRef<{ state: PoolState; tickets: Map<number, DOMRect>; entry: DOMRect; bounds: DOMRect } | null>(null)
  const flights = useRef(new Set<Flight>())

  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const clear = () => {
      for (const flight of flights.current) {
        flight.animation.cancel()
        flight.target.removeAttribute('data-transferring')
        flight.token.remove()
      }
      flights.current.clear()
      element.querySelectorAll('[data-queue-request]').forEach(ticket => ticket.getAnimations().forEach(animation => animation.cancel()))
    }
    const resize = new ResizeObserver(clear)
    resize.observe(element)
    reduced.addEventListener('change', clear)
    window.addEventListener('resize', clear)
    return () => { resize.disconnect(); reduced.removeEventListener('change', clear); window.removeEventListener('resize', clear); clear() }
  }, [root])

  useLayoutEffect(() => {
    for (const flight of flights.current) {
      if (playing) flight.animation.play()
      else flight.animation.pause()
    }
  }, [playing])

  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const bounds = element.getBoundingClientRect()
    const entry = element.querySelector<HTMLElement>('.pool-tickets')!.getBoundingClientRect()
    const tickets = new Map<number, DOMRect>()
    element.querySelectorAll<HTMLElement>('[data-queue-request]').forEach(ticket => {
      const rect = ticket.querySelector('span')!.getBoundingClientRect()
      const transform = new DOMMatrixReadOnly(getComputedStyle(ticket).transform)
      tickets.set(Number(ticket.dataset.queueRequest), new DOMRect(rect.x - transform.m41, rect.y - transform.m42, rect.width, rect.height))
    })
    const before = prior.current
    prior.current = { state, tickets, entry, bounds }
    for (const flight of flights.current) {
      // A manual step also completes any transfer held by Pause.
      if (before && state.tick > before.state.tick && flight.animation.playState === 'paused') flight.animation.play()
      if (state.slots[flight.connection]?.id !== flight.request) {
        flight.animation.cancel(); flight.target.removeAttribute('data-transferring'); flight.token.remove(); flights.current.delete(flight)
      }
    }
    if (!before || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    poolHandoffs(before.state, state).forEach((lease, index) => {
      if (!lease) return
      const target = element.querySelector<HTMLElement>(`[data-slot-request="${lease.id}"]`)
      if (!target) return
      const from = before.tickets.get(lease.id) ?? before.entry
      const to = target.getBoundingClientRect()
      const token = document.createElement('span')
      token.className = 'pool-flying-request'
      token.textContent = target.textContent
      token.setAttribute('aria-hidden', 'true')
      token.dataset.handoffRequest = String(lease.id)
      element.appendChild(token)
      const startX = from.left + from.width / 2 - before.bounds.left - to.width / 2
      const startY = from.top + from.height / 2 - before.bounds.top - to.height / 2
      const endX = to.left - bounds.left
      const endY = to.top - bounds.top
      token.style.width = `${to.width}px`
      token.style.height = `${to.height}px`
      token.style.fontSize = getComputedStyle(target).fontSize
      target.setAttribute('data-transferring', '')
      const animation = token.animate([
        { transform: `translate(${startX}px, ${startY}px) scale(.6)`, backgroundColor: '#edf4fc' },
        { transform: `translate(${endX}px, ${endY}px) scale(1)`, backgroundColor: '#edf4fc' },
      ], { duration: 620, delay: index * 90, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' })
      const flight = { animation, token, target, request: lease.id, connection: lease.connection }
      flights.current.add(flight)
      animation.onfinish = () => { target.removeAttribute('data-transferring'); token.remove(); flights.current.delete(flight) }
    })
    element.querySelectorAll<HTMLElement>('[data-queue-request]').forEach(ticket => {
      const from = before.tickets.get(Number(ticket.dataset.queueRequest))
      const to = tickets.get(Number(ticket.dataset.queueRequest))
      if (!from || !to || (from.x - before.bounds.x === to.x - bounds.x && from.y - before.bounds.y === to.y - bounds.y)) return
      ticket.animate([{ transform: `translate(${from.x - before.bounds.x - (to.x - bounds.x)}px, ${from.y - before.bounds.y - (to.y - bounds.y)}px)` }, { transform: 'translate(0, 0)' }], { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
    })
  }, [root, state])
}
