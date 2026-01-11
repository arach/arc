"use client"
import React, { useState, useEffect } from 'react'
import {
  ArrowLeft, Book, Lightbulb, Boxes, FileCode, Palette,
  Layers, Upload, Menu, X, ChevronRight, Sun, Moon
} from 'lucide-react'

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
      <aside className={`
        fixed top-14 left-0 bottom-0 w-72
        ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}
        border-r overflow-y-auto z-50
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:z-30
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          {/* Back to docs index */}
          <button
            onClick={() => onNavigate('index')}
            className={`flex items-center gap-2 text-sm font-medium mb-6 ${
              isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Book className="w-4 h-4" />
            Documentation
          </button>

          {/* Navigation groups */}
          <nav className="space-y-8">
            {docsNav.map((group) => (
              <div key={group.title}>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                  isDark ? 'text-zinc-500' : 'text-zinc-400'
                }`}>
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
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left
                            ${isActive
                              ? isDark
                                ? 'bg-violet-500/20 text-violet-400 font-medium'
                                : 'bg-violet-50 text-violet-700 font-medium'
                              : isDark
                                ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                            }
                          `}
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
    <aside className={`hidden xl:block fixed top-14 right-0 w-64 h-[calc(100vh-3.5rem)] overflow-y-auto border-l ${
      isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'
    }`}>
      <div className="p-6">
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${
          isDark ? 'text-zinc-500' : 'text-zinc-400'
        }`}>
          On this page
        </h4>
        <nav>
          <ul className="space-y-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={`
                    block text-sm transition-colors
                    ${section.level === 3 ? 'pl-3' : 'pl-0'}
                    ${activeSection === section.id
                      ? 'text-violet-500 font-medium'
                      : isDark
                        ? 'text-zinc-500 hover:text-zinc-300'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }
                  `}
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

// Badge color definitions
const badgeColorsLight: Record<string, string> = {
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
}

const badgeColorsDark: Record<string, string> = {
  violet: 'border-violet-500/30 bg-violet-500/20 text-violet-400',
  emerald: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400',
  blue: 'border-blue-500/30 bg-blue-500/20 text-blue-400',
  amber: 'border-amber-500/30 bg-amber-500/20 text-amber-400',
  rose: 'border-rose-500/30 bg-rose-500/20 text-rose-400',
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
}

export default function DocsLayout({
  children,
  title,
  description,
  badge,
  badgeColor = 'violet',
  sections = [],
  currentPage,
  onNavigate,
  onBack,
}: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  return (
    <div className={`min-h-screen ${isDark ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
      {/* Top navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-md border-b ${
        isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-zinc-200'
      }`}>
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`lg:hidden p-2 -ml-2 ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              onClick={onBack}
              className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-colors group ${
                isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'
              }`}
            >
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">ARC</span>
            </button>
          </div>

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
      <main className="pt-14 lg:pl-72 xl:pr-64">
        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* Page header */}
          {badge && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 ${
              isDark ? badgeColorsDark[badgeColor] : badgeColorsLight[badgeColor]
            }`}>
              <span className="text-xs font-medium">{badge}</span>
            </div>
          )}

          {title && (
            <h1 className={`text-3xl md:text-4xl font-semibold tracking-tight mb-4 ${
              isDark ? 'text-zinc-100' : 'text-zinc-900'
            }`}>
              {title}
            </h1>
          )}

          {description && (
            <p className={`text-lg mb-12 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {description}
            </p>
          )}

          {/* Page content */}
          <div className={`prose max-w-none
            prose-headings:scroll-mt-20
            prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-12 prose-h2:mb-4 prose-h2:tracking-tight
            prose-h3:text-xl prose-h3:font-medium prose-h3:mt-8 prose-h3:mb-3
            prose-p:leading-relaxed
            prose-a:no-underline hover:prose-a:underline
            prose-strong:font-semibold
            prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
            prose-pre:border
            prose-li:leading-relaxed
            ${isDark
              ? 'prose-invert prose-zinc prose-p:text-zinc-400 prose-a:text-violet-400 prose-strong:text-zinc-200 prose-code:bg-zinc-800 prose-pre:bg-zinc-900 prose-pre:border-zinc-800 prose-li:marker:text-zinc-600 prose-ul:text-zinc-400 prose-h2:text-zinc-100 prose-h3:text-zinc-200'
              : 'prose-zinc prose-p:text-zinc-600 prose-a:text-violet-600 prose-strong:text-zinc-800 prose-code:bg-zinc-100 prose-pre:bg-zinc-900 prose-pre:border-zinc-800 prose-li:marker:text-zinc-400 prose-ul:text-zinc-600'
            }
          `}>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
