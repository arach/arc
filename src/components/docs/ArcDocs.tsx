import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Book, Bot, Menu, Copy, Check } from 'lucide-react'
import {
  DeweyProvider,
  Header,
  DocsIndex,
  Sidebar,
  MarkdownContent,
  extractTocItems,
  type PageNode,
} from '@arach/dewey'

// Import Dewey CSS directly from source (linked package)
import '../../../ext/dewey/packages/docs/src/css/colors/warm.css'
import '../../../ext/dewey/packages/docs/src/css/base.css'

// Import markdown files
import overviewMd from '../../../docs/overview.md?raw'
import quickstartMd from '../../../docs/quickstart.md?raw'
import apiMd from '../../../docs/api.md?raw'
import examplesMd from '../../../docs/examples.md?raw'
import architectureMd from '../../../docs/architecture.md?raw'
import agentsMd from '../../../docs/AGENTS.md?raw'

// Strip frontmatter
function stripFrontmatter(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n/)
  return match ? content.slice(match[0].length) : content
}

// Page tree - exact match to production docsNav
const pageTree: PageNode[] = [
  {
    type: 'folder',
    name: 'Getting Started',
    children: [
      { type: 'page', id: 'overview', name: 'Overview', icon: 'Lightbulb', description: 'Introduction to Arc' },
      { type: 'page', id: 'quickstart', name: 'Quickstart', icon: 'ChevronRight', description: 'Get up and running' },
    ],
  },
  {
    type: 'folder',
    name: 'Core Concepts',
    children: [
      { type: 'page', id: 'diagram-format', name: 'Diagram Format', icon: 'FileCode', description: 'Data structure & schema' },
      { type: 'page', id: 'architecture', name: 'Architecture', icon: 'Boxes', description: 'Templates & themes' },
    ],
  },
  {
    type: 'folder',
    name: 'Styling',
    children: [
      { type: 'page', id: 'templates', name: 'Templates', icon: 'Layers', description: 'Structural styling' },
      { type: 'page', id: 'themes', name: 'Themes', icon: 'Palette', description: 'Color palettes' },
    ],
  },
  {
    type: 'folder',
    name: 'Exports',
    children: [
      { type: 'page', id: 'exports', name: 'Export Formats', icon: 'Upload', description: 'SVG, PNG, JSON, TS' },
    ],
  },
]

// Page content map with badges matching production
const pages: Record<string, { content: string; title: string; description: string; badge?: string }> = {
  overview: { content: stripFrontmatter(overviewMd), title: 'Overview', description: 'Arc is a visual diagram editor for creating architecture diagrams that are readable, versionable, and ready for docs.', badge: 'Introduction' },
  quickstart: { content: stripFrontmatter(quickstartMd), title: 'Quickstart', description: 'Get up and running with Arc in minutes.', badge: 'Getting Started' },
  'diagram-format': { content: stripFrontmatter(apiMd), title: 'Diagram Format', description: 'Data structure & schema for Arc diagrams.', badge: 'Reference' },
  architecture: { content: stripFrontmatter(architectureMd), title: 'Architecture', description: 'Templates & themes system architecture.', badge: 'Core Concepts' },
  templates: { content: stripFrontmatter(examplesMd), title: 'Templates', description: 'Structural presets that define box shapes, line styles, and layout behaviors.', badge: 'Styling' },
  themes: { content: stripFrontmatter(examplesMd), title: 'Themes', description: 'Color palettes that can be applied to any template.', badge: 'Styling' },
  exports: { content: stripFrontmatter(agentsMd), title: 'Export Formats', description: 'SVG, PNG, JSON, and TypeScript export options.', badge: 'Exports' },
}

// React Router Link adapter for Dewey
function RouterLink({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link to={href} {...props}>{children}</Link>
}

// ============================================
// Doc Page Component
// ============================================
function DocPage({ pageId, onNavigate }: { pageId: string; onNavigate: (id: string) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const page = pages[pageId] || pages.overview
  const tocItems = extractTocItems(page.content)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(page.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="dw-layout" style={{ marginTop: '56px' }}>
      {/* Sidebar */}
      <Sidebar
        tree={pageTree}
        projectName="Documentation"
        currentPage={pageId}
        basePath="/docs"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <main className="dw-main">
        <div className="dw-content">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mb-4 flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-dw-muted-foreground)' }}
          >
            <Menu className="w-4 h-4" /> Menu
          </button>

          {/* Page header - matching production layout */}
          <div className="flex items-start justify-between mb-8">
            <div>
              {/* Badge */}
              {page.badge && (
                <div
                  className="inline-flex items-center px-3 py-1.5 rounded-full border mb-4 text-xs font-semibold uppercase"
                  style={{
                    background: 'rgba(240, 124, 79, 0.1)',
                    borderColor: 'rgba(240, 124, 79, 0.3)',
                    color: '#f07c4f',
                    letterSpacing: '0.05em',
                  }}
                >
                  {page.badge}
                </div>
              )}
              {/* Title */}
              <h1
                className="text-3xl md:text-4xl font-semibold tracking-tight mb-4"
                style={{ fontFamily: "'Fraunces', serif", color: '#101518' }}
              >
                {page.title}
              </h1>
              {/* Description */}
              <p className="text-lg leading-relaxed" style={{ color: '#5c676c' }}>
                {page.description}
              </p>
            </div>

            {/* Page controls */}
            <div className="flex items-center gap-2 ml-4 mt-2">
              <button
                onClick={() => onNavigate('exports')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  color: '#5c676c',
                  border: '1px solid rgba(16, 21, 24, 0.12)',
                  background: 'rgba(255,255,255,0.5)',
                }}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Agent</span>
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  color: '#5c676c',
                  border: '1px solid rgba(16, 21, 24, 0.12)',
                  background: 'rgba(255,255,255,0.5)',
                }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Markdown content */}
          <div className="dw-prose">
            <MarkdownContent content={page.content} />
          </div>
        </div>
      </main>

      {/* Table of Contents */}
      <aside className="dw-toc hidden xl:block">
        <h4 className="dw-toc-title">ON THIS PAGE</h4>
        <nav>
          <ul className="dw-toc-list">
            {tocItems.map((item, index) => (
              <li key={item.id} className="dw-toc-item">
                <a
                  href={`#${item.id}`}
                  className={`dw-toc-link ${index === 0 ? 'active' : ''}`}
                  data-level={item.level}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  )
}

// ============================================
// Main Component
// ============================================
interface ArcDocsProps {
  pageId: string
}

export default function ArcDocs({ pageId }: ArcDocsProps) {
  const navigate = useNavigate()

  const handleNavigate = (id: string) => {
    if (id === 'index') {
      navigate('/docs')
    } else {
      navigate(`/docs/${id}`)
    }
  }

  return (
    <DeweyProvider
      components={{ Link: RouterLink }}
      theme="warm"
    >
      <div className="dw-layout" style={{ flexDirection: 'column' }}>
        <Header
          projectName="Arc"
          homeUrl="/docs"
          backUrl="/"
          backLabel="Back"
          label="DOCS"
        />

        {pageId === 'index' ? (
          <DocsIndex
            tree={pageTree}
            projectName="Arc Documentation"
            tagline="Everything you need to create beautiful architecture diagrams"
            description="Arc is a visual diagram editor that outputs clean, declarative configs. Design systems once, export everywhere—docs, decks, and code."
            basePath="/docs"
            heroIcon={Book}
            layout="columns"
            quickLinks={[
              { label: 'Back to Arc', href: '/' },
              { label: 'Open Editor', href: '/editor', primary: true },
            ]}
          />
        ) : (
          <DocPage pageId={pageId} onNavigate={handleNavigate} />
        )}
      </div>
    </DeweyProvider>
  )
}
