import { useState, useMemo } from 'react'
import { Copy, Check, Monitor, Terminal, Type, Braces } from 'lucide-react'
import ArcDiagram, { type ArcDiagramData } from '../ArcDiagram'
import { renderAscii } from '../../utils/asciiRenderer'

const MODES = [
  { id: 'visual', label: 'Visual', icon: Monitor },
  { id: 'unicode', label: 'Unicode', icon: Terminal },
  { id: 'ascii', label: 'ASCII', icon: Type },
  { id: 'json', label: 'JSON', icon: Braces },
] as const

type Mode = typeof MODES[number]['id']

interface RenderShowcaseProps {
  data: ArcDiagramData
}

export default function RenderShowcase({ data }: RenderShowcaseProps) {
  const [mode, setMode] = useState<Mode>('visual')
  const [copied, setCopied] = useState(false)

  const unicodeArt = useMemo(() => renderAscii(data), [data])
  const asciiArt = useMemo(() => renderAscii(data, { charset: 'ascii' }), [data])
  const jsonStr = useMemo(() => JSON.stringify(data, null, 2), [data])

  const copyableText = mode === 'unicode' ? unicodeArt : mode === 'ascii' ? asciiArt : mode === 'json' ? jsonStr : null

  const handleCopy = async () => {
    if (!copyableText) return
    await navigator.clipboard.writeText(copyableText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        borderRadius: '6px',
        overflow: 'hidden',
        background: '#fff',
        border: '1px solid rgba(16, 21, 24, 0.10)',
        boxShadow: '0 1px 0 rgba(16, 21, 24, 0.04)',
      }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '6px 12px',
          background: '#fbfcfd',
          borderBottom: '1px solid rgba(16, 21, 24, 0.10)',
        }}
      >
        <div className="flex items-center gap-0.5">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className="flex items-center gap-1.5 transition-all duration-150"
              style={{
                padding: '5px 10px',
                borderRadius: '3px',
                fontSize: '12px',
                fontWeight: mode === id ? 600 : 400,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                background: mode === id ? '#fff' : 'transparent',
                color: mode === id ? '#101518' : '#8a9298',
                boxShadow: mode === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                border: mode === id ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {label}
            </button>
          ))}
        </div>

        {copyableText && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 transition-colors"
            style={{
              fontSize: '11px',
              color: '#888',
              padding: '4px 8px',
              borderRadius: '2px',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
            }}
          >
            {copied ? (
              <><Check style={{ width: 13, height: 13 }} /><span>Copied</span></>
            ) : (
              <><Copy style={{ width: 13, height: 13 }} /><span>Copy</span></>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ minHeight: 220 }}>
        {mode === 'visual' && (
          <div
            style={{
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
            }}
          >
            <ArcDiagram data={data} mode="light" theme="cool" interactive={false} defaultZoom="fit" />
          </div>
        )}

        {(mode === 'unicode' || mode === 'ascii') && (
          <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
            <pre
              style={{
                margin: 0,
                padding: '20px 24px',
                fontSize: '11px',
                lineHeight: 1.55,
                fontFamily: "'JetBrains Mono', 'SF Mono', 'Monaco', monospace",
                color: '#2a2a2a',
                background: '#fafafa',
                whiteSpace: 'pre',
                wordBreak: 'normal',
                overflowWrap: 'normal',
                letterSpacing: '0.01em',
              }}
            >
              {mode === 'unicode' ? unicodeArt : asciiArt}
            </pre>
          </div>
        )}

        {mode === 'json' && (
          <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
            <pre
              style={{
                margin: 0,
                padding: '16px 20px',
                fontSize: '12px',
                lineHeight: 1.7,
                fontFamily: "'JetBrains Mono', 'SF Mono', 'Monaco', monospace",
                color: '#2a2a2a',
                background: '#fafafa',
                whiteSpace: 'pre',
                wordBreak: 'normal',
                overflowWrap: 'normal',
              }}
              dangerouslySetInnerHTML={{ __html: highlightJson(jsonStr) }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function highlightJson(json: string): string {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span style="color:#116329">$1</span>:')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color:#0a3069">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:#0550ae">$1</span>')
    .replace(/:\s*(true|false|null)\b/g, ': <span style="color:#cf222e">$1</span>')
}
