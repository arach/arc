import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  code: string
  language?: 'typescript' | 'javascript' | 'tsx' | 'jsx' | 'bash' | 'json'
  filename?: string
  showLineNumbers?: boolean
}

// Simple syntax highlighter matching the landing page style
function highlightCode(code: string, language: string): string {
  let html = escapeHtml(code)

  // Comments first
  html = html.replace(/(\/\/.*$)/gm, '<span class="hl-comment">$1</span>')
  html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')
  html = html.replace(/(#.*$)/gm, '<span class="hl-comment">$1</span>')

  // Strings
  html = html.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-string">$1</span>')
  html = html.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="hl-string">$1</span>')
  html = html.replace(/(`(?:[^`\\]|\\.)*`)/g, '<span class="hl-string">$1</span>')

  // Keywords
  const keywords = [
    'import', 'export', 'from', 'default', 'const', 'let', 'var',
    'function', 'return', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'new', 'this',
    'class', 'extends', 'implements', 'interface', 'type',
    'async', 'await', 'try', 'catch', 'finally', 'throw',
    'true', 'false', 'null', 'undefined', 'typeof', 'instanceof',
    'as', 'in', 'of'
  ]
  const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g')
  html = html.replace(keywordRegex, '<span class="hl-keyword">$1</span>')

  // Types (capitalized words)
  html = html.replace(/\b([A-Z][a-zA-Z0-9]*)\b(?![^<]*>)/g, '<span class="hl-type">$1</span>')

  // Numbers
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>')

  // Properties (word followed by colon)
  html = html.replace(/(\w+)(\s*:)/g, '<span class="hl-property">$1</span>$2')

  return html
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export default function CodeBlock({
  code,
  language = 'typescript',
  filename,
  showLineNumbers = true
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Don't syntax highlight bash/terminal - just escape HTML
  const highlightedCode = language === 'bash'
    ? escapeHtml(code)
    : highlightCode(code, language)

  return (
    <div
      className="group relative rounded-2xl overflow-hidden my-6"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        border: '1px solid rgba(16, 21, 24, 0.12)',
        boxShadow: '0 10px 24px rgba(16, 23, 32, 0.1)',
        maxWidth: '100%',
        minWidth: 0,
      }}
    >
      {/* Header with traffic lights and filename */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: 'rgba(250, 248, 244, 0.95)',
          borderBottom: '1px solid rgba(16, 21, 24, 0.08)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f56' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ffbd2e' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#27ca40' }} />
          {filename && (
            <span
              className="ml-2 text-xs"
              style={{
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                color: '#5c676c',
              }}
            >
              {filename}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors px-2 py-1 rounded"
          style={{ color: '#5c676c' }}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div
        className="code-scroll-container"
        style={{
          overflowX: 'auto',
          maxWidth: '100%',
        }}
      >
        <pre
          style={{
            margin: 0,
            padding: '16px',
            fontSize: '12px',
            lineHeight: 1.7,
            fontFamily: "'JetBrains Mono', 'SF Mono', 'Monaco', monospace",
            color: '#101518',
            background: 'transparent',
            whiteSpace: 'pre',
            wordBreak: 'normal',
            overflowWrap: 'normal',
          }}
        >
          <code style={{ display: 'block' }} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
      </div>

      {/* Syntax highlighting and scrollbar styles */}
      <style>{`
        .hl-keyword { color: #cf222e; font-weight: 500; }
        .hl-string { color: #0a3069; }
        .hl-number { color: #0550ae; }
        .hl-property { color: #116329; }
        .hl-comment { color: #6e7781; font-style: italic; }
        .hl-type { color: #8250df; }

        .code-scroll-container::-webkit-scrollbar {
          height: 8px;
        }
        .code-scroll-container::-webkit-scrollbar-track {
          background: rgba(16, 21, 24, 0.04);
          border-radius: 4px;
        }
        .code-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(16, 21, 24, 0.15);
          border-radius: 4px;
        }
        .code-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 21, 24, 0.25);
        }
      `}</style>
    </div>
  )
}

// Inline code component
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
        fontSize: '13px',
        padding: '2px 6px',
        borderRadius: '4px',
        background: 'rgba(16, 21, 24, 0.06)',
        color: '#101518',
      }}
    >
      {children}
    </code>
  )
}
