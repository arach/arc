import { useState } from 'react'
import { Copy, Check, Bot, FileText, Code, Palette, ArrowLeft } from 'lucide-react'
import { useMeta } from '../../hooks/useMeta'
// Import Dewey-generated docs as raw string
import fullDocumentation from '../../../docs/AGENTS.md?raw'

interface LLMPageProps {
  onNavigate: (page: string) => void
}

export default function LLMPage({ onNavigate }: LLMPageProps) {
  const [copied, setCopied] = useState(false)

  // Set page-specific meta tags
  useMeta({
    title: 'LLM & Agent Reference | Arc Docs',
    description: 'Agent-friendly documentation for AI-assisted diagram generation with Arc.',
    image: '/og-docs-llm.png',
    url: '/docs/llm',
  })

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullDocumentation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('index')}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-violet-400" />
              <span className="font-mono text-sm font-semibold">LLM Documentation</span>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg transition-colors font-medium text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy All</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Intro */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-4">Arc Documentation for Agents</h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-6">
            This page contains the complete Arc documentation in a machine-readable markdown format,
            optimized for LLMs and AI coding assistants.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
              <FileText className="w-5 h-5 text-emerald-400 mb-2" />
              <span className="text-sm text-zinc-300 font-medium">Single-file format</span>
              <p className="text-xs text-zinc-500 mt-1">All docs in one copyable block</p>
            </div>
            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
              <Code className="w-5 h-5 text-blue-400 mb-2" />
              <span className="text-sm text-zinc-300 font-medium">Complete API reference</span>
              <p className="text-xs text-zinc-500 mt-1">Types, schemas, and examples</p>
            </div>
            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
              <Palette className="w-5 h-5 text-violet-400 mb-2" />
              <span className="text-sm text-zinc-300 font-medium">Theme & style guide</span>
              <p className="text-xs text-zinc-500 mt-1">All available options</p>
            </div>
          </div>
        </div>

        {/* Documentation content */}
        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 pt-14 overflow-x-auto text-sm text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
            {fullDocumentation}
          </pre>
        </div>

        {/* Quick links */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <h2 className="text-lg font-semibold mb-4">Human-readable docs</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('overview')}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('quickstart')}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Quickstart
            </button>
            <button
              onClick={() => onNavigate('diagram-format')}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Diagram Format
            </button>
            <button
              onClick={() => onNavigate('themes')}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Themes
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
