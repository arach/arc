import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Book, ArrowRight, ArrowLeft, Sun, Moon } from 'lucide-react'
import { docsNav } from './DocsLayout'

interface DocsIndexPageProps {
  onNavigate: (page: string) => void
  onBack: () => void
}

export default function DocsIndexPage({ onNavigate, onBack }: DocsIndexPageProps) {
  const [isDark, setIsDark] = useState(false)

  return (
    <div className={`min-h-screen ${isDark ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
      {/* Top navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-md border-b ${
        isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-zinc-200'
      }`}>
        <div className="h-full px-4 flex items-center justify-between max-w-5xl mx-auto">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-colors group ${
              isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'
            }`}
          >
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
            <span>ARC</span>
          </button>

          <div className="flex items-center gap-4">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
              isDark ? 'text-zinc-200' : 'text-zinc-900'
            }`}>
              DOCS
            </span>

            {/* Theme toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-14">
        <div className="max-w-5xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-violet-500/20' : 'bg-violet-100'
            }`}>
              <Book className={`w-6 h-6 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
            </div>
            <div>
              <h1 className={`text-3xl font-semibold tracking-tight ${
                isDark ? 'text-zinc-100' : 'text-zinc-900'
              }`}>
                Arc Documentation
              </h1>
              <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                Everything you need to create beautiful architecture diagrams
              </p>
            </div>
          </div>

          <p className={`text-lg mb-12 max-w-2xl ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Arc is a visual diagram editor that outputs clean, declarative configs.
            Design systems once, export everywhere—docs, decks, and code.
          </p>

          {/* Navigation sections */}
          <div className="grid md:grid-cols-2 gap-8">
            {docsNav.map((group) => (
              <div key={group.title}>
                <h2 className={`text-xs font-bold uppercase tracking-wider mb-4 ${
                  isDark ? 'text-zinc-500' : 'text-zinc-400'
                }`}>
                  {group.title}
                </h2>
                <div className="space-y-3">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`w-full group flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                          isDark
                            ? 'border-zinc-800 bg-zinc-900 hover:border-violet-500/50 hover:bg-zinc-800'
                            : 'border-zinc-200 bg-white hover:border-violet-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                            isDark
                              ? 'bg-zinc-800 group-hover:bg-violet-500/20'
                              : 'bg-zinc-100 group-hover:bg-violet-100'
                          }`}>
                            <Icon className={`w-5 h-5 transition-colors ${
                              isDark
                                ? 'text-zinc-400 group-hover:text-violet-400'
                                : 'text-zinc-500 group-hover:text-violet-600'
                            }`} />
                          </div>
                          <div>
                            <span className={`font-semibold transition-colors ${
                              isDark
                                ? 'text-zinc-200 group-hover:text-violet-400'
                                : 'text-zinc-900 group-hover:text-violet-700'
                            }`}>
                              {item.title}
                            </span>
                            <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-all ${
                          isDark
                            ? 'text-zinc-600 group-hover:text-violet-400'
                            : 'text-zinc-300 group-hover:text-violet-500'
                        }`} />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className={`mt-16 pt-8 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-4 ${
              isDark ? 'text-zinc-500' : 'text-zinc-400'
            }`}>
              Quick Links
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onBack}
                className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                  isDark
                    ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
                }`}
              >
                Back to Arc
              </button>
              <Link
                to="/editor"
                className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                  isDark
                    ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
                }`}
              >
                Open Editor
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
