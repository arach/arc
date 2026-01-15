import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Book, ArrowRight, ArrowLeft, Sun, Moon, Bot } from 'lucide-react'
import { docsNav } from './DocsLayout'
import { useMeta } from '../../hooks/useMeta'

interface DocsIndexPageProps {
  onNavigate: (page: string) => void
  onBack: () => void
}

export default function DocsIndexPage({ onNavigate, onBack }: DocsIndexPageProps) {
  const [isDark, setIsDark] = useState(false)

  // Set page-specific meta tags
  useMeta({
    title: 'Arc Documentation',
    description: 'Everything you need to create beautiful architecture diagrams with Arc.',
    image: '/og-docs.png',
    url: '/docs',
  })

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
        background: isDark ? '#0a0c0e' : '#f7f3ec',
        color: isDark ? '#e5e7eb' : '#101518',
      }}
    >
      {/* Top navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-14"
        style={{
          backdropFilter: 'blur(12px)',
          background: isDark ? 'rgba(10, 12, 14, 0.9)' : 'rgba(247, 243, 236, 0.9)',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16, 21, 24, 0.08)'}`,
        }}
      >
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Brand */}
            <Link
              to="/docs"
              className="flex items-baseline gap-2 transition-colors"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: '#f07c4f',
                  boxShadow: '0 0 0 4px rgba(240, 124, 79, 0.2)',
                }}
              />
              <span className="text-lg font-semibold" style={{ color: isDark ? '#f3f4f6' : '#101518' }}>
                Arc
              </span>
            </Link>

            {/* Divider */}
            <span
              className="w-px h-4"
              style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(16, 21, 24, 0.15)' }}
            />

            {/* Back button */}
            <Link
              to="/"
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors group"
              style={{ color: isDark ? '#6b7280' : '#5c676c' }}
            >
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded transition-colors"
              style={{ color: isDark ? '#6b7280' : '#5c676c' }}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* DOCS label - fancy lettering */}
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-[0.25em]"
              style={{ color: isDark ? '#f3f4f6' : '#101518' }}
            >
              DOCS
            </span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-14">
        <div className="max-w-5xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(240, 124, 79, 0.12)',
                border: '1px solid rgba(240, 124, 79, 0.2)',
              }}
            >
              <Book className="w-7 h-7" style={{ color: '#f07c4f' }} />
            </div>
            <div>
              <h1
                className="text-3xl font-semibold tracking-tight"
                style={{
                  fontFamily: "'Fraunces', serif",
                  color: isDark ? '#f3f4f6' : '#101518',
                }}
              >
                Arc Documentation
              </h1>
              <p style={{ color: '#5c676c', fontSize: '14px' }}>
                Everything you need to create beautiful architecture diagrams
              </p>
            </div>
          </div>

          <p
            className="text-lg mb-12 max-w-2xl leading-relaxed"
            style={{ color: isDark ? '#9ca3af' : '#5c676c' }}
          >
            Arc is a visual diagram editor that outputs clean, declarative configs.
            Design systems once, export everywhere—docs, decks, and code.
          </p>

          {/* Navigation sections */}
          <div className="grid md:grid-cols-2 gap-8">
            {docsNav.map((group) => (
              <div key={group.title}>
                <h2
                  className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4"
                  style={{ color: isDark ? '#6b7280' : '#5c676c' }}
                >
                  {group.title}
                </h2>
                <div className="space-y-3">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className="w-full group flex items-center justify-between p-4 rounded-2xl transition-all text-left"
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255, 255, 255, 0.75)',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16, 21, 24, 0.12)'}`,
                          boxShadow: '0 10px 24px rgba(16, 23, 32, 0.1)',
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors"
                            style={{
                              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16, 21, 24, 0.04)',
                            }}
                          >
                            <Icon
                              className="w-5 h-5 transition-colors"
                              style={{ color: isDark ? '#9ca3af' : '#5c676c' }}
                            />
                          </div>
                          <div>
                            <span
                              className="font-semibold"
                              style={{ color: isDark ? '#f3f4f6' : '#101518' }}
                            >
                              {item.title}
                            </span>
                            <p className="text-sm mt-0.5" style={{ color: '#5c676c' }}>
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <ArrowRight
                          className="w-4 h-4 group-hover:translate-x-1 transition-all"
                          style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div
            className="mt-16 pt-8"
            style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16, 21, 24, 0.1)'}` }}
          >
            <h2
              className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4"
              style={{ color: isDark ? '#6b7280' : '#5c676c' }}
            >
              Quick Links
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/"
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.75)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16, 21, 24, 0.12)'}`,
                  color: isDark ? '#9ca3af' : '#2e3538',
                }}
              >
                Back to Arc
              </Link>
              <Link
                to="/editor"
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: 'linear-gradient(135deg, #f07c4f, #f2a071)',
                  color: '#1c120a',
                  boxShadow: '0 12px 24px rgba(240, 124, 79, 0.28)',
                }}
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
