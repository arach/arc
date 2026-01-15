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
      title: 'Create a Diagram',
      description: 'Generate a new Arc architecture diagram',
      messages: [
        {
          role: 'user',
          content: `Create an Arc diagram for [SYSTEM_DESCRIPTION].

The diagram should include:
- [COMPONENT_1]: [DESCRIPTION]
- [COMPONENT_2]: [DESCRIPTION]
- [COMPONENT_3]: [DESCRIPTION]

Connections:
- [COMPONENT_1] → [COMPONENT_2]: [LABEL]
- [COMPONENT_2] → [COMPONENT_3]: [LABEL]

Use the Arc JSON format with layout, nodes, nodeData, connectors, and connectorStyles.`,
        },
      ],
      variables: [
        { name: 'SYSTEM_DESCRIPTION', description: 'What system to diagram', example: 'a user authentication flow' },
        { name: 'COMPONENT_1', description: 'First component name', example: 'Web Client' },
        { name: 'LABEL', description: 'Connection label', example: 'REST API' },
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
      description: 'Get help setting up Arc in your project',
      messages: [
        {
          role: 'user',
          content: `Help me set up Arc in my [PROJECT_TYPE] project.

I want to:
- Install the Arc package
- Create my first diagram showing [SYSTEM_DESCRIPTION]
- Render it in [FRAMEWORK]

Guide me through the setup step by step.`,
        },
      ],
      variables: [
        { name: 'PROJECT_TYPE', description: 'Type of project', example: 'React' },
        { name: 'SYSTEM_DESCRIPTION', description: 'What to diagram', example: 'my API architecture' },
        { name: 'FRAMEWORK', description: 'UI framework', example: 'Next.js' },
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
      title: 'Add a Node',
      description: 'Add a new component to your diagram',
      messages: [
        {
          role: 'system',
          content: `Arc diagram format reference:
- Sizes: 's' | 'm' | 'l'
- Colors: violet | emerald | blue | amber | sky | zinc | rose | orange
- Anchors: left | right | top | bottom | topLeft | topRight | bottomLeft | bottomRight
- Icons: Any Lucide icon (Server, Database, Monitor, Cloud, etc.)`,
        },
        {
          role: 'user',
          content: `Add a new node to this Arc diagram:

[PASTE_DIAGRAM_CONFIG]

New node:
- Name: [NODE_NAME]
- Icon: [ICON_NAME]
- Color: [COLOR]
- Position: [POSITION_DESCRIPTION]
- Connect to: [TARGET_NODE] via [CONNECTION_LABEL]`,
        },
      ],
      variables: [
        { name: 'PASTE_DIAGRAM_CONFIG', description: 'Your existing diagram JSON' },
        { name: 'NODE_NAME', description: 'Display name for the node', example: 'Cache Layer' },
        { name: 'ICON_NAME', description: 'Lucide icon name', example: 'Database' },
        { name: 'COLOR', description: 'Node color', example: 'amber' },
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
      title: 'Debug Arc Editor',
      description: 'Get help troubleshooting the Arc editor',
      messages: [
        {
          role: 'system',
          content: `Arc Editor key files:
- State: src/components/editor/EditorProvider.jsx + editorReducer.js
- Canvas: src/components/editor/DiagramCanvas.jsx
- Nodes: src/components/editor/EditableNode.jsx
- Connectors: src/components/editor/ConnectorLayer.jsx
- Icons: src/utils/iconRegistry.js
- Constants: src/utils/constants.js`,
        },
        {
          role: 'user',
          content: `Debug this issue in the Arc editor:

Issue: [DESCRIBE_PROBLEM]
Expected: [EXPECTED_BEHAVIOR]
Actual: [ACTUAL_BEHAVIOR]

What's happening and how do I fix it?`,
        },
      ],
      variables: [
        { name: 'DESCRIBE_PROBLEM', description: 'What went wrong', example: 'Nodes won\'t drag' },
        { name: 'EXPECTED_BEHAVIOR', description: 'What should happen', example: 'Node moves with cursor' },
        { name: 'ACTUAL_BEHAVIOR', description: 'What actually happens', example: 'Node stays in place' },
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
      title: 'Modify Styling',
      description: 'Change the appearance of your diagram',
      messages: [
        {
          role: 'user',
          content: `Update the styling of this Arc diagram:

[PASTE_DIAGRAM_CONFIG]

Changes I want:
- [CHANGE_1]
- [CHANGE_2]

Apply these changes and return the updated config.`,
        },
      ],
      variables: [
        { name: 'PASTE_DIAGRAM_CONFIG', description: 'Your existing diagram JSON' },
        { name: 'CHANGE_1', description: 'First style change', example: 'Make all connectors dashed' },
        { name: 'CHANGE_2', description: 'Second style change', example: 'Change theme to dark mode' },
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
      title: 'Change Theme',
      description: 'Switch color palettes for your diagram',
      messages: [
        {
          role: 'user',
          content: `Change the theme of my Arc diagram to [THEME_NAME].

Current config:
[PASTE_DIAGRAM_CONFIG]

Available themes: default, warm, cool, mono

Update the colors to match the [THEME_NAME] palette.`,
        },
      ],
      variables: [
        { name: 'THEME_NAME', description: 'Target theme', example: 'warm' },
        { name: 'PASTE_DIAGRAM_CONFIG', description: 'Your existing diagram JSON' },
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
      title: 'Work with Arc',
      description: 'General prompt for Arc tasks',
      messages: [
        {
          role: 'system',
          content: `You are helping with Arc, a visual diagram editor. Key info:
- Diagrams are JSON with: layout, nodes, nodeData, connectors, connectorStyles
- Colors: violet, emerald, blue, amber, sky, zinc, rose, orange
- Sizes: s, m, l
- Icons: Lucide icons (Server, Database, Monitor, Cloud, etc.)`,
        },
        {
          role: 'user',
          content: `Help me [TASK_DESCRIPTION] with Arc.

[ADDITIONAL_CONTEXT]`,
        },
      ],
      variables: [
        { name: 'TASK_DESCRIPTION', description: 'What you want to do', example: 'create a microservices diagram' },
        { name: 'ADDITIONAL_CONTEXT', description: 'Any extra details' },
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
      title: 'Work with Arc',
      description: 'General prompt for Arc tasks',
      messages: [
        {
          role: 'system',
          content: `You are helping with Arc, a visual diagram editor. Key info:
- Diagrams are JSON with: layout, nodes, nodeData, connectors, connectorStyles
- Colors: violet, emerald, blue, amber, sky, zinc, rose, orange
- Sizes: s, m, l
- Icons: Lucide icons (Server, Database, Monitor, Cloud, etc.)`,
        },
        {
          role: 'user',
          content: `Help me [TASK_DESCRIPTION] with Arc.

[ADDITIONAL_CONTEXT]`,
        },
      ],
      variables: [
        { name: 'TASK_DESCRIPTION', description: 'What you want to do', example: 'create a microservices diagram' },
        { name: 'ADDITIONAL_CONTEXT', description: 'Any extra details' },
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
          prompt={page.prompt.messages}
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
