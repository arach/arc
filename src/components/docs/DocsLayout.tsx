"use client"
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Book, Lightbulb, Boxes, FileCode, Palette,
  Layers, Upload, Menu, X, ChevronRight, Sun, Moon, Copy, Check, Bot
} from 'lucide-react'
import { useMeta } from '../../hooks/useMeta'

// Navigation structure for all docs
export const docsNav = [
  {
    title: 'Getting Started',
    items: [
      { id: 'overview', title: 'Overview', icon: Lightbulb, description: 'Introduction to Arc' },
      { id: 'quickstart', title: 'Quickstart', icon: ChevronRight, description: 'Get up and running' },
    ]
  },
  {
    title: 'Core Concepts',
    items: [
      { id: 'diagram-format', title: 'Diagram Format', icon: FileCode, description: 'Data structure & schema' },
      { id: 'architecture', title: 'Architecture', icon: Boxes, description: 'Templates & themes' },
    ]
  },
  {
    title: 'Styling',
    items: [
      { id: 'templates', title: 'Templates', icon: Layers, description: 'Structural styling' },
      { id: 'themes', title: 'Themes', icon: Palette, description: 'Color palettes' },
    ]
  },
  {
    title: 'Exports',
    items: [
      { id: 'exports', title: 'Export Formats', icon: Upload, description: 'SVG, PNG, JSON, TS' },
    ]
  }
]

// Section type for table of contents
export interface DocSection {
  id: string
  title: string
  level: 2 | 3
}

// Left sidebar navigation
function DocsSidebar({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
  isDark
}: {
  isOpen: boolean
  onClose: () => void
  currentPage: string
  onNavigate: (page: string) => void
  isDark: boolean
}) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-14 left-0 bottom-0 w-72 z-50
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:z-30
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: isDark ? '#0f1214' : 'rgba(247, 243, 236, 0.95)',
          borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16, 21, 24, 0.1)'}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="p-6 overflow-y-auto h-full">
          {/* Back to docs index */}
          <button
            onClick={() => onNavigate('index')}
            className="flex items-center gap-2 text-sm font-medium mb-6 transition-colors"
            style={{ color: isDark ? '#9ca3af' : '#5c676c' }}
          >
            <Book className="w-4 h-4" />
            Documentation
          </button>

          {/* Navigation groups */}
          <nav className="space-y-8">
            {docsNav.map((group) => (
              <div key={group.title}>
                <h3
                  className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-3"
                  style={{ color: isDark ? '#6b7280' : '#5c676c' }}
                >
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = currentPage === item.id
                    const Icon = item.icon
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            onNavigate(item.id)
                            onClose()
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left"
                          style={{
                            background: isActive
                              ? isDark ? 'rgba(240, 124, 79, 0.15)' : 'rgba(240, 124, 79, 0.1)'
                              : 'transparent',
                            color: isActive
                              ? '#f07c4f'
                              : isDark ? '#9ca3af' : '#2e3538',
                            fontWeight: isActive ? 600 : 400,
                          }}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span>{item.title}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}

// Right sidebar table of contents (minimap)
function TableOfContents({ sections, isDark }: { sections: DocSection[], isDark: boolean }) {
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-100px 0px -66% 0px' }
    )

    sections.forEach((section) => {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  if (!sections || sections.length === 0) return null

  return (
    <aside
      className="hidden xl:block fixed top-14 right-0 w-56 h-[calc(100vh-56px)] overflow-y-auto"
      style={{
        background: isDark ? 'rgba(15, 18, 20, 0.8)' : 'rgba(247, 243, 236, 0.8)',
        borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16, 21, 24, 0.08)'}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="p-5">
        <h4
          className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4"
          style={{ color: isDark ? '#6b7280' : '#5c676c' }}
        >
          On this page
        </h4>
        <nav>
          <ul className="space-y-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block text-[13px] transition-colors leading-snug"
                  style={{
                    paddingLeft: section.level === 3 ? '12px' : '0',
                    color: activeSection === section.id
                      ? '#f07c4f'
                      : isDark ? '#9ca3af' : '#5c676c',
                    fontWeight: activeSection === section.id ? 500 : 400,
                  }}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}

// Main layout wrapper
interface DocsLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  badge?: string
  badgeColor?: string
  sections?: DocSection[]
  currentPage: string
  onNavigate: (page: string) => void
  onBack: () => void
  markdown?: string
  ogImage?: string
}

export default function DocsLayout({
  children,
  title,
  description,
  badge,
  badgeColor = 'accent',
  sections = [],
  currentPage,
  onNavigate,
  onBack,
  markdown,
  ogImage,
}: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [copied, setCopied] = useState<'markdown' | 'agent' | null>(null)
  const [copyMenuOpen, setCopyMenuOpen] = useState(false)

  // Set page-specific meta tags
  useMeta({
    title: title ? `${title} | Arc Docs` : 'Arc Documentation',
    description: description,
    image: ogImage || '/og-docs.png',
    url: `/docs/${currentPage}`,
  })

  const handleCopyMarkdown = async () => {
    if (markdown) {
      await navigator.clipboard.writeText(markdown)
      setCopied('markdown')
      setCopyMenuOpen(false)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const handleCopyForAgent = async () => {
    // Create an LLM-friendly version with context
    const agentContent = `# ${title}\n\n${description || ''}\n\n${markdown || ''}`
    await navigator.clipboard.writeText(agentContent)
    setCopied('agent')
    setCopyMenuOpen(false)
    setTimeout(() => setCopied(null), 2000)
  }

  // Badge colors matching the landing page palette
  const badgeStyles: Record<string, { bg: string, border: string, text: string }> = {
    accent: { bg: 'rgba(240, 124, 79, 0.1)', border: 'rgba(240, 124, 79, 0.3)', text: '#f07c4f' },
    teal: { bg: 'rgba(31, 122, 101, 0.1)', border: 'rgba(31, 122, 101, 0.3)', text: '#1f7a65' },
    blue: { bg: 'rgba(46, 95, 165, 0.1)', border: 'rgba(46, 95, 165, 0.3)', text: '#2e5fa5' },
    gold: { bg: 'rgba(208, 156, 54, 0.1)', border: 'rgba(208, 156, 54, 0.3)', text: '#d09c36' },
  }

  const currentBadge = badgeStyles[badgeColor] || badgeStyles.accent

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
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 -ml-2 transition-colors"
              style={{ color: isDark ? '#9ca3af' : '#5c676c' }}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

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
              className="hidden sm:block w-px h-4"
              style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(16, 21, 24, 0.15)' }}
            />

            {/* Back button */}
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors group"
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

      {/* Left sidebar */}
      <DocsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        onNavigate={onNavigate}
        isDark={isDark}
      />

      {/* Right table of contents */}
      <TableOfContents sections={sections} isDark={isDark} />

      {/* Main content */}
      <main className="pt-14 lg:pl-72 xl:pr-56">
        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* Page header with controls */}
          <div className="flex items-start justify-between mb-10">
            <div className="flex-1">
              {badge && (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4 text-xs font-semibold uppercase tracking-wider"
                  style={{
                    background: currentBadge.bg,
                    borderColor: currentBadge.border,
                    color: currentBadge.text,
                  }}
                >
                  {badge}
                </div>
              )}

              {title && (
                <h1
                  className="text-3xl md:text-4xl font-semibold tracking-tight mb-4"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    color: isDark ? '#f3f4f6' : '#101518',
                  }}
                >
                  {title}
                </h1>
              )}

              {description && (
                <p
                  className="text-lg leading-relaxed"
                  style={{ color: isDark ? '#9ca3af' : '#5c676c' }}
                >
                  {description}
                </p>
              )}
            </div>

            {/* Page controls - Agent and Copy dropdown */}
            <div className="flex items-center gap-2 ml-4 mt-2">
              {/* Agent button */}
              <button
                onClick={() => onNavigate('llm')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  color: isDark ? '#9ca3af' : '#5c676c',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16, 21, 24, 0.12)'}`,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                }}
                title="View agent-friendly documentation"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Agent</span>
              </button>

              {/* Copy dropdown */}
              <div className="relative">
                <button
                  onClick={() => setCopyMenuOpen(!copyMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    color: isDark ? '#9ca3af' : '#5c676c',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16, 21, 24, 0.12)'}`,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                  }}
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
                      <ChevronRight className="w-3 h-3 rotate-90" />
                    </>
                  )}
                </button>

                {/* Dropdown menu */}
                {copyMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setCopyMenuOpen(false)}
                    />
                    <div
                      className="absolute right-0 mt-1 w-44 rounded-lg shadow-lg z-50 py-1 overflow-hidden"
                      style={{
                        background: isDark ? '#1a1d20' : '#ffffff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16, 21, 24, 0.12)'}`,
                      }}
                    >
                      <button
                        onClick={handleCopyMarkdown}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
                        style={{
                          color: isDark ? '#d1d5db' : '#2e3538',
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" style={{ color: isDark ? '#6b7280' : '#5c676c' }} />
                        Copy Markdown
                      </button>
                      <button
                        onClick={handleCopyForAgent}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
                        style={{
                          color: isDark ? '#d1d5db' : '#2e3538',
                        }}
                      >
                        <Bot className="w-3.5 h-3.5" style={{ color: isDark ? '#6b7280' : '#5c676c' }} />
                        Copy for Agent
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Page content with prose styling */}
          <div
            className="docs-prose"
            style={{
              '--prose-heading': isDark ? '#f3f4f6' : '#101518',
              '--prose-body': isDark ? '#d1d5db' : '#2e3538',
              '--prose-muted': isDark ? '#9ca3af' : '#5c676c',
              '--prose-link': '#f07c4f',
              '--prose-code-bg': isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16, 21, 24, 0.06)',
              '--prose-border': isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16, 21, 24, 0.1)',
            } as React.CSSProperties}
          >
            {children}
          </div>
        </div>
      </main>

      {/* Prose styles */}
      <style>{`
        .docs-prose {
          font-size: 15px;
          line-height: 1.75;
          color: var(--prose-body);
        }

        .docs-prose h2 {
          font-family: 'Fraunces', serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--prose-heading);
          margin: 3rem 0 1.25rem;
          padding-top: 2rem;
          border-top: 1px solid var(--prose-border);
          scroll-margin-top: 100px;
        }

        .docs-prose h2:first-child {
          margin-top: 0;
          padding-top: 0;
          border-top: none;
        }

        .docs-prose h3 {
          font-family: 'Fraunces', serif;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--prose-heading);
          margin: 2rem 0 1rem;
          scroll-margin-top: 100px;
        }

        .docs-prose p {
          margin: 0 0 1.25rem;
        }

        .docs-prose a {
          color: var(--prose-link);
          text-decoration: none;
          font-weight: 500;
        }

        .docs-prose a:hover {
          text-decoration: underline;
        }

        .docs-prose strong {
          font-weight: 600;
          color: var(--prose-heading);
        }

        .docs-prose code {
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
          font-size: 13px;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--prose-code-bg);
          color: var(--prose-heading);
        }

        .docs-prose pre {
          margin: 0;
          padding: 0;
          background: transparent;
        }

        .docs-prose pre code {
          padding: 0;
          background: transparent;
        }

        .docs-prose ul, .docs-prose ol {
          margin: 1.25rem 0;
          padding-left: 1.5rem;
        }

        .docs-prose li {
          margin: 0.5rem 0;
        }

        .docs-prose li::marker {
          color: var(--prose-muted);
        }

        .docs-prose hr {
          border: none;
          border-top: 1px solid var(--prose-border);
          margin: 3rem 0;
        }

        /* Not-prose class for opting out */
        .docs-prose .not-prose {
          all: revert;
        }
      `}</style>
    </div>
  )
}
