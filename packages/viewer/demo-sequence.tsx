import { StrictMode, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  ArcMermaidPlayer,
  classifyNoteAccent,
} from './src/mermaid/index'
import source from '../../fixtures/mermaid/scout-interaction.sequence.mmd?raw'

function Demo() {
  const [mode, setMode] = useState<'light' | 'dark'>('dark')

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 'clamp(16px, 3vw, 40px)',
        background:
          mode === 'dark'
            ? 'radial-gradient(circle at 50% -10%, #2e1065 0, #09090b 42%)'
            : 'radial-gradient(circle at 50% -10%, #ede9fe 0, #fafafa 42%)',
        boxSizing: 'border-box',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <header
        style={{
          maxWidth: 1080,
          margin: '0 auto 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'end',
          justifyContent: 'space-between',
          gap: 20,
          color: mode === 'dark' ? '#fafafa' : '#18181b',
        }}
      >
        <div style={{ flex: '1 1 290px', minWidth: 0 }}>
          <div style={{ color: '#a78bfa', fontSize: 12, fontWeight: 750, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            Arc native Mermaid
          </div>
          <h1 style={{ margin: '6px 0 3px', fontSize: 'clamp(23px, 3.2vw, 36px)', letterSpacing: '-.04em' }}>
            One message, two cost boundaries
          </h1>
          <p style={{ margin: 0, color: mode === 'dark' ? '#a1a1aa' : '#71717a' }}>
            A real sequence diagram—semantic, themeable, focusable, and playable.
          </p>
        </div>
        <button
          onClick={() => setMode((value) => (value === 'dark' ? 'light' : 'dark'))}
          style={{
            border: `1px solid ${mode === 'dark' ? '#3f3f46' : '#d4d4d8'}`,
            background: mode === 'dark' ? '#18181b' : '#fff',
            color: mode === 'dark' ? '#e4e4e7' : '#27272a',
            borderRadius: 999,
            padding: '7px 11px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {mode === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </header>
      <section style={{ maxWidth: 1080, margin: '0 auto' }}>
        <ArcMermaidPlayer
          source={source}
          mode={mode}
          title="Scout interaction model"
          description="How a local Scout message becomes either a concierge reply or delegated repository work."
          sequence={{
            width: 1040,
            maxLabelWidth: 168,
            noteAccent: (event) => classifyNoteAccent(event.text),
          }}
        />
      </section>
    </main>
  )
}

document.documentElement.style.background = '#09090b'
document.body.style.margin = '0'

const rootElement = document.getElementById('root') as HTMLElement & {
  arcSequenceDemoRoot?: Root
}
const root = rootElement.arcSequenceDemoRoot ?? createRoot(rootElement)
rootElement.arcSequenceDemoRoot = root

root.render(
  <StrictMode>
    <Demo />
  </StrictMode>,
)
