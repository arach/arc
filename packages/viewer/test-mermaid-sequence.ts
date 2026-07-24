import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  ArcMermaid,
  ArcMermaidPlayer,
  classifyNoteAccent,
  getSequenceThemeTokens,
  parseMermaid,
} from './src/mermaid/index'

const source = readFileSync(
  new URL('../../fixtures/mermaid/scout-interaction.sequence.mmd', import.meta.url),
  'utf8',
)

describe('native Mermaid sequence documents', () => {
  test('preserves the Scout fixture semantics', () => {
    const result = parseMermaid(source)

    expect(result.diagnostics).toEqual([])
    expect(result.document?.family).toBe('sequence')
    if (result.document?.family !== 'sequence') throw new Error('Expected sequence document')

    expect(result.document.participants.map(({ id, kind }) => ({ id, kind }))).toEqual([
      { id: 'Operator', kind: 'actor' },
      { id: 'Menu', kind: 'participant' },
      { id: 'Broker', kind: 'participant' },
      { id: 'Scoutbot', kind: 'participant' },
      { id: 'Agent', kind: 'participant' },
      { id: 'Tools', kind: 'participant' },
    ])
    expect(result.document.events.filter((event) => event.type === 'message')).toHaveLength(13)
    expect(result.document.events.filter((event) => event.type === 'note')).toHaveLength(3)
    expect(result.document.events.filter((event) => event.type === 'fragmentStart')).toHaveLength(1)
    expect(result.document.events.filter((event) => event.type === 'fragmentElse')).toHaveLength(1)
    expect(result.document.events.filter((event) => event.type === 'fragmentEnd')).toHaveLength(1)
  })

  test('renders Arc-native sequence SVG with customizable tokens', () => {
    const markup = renderToStaticMarkup(
      createElement(ArcMermaid, {
        source,
        interactive: false,
        title: 'Scout interaction model',
        sequence: {
          tokens: { highlight: '#ff00aa' },
          noteAccent: (event) => classifyNoteAccent(event.text),
        },
      }),
    )

    expect(markup).toContain('data-arc-mermaid-family="sequence"')
    expect(markup).toContain('<title')
    expect(markup).toContain('Scout interaction model')
    expect(markup).toContain('Direct concierge answer')
    expect(markup).toContain('Work needs a repo owner')
    expect(markup).toContain('rgba(16, 185, 129, 0.1)')
    expect(markup).not.toContain('No renderer registered')
  })

  test('wraps a native sequence in the interactive player', () => {
    const markup = renderToStaticMarkup(
      createElement(ArcMermaidPlayer, {
        source,
        mode: 'dark',
        title: 'Scout interaction player',
      }),
    )

    expect(markup).toContain('data-arc-mermaid-player')
    expect(markup).toContain('aria-label="Play sequence"')
    expect(markup).toContain('aria-label="Next message"')
    expect(markup).toContain('Overview')
  })

  test('inherits Arc theme palette identity', () => {
    const defaultTokens = getSequenceThemeTokens('dark', 'default')
    const coolTokens = getSequenceThemeTokens('dark', 'cool')

    expect(coolTokens.highlight).not.toBe(defaultTokens.highlight)
    expect(coolTokens.actorStroke).toBe(coolTokens.highlight)
    expect(coolTokens.localStroke).toBe('#2dd4bf')
  })

  test('keeps explicitly local no-model work in the cool accent family', () => {
    expect(classifyNoteAccent(['Local control plane — no model charge'])).toBe(
      'local',
    )
    expect(classifyNoteAccent(['Model inference — plan allowance or API tokens'])).toBe(
      'model',
    )
  })

  test('keeps participants distinct when their sanitized ids collide', () => {
    const result = parseMermaid(`sequenceDiagram
      participant A.B as Dotted
      participant A_B as Underscored
      A.B->>A_B: Keep both participants`)

    expect(result.document?.family).toBe('sequence')
    if (result.document?.family !== 'sequence') throw new Error('Expected sequence document')

    expect(result.document.participants.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'A_B', label: 'Dotted' },
      { id: 'A_B_2', label: 'Underscored' },
    ])
    expect(result.document.events[0]).toMatchObject({
      type: 'message',
      from: 'A_B',
      to: 'A_B_2',
    })
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'id-collision', severity: 'error' }),
    )
  })
})
