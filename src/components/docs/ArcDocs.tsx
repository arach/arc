import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Book, Menu, Bot, Download, Sparkles } from 'lucide-react'
import {
  DeweyProvider,
  Header,
  DocsIndex,
  Sidebar,
  MarkdownContent,
  CopyButtons,
  PromptSlideout,
  extractTocItems,
  type PageNode,
  type PromptMessage,
} from '@arach/dewey'

// Import Dewey CSS directly from source (linked package)
import '../../../ext/dewey/packages/docs/src/css/colors/warm.css'
import '../../../ext/dewey/packages/docs/src/css/base.css'

// Import human-readable markdown files
import overviewMd from '../../../docs/overview.md?raw'
import quickstartMd from '../../../docs/quickstart.md?raw'
import apiMd from '../../../docs/api.md?raw'
import examplesMd from '../../../docs/examples.md?raw'
import architectureMd from '../../../docs/architecture.md?raw'
import agentsMd from '../../../docs/AGENTS.md?raw'

// Import agent-optimized markdown files
import overviewAgentMd from '../../../docs/agent/overview.agent.md?raw'
import quickstartAgentMd from '../../../docs/agent/quickstart.agent.md?raw'
import apiAgentMd from '../../../docs/agent/api.agent.md?raw'
import architectureAgentMd from '../../../docs/agent/architecture.agent.md?raw'

// Import prompt templates
import createDiagramPrompt from '../../../docs/prompts/create-diagram.md?raw'
import addNodePrompt from '../../../docs/prompts/add-node.md?raw'
import modifyStylingPrompt from '../../../docs/prompts/modify-styling.md?raw'
import exportDiagramPrompt from '../../../docs/prompts/export-diagram.md?raw'
import debugEditorPrompt from '../../../docs/prompts/debug-editor.md?raw'

// Import combined llm.txt for full context
import llmTxt from '../../../docs/llm.txt?raw'

// Strip frontmatter
function stripFrontmatter(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n/)
  return match ? content.slice(match[0].length) : content
}

// Replace {BASE_URL} with current origin
function withBaseUrl(content: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return content.replace(/\{BASE_URL\}/g, origin)
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
    name: 'Agents',
    children: [
      { type: 'page', id: 'agents', name: 'AI Agents', icon: 'Bot', description: 'LLM-optimized docs' },
      { type: 'page', id: 'skills', name: 'Skills', icon: 'Sparkles', description: 'Pre-built agent skills' },
    ],
  },
]

// Prompt configuration for slideout
interface PromptConfig {
  title: string
  description: string
  messages: PromptMessage[]
  variables?: { name: string; description: string; example?: string }[]
}

// Page content map with human, agent, and prompt content
interface PageData {
  content: string
  agentContent?: string
  prompt?: PromptConfig
  title: string
  description: string
  badge?: string
}

const pages: Record<string, PageData> = {
  overview: {
    content: stripFrontmatter(overviewMd),
    agentContent: stripFrontmatter(overviewAgentMd),
    prompt: {
      title: 'Create an Arc Diagram',
      description: 'Generate architecture diagrams from descriptions',
      messages: [
        {
          role: 'user',
          content: `Create an Arc diagram for {SYSTEM_DESCRIPTION}.

It should show: {KEY_COMPONENTS}

Output valid Arc JSON with layout, nodes, nodeData, and connectors.

---
*Full Arc reference: {BASE_URL}/llm.txt*`,
        },
      ],
      variables: [
        { name: 'SYSTEM_DESCRIPTION', description: 'What you\'re diagramming', example: 'a user authentication flow' },
        { name: 'KEY_COMPONENTS', description: 'The main pieces and how they connect', example: 'Client, API Gateway, Auth Service, Database' },
      ],
    },
    title: 'Overview',
    description: 'Arc is a visual diagram editor for creating architecture diagrams that are readable, versionable, and ready for docs.',
    badge: 'Introduction',
  },
  quickstart: {
    content: stripFrontmatter(quickstartMd),
    agentContent: stripFrontmatter(quickstartAgentMd),
    prompt: {
      title: 'Set Up Arc',
      description: 'Add Arc to your project',
      messages: [
        {
          role: 'user',
          content: `Help me add Arc to my {PROJECT_TYPE} project.

I want to create a diagram showing {WHAT_TO_DIAGRAM}.

Walk me through installation, creating the config, and rendering it.

---
*Arc package: \`npm install @arach/arc\`*
*Full docs: {BASE_URL}/llm.txt*`,
        },
      ],
      variables: [
        { name: 'PROJECT_TYPE', description: 'Your setup', example: 'Next.js app' },
        { name: 'WHAT_TO_DIAGRAM', description: 'What to visualize', example: 'my API architecture' },
      ],
    },
    title: 'Quickstart',
    description: 'Create your first Arc diagram in under 5 minutes.',
    badge: 'Getting Started',
  },
  'diagram-format': {
    content: stripFrontmatter(apiMd),
    agentContent: stripFrontmatter(apiAgentMd),
    prompt: {
      title: 'Work with Diagram Configs',
      description: 'Modify, debug, or understand Arc JSON',
      messages: [
        {
          role: 'user',
          content: `I have an Arc diagram config I need help with:

\`\`\`json
{PASTE_CONFIG}
\`\`\`

{WHAT_YOU_NEED}

---
*Arc config reference:*
- *size: s, m, l*
- *colors: violet, emerald, blue, amber, sky, zinc, rose, orange*
- *anchors: left, right, top, bottom, topLeft, topRight, bottomLeft, bottomRight*
- *Full docs: {BASE_URL}/llm.txt*`,
        },
      ],
      variables: [
        { name: 'PASTE_CONFIG', description: 'Your diagram JSON (or describe what you want to create)' },
        { name: 'WHAT_YOU_NEED', description: 'Add a node, change styling, explain structure, debug an issue, etc.' },
      ],
    },
    title: 'Diagram Format',
    description: 'Data structure & schema for Arc diagrams.',
    badge: 'Reference',
  },
  architecture: {
    content: stripFrontmatter(architectureMd),
    agentContent: stripFrontmatter(architectureAgentMd),
    prompt: {
      title: 'Arc Editor Development',
      description: 'Understand or extend the Arc editor codebase',
      messages: [
        {
          role: 'user',
          content: `I'm working on the Arc editor codebase and need help with: {WHAT_YOU_NEED}

Key files for reference:
- \`EditorProvider.jsx\` + \`editorReducer.js\` — State management (useReducer + Context)
- \`DiagramCanvas.jsx\` — Main canvas with drag-and-drop
- \`EditableNode.jsx\` — Individual node components
- \`ConnectorLayer.jsx\` — SVG connection lines
- \`PropertiesPanel.jsx\` — Right sidebar for editing selected items

Editor modes: select (default), addNode, addConnector

---
*For full codebase context, see the project's CLAUDE.md*
*Arc config format: {BASE_URL}/llm.txt*`,
        },
      ],
      variables: [
        { name: 'WHAT_YOU_NEED', description: 'Feature to add, bug to fix, or concept to understand' },
      ],
    },
    title: 'Architecture',
    description: 'How the Arc editor is built.',
    badge: 'Core Concepts',
  },
  templates: {
    content: stripFrontmatter(examplesMd),
    agentContent: stripFrontmatter(apiAgentMd),
    prompt: {
      title: 'Restyle My Diagram',
      description: 'Change structure and appearance',
      messages: [
        {
          role: 'user',
          content: `Update the styling of this Arc diagram:

\`\`\`json
{PASTE_CONFIG}
\`\`\`

I want: {STYLE_CHANGES}

---
*Colors: violet, emerald, blue, amber, sky, zinc, rose, orange*
*Full reference: {BASE_URL}/llm.txt*`,
        },
      ],
      variables: [
        { name: 'PASTE_CONFIG', description: 'Your diagram JSON' },
        { name: 'STYLE_CHANGES', description: 'What to change', example: 'warm colors, larger nodes, dashed connectors' },
      ],
    },
    title: 'Templates',
    description: 'Structural presets that define box shapes, line styles, and layout behaviors.',
    badge: 'Styling',
  },
  themes: {
    content: stripFrontmatter(examplesMd),
    agentContent: stripFrontmatter(apiAgentMd),
    prompt: {
      title: 'Change Color Palette',
      description: 'Apply a new color scheme',
      messages: [
        {
          role: 'user',
          content: `Change the colors in this Arc diagram to use a {COLOR_SCHEME} palette:

\`\`\`json
{PASTE_CONFIG}
\`\`\`

---
*Available colors: violet, emerald, blue, amber, sky, zinc, rose, orange*`,
        },
      ],
      variables: [
        { name: 'COLOR_SCHEME', description: 'The look you want', example: 'warm (orange/amber/rose)' },
        { name: 'PASTE_CONFIG', description: 'Your diagram JSON' },
      ],
    },
    title: 'Themes',
    description: 'Color palettes that can be applied to any template.',
    badge: 'Styling',
  },
  agents: {
    content: stripFrontmatter(agentsMd),
    agentContent: llmTxt,
    prompt: {
      title: 'Brief Your AI Agent',
      description: 'Give your agent full Arc context',
      messages: [
        {
          role: 'user',
          content: `I need help with Arc, a diagram editor that outputs JSON configs.

{WHAT_YOU_NEED}

---
*Load full Arc context from: {BASE_URL}/llm.txt*
*Or use the Arc skill if available in your environment*`,
        },
      ],
      variables: [
        { name: 'WHAT_YOU_NEED', description: 'What you\'re trying to accomplish with Arc' },
      ],
    },
    title: 'AI Agents',
    description: 'LLM-optimized documentation for AI coding assistants.',
    badge: 'Agents',
  },
  skills: {
    content: stripFrontmatter(agentsMd),
    agentContent: llmTxt,
    prompt: {
      title: 'Use Arc Skill',
      description: 'Pre-built skill for AI assistants',
      messages: [
        {
          role: 'user',
          content: `Use the Arc skill to help me {TASK}.

If the Arc skill isn't available, load context from: {BASE_URL}/llm.txt

{ADDITIONAL_DETAILS}`,
        },
      ],
      variables: [
        { name: 'TASK', description: 'What you want to do', example: 'create a microservices diagram' },
        { name: 'ADDITIONAL_DETAILS', description: 'Requirements, existing config, or constraints' },
      ],
    },
    title: 'Skills',
    description: 'Pre-built skills and prompts for AI assistants.',
    badge: 'Agents',
  },
}

// React Router Link adapter for Dewey
function RouterLink({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link to={href} {...props}>{children}</Link>
}

// ============================================
// Doc Page Component
// ============================================
function DocPage({ pageId }: { pageId: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const page = pages[pageId] || pages.overview
  const tocItems = extractTocItems(page.content)

  const handleDownloadLLM = () => {
    const blob = new Blob([llmTxt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'arc-llm.txt'
    a.click()
    URL.revokeObjectURL(url)
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

            {/* Page controls - now using CopyButtons */}
            <div className="flex items-center gap-2 ml-4 mt-2">
              <CopyButtons
                markdownContent={page.content}
                agentContent={page.agentContent}
              />
              {page.prompt && (
                <button
                  onClick={() => setPromptOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    color: '#5c676c',
                    border: '1px solid rgba(16, 21, 24, 0.12)',
                    background: 'rgba(255,255,255,0.5)',
                  }}
                  title="Open AI prompt template"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Prompt</span>
                </button>
              )}
            </div>
          </div>

          {/* Agent quick action for agents page */}
          {(pageId === 'agents' || pageId === 'skills') && (
            <div
              className="mb-8 p-4 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(240, 124, 79, 0.08) 0%, rgba(240, 124, 79, 0.02) 100%)',
                border: '1px solid rgba(240, 124, 79, 0.2)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5" style={{ color: '#f07c4f' }} />
                  <div>
                    <div className="font-medium" style={{ color: '#101518' }}>
                      Download Complete Context
                    </div>
                    <div className="text-sm" style={{ color: '#5c676c' }}>
                      Get llm.txt with everything your AI assistant needs
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDownloadLLM}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm"
                  style={{
                    background: '#f07c4f',
                    color: 'white',
                  }}
                >
                  <Download className="w-4 h-4" />
                  llm.txt
                </button>
              </div>
            </div>
          )}

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

      {/* Prompt Slideout */}
      {page.prompt && (
        <PromptSlideout
          isOpen={promptOpen}
          onClose={() => setPromptOpen(false)}
          title={page.prompt.title}
          description={page.prompt.description}
          prompt={page.prompt.messages.map(m => ({ ...m, content: withBaseUrl(m.content) }))}
          variables={page.prompt.variables}
        />
      )}
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
          <DocPage pageId={pageId} />
        )}
      </div>
    </DeweyProvider>
  )
}
