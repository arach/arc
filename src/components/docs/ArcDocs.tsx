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
      title: 'Get Help with Arc',
      description: 'General assistance for working with Arc diagrams',
      messages: [
        {
          role: 'system',
          content: `## Arc Diagram Editor

Arc creates **declarative architecture diagrams** as JSON configs that can be version-controlled, rendered anywhere, and edited visually.

### Config Structure
- \`layout\` — Canvas dimensions (\`width\`, \`height\`)
- \`nodes\` — Position and size for each node (\`x\`, \`y\`, \`size\`)
- \`nodeData\` — Visual properties (\`icon\`, \`name\`, \`subtitle\`, \`color\`)
- \`connectors\` — Connections between nodes (\`from\`, \`to\`, \`anchors\`, \`style\`)
- \`connectorStyles\` — Shared line styles (\`color\`, \`strokeWidth\`, \`label\`)

### Available Values
| Property | Options |
|----------|---------|
| size | \`s\`, \`m\`, \`l\` |
| color | \`violet\`, \`emerald\`, \`blue\`, \`amber\`, \`sky\`, \`zinc\`, \`rose\`, \`orange\` |
| icon | Any [Lucide icon](https://lucide.dev) — Server, Database, Monitor, Cloud, etc. |`,
        },
        {
          role: 'user',
          content: `I need help with Arc: {TASK}

{CONTEXT}`,
        },
      ],
      variables: [
        { name: 'TASK', description: 'What you want to accomplish', example: 'create a diagram for my auth flow' },
        { name: 'CONTEXT', description: 'Additional details, existing config, or constraints' },
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
      description: 'Get started with Arc in your project',
      messages: [
        {
          role: 'system',
          content: `## Setting Up Arc

### Installation
\`\`\`bash
npm install @arach/arc
\`\`\`

### Basic Usage
\`\`\`jsx
import { ArchitectureDiagram } from '@arach/arc'
import config from './my-diagram.json'

<ArchitectureDiagram config={config} />
\`\`\`

### Minimal Config
\`\`\`json
{
  "layout": { "width": 600, "height": 300 },
  "nodes": { "app": { "x": 50, "y": 50, "size": "m" } },
  "nodeData": { "app": { "icon": "Monitor", "name": "App", "color": "violet" } }
}
\`\`\``,
        },
        {
          role: 'user',
          content: `Help me set up Arc in my {PROJECT_TYPE} project.

I want to create a diagram showing: {WHAT_TO_DIAGRAM}

{ADDITIONAL_REQUIREMENTS}`,
        },
      ],
      variables: [
        { name: 'PROJECT_TYPE', description: 'Your framework or setup', example: 'Next.js app' },
        { name: 'WHAT_TO_DIAGRAM', description: 'The system you want to visualize', example: 'API gateway connecting to microservices' },
        { name: 'ADDITIONAL_REQUIREMENTS', description: 'Any specific needs or constraints' },
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
      description: 'Create, read, or modify Arc diagram JSON',
      messages: [
        {
          role: 'system',
          content: `## Arc Diagram Format Reference

### Config Structure
\`\`\`json
{
  "layout": { "width": 700, "height": 340 },
  "nodes": {
    "nodeId": { "x": 25, "y": 15, "size": "m" }
  },
  "nodeData": {
    "nodeId": { "icon": "Server", "name": "API", "subtitle": "v2.0", "color": "violet" }
  },
  "connectors": [
    { "from": "a", "to": "b", "fromAnchor": "right", "toAnchor": "left", "style": "http" }
  ],
  "connectorStyles": {
    "http": { "color": "amber", "strokeWidth": 2, "label": "HTTP" }
  }
}
\`\`\`

### Valid Values
| Property | Options |
|----------|---------|
| size | \`s\` (small), \`m\` (medium), \`l\` (large) |
| color | \`violet\`, \`emerald\`, \`blue\`, \`amber\`, \`sky\`, \`zinc\`, \`rose\`, \`orange\` |
| anchor | \`left\`, \`right\`, \`top\`, \`bottom\`, \`topLeft\`, \`topRight\`, \`bottomLeft\`, \`bottomRight\` |
| icon | Any Lucide icon name — \`Server\`, \`Database\`, \`Monitor\`, \`Cloud\`, \`Globe\`, etc. |`,
        },
        {
          role: 'user',
          content: `{ACTION} this Arc diagram config:

{DIAGRAM_CONFIG}

{SPECIFIC_REQUEST}`,
        },
      ],
      variables: [
        { name: 'ACTION', description: 'What to do', example: 'Modify / Explain / Add to / Convert' },
        { name: 'DIAGRAM_CONFIG', description: 'Your existing diagram JSON (or describe what you want to create)' },
        { name: 'SPECIFIC_REQUEST', description: 'Detailed instructions for the change' },
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
          role: 'system',
          content: `## Arc Editor Architecture

### Key Files
| Area | Files |
|------|-------|
| State | \`EditorProvider.jsx\` + \`editorReducer.js\` — useReducer + Context |
| Canvas | \`DiagramCanvas.jsx\` — Interactive drag-and-drop surface |
| Nodes | \`EditableNode.jsx\` — Draggable node components |
| Connectors | \`ConnectorLayer.jsx\` — SVG connection lines |
| Properties | \`PropertiesPanel.jsx\` — Right sidebar editor |
| Icons | \`iconRegistry.js\` — Lucide icon mapping |
| Constants | \`constants.js\` — Colors, sizes, anchor positions |

### Editor State
\`\`\`javascript
{
  diagram: { layout, nodes, nodeData, connectors, connectorStyles },
  editor: { selectedNodeId, mode, pendingConnector, isDragging },
  meta: { filename, isDirty, lastSaved },
  history: { past, future }
}
\`\`\`

### Modes
- \`select\` — Click to select, drag to move
- \`addNode\` — Click canvas to place node
- \`addConnector\` — Click source → click target`,
        },
        {
          role: 'user',
          content: `{GOAL}

{DETAILS}`,
        },
      ],
      variables: [
        { name: 'GOAL', description: 'What you want to understand or build', example: 'Add keyboard shortcut for deleting nodes' },
        { name: 'DETAILS', description: 'Relevant context, error messages, or constraints' },
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
      title: 'Diagram Templates',
      description: 'Apply structural styling to diagrams',
      messages: [
        {
          role: 'system',
          content: `## Arc Templates

Templates define the **structural appearance** of diagrams — shapes, line styles, spacing, and layout patterns.

### Built-in Templates
- **default** — Clean boxes with subtle shadows
- **minimal** — Thin borders, no shadows
- **rounded** — Pill-shaped nodes
- **technical** — Sharp corners, monospace labels

### Customizing Structure
Templates control:
- Node shape (rounded corners, borders, shadows)
- Connector style (solid, dashed, animated)
- Label positioning and typography
- Spacing and alignment`,
        },
        {
          role: 'user',
          content: `{TEMPLATE_REQUEST}

{DIAGRAM_OR_DESCRIPTION}`,
        },
      ],
      variables: [
        { name: 'TEMPLATE_REQUEST', description: 'What styling you want', example: 'Apply a minimal technical style' },
        { name: 'DIAGRAM_OR_DESCRIPTION', description: 'Your diagram config or description of desired result' },
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
      title: 'Color Themes',
      description: 'Apply color palettes to diagrams',
      messages: [
        {
          role: 'system',
          content: `## Arc Themes

Themes define **color palettes** that can be applied to any template.

### Node Colors
\`violet\` \`emerald\` \`blue\` \`amber\` \`sky\` \`zinc\` \`rose\` \`orange\`

### Connector Colors
Connectors can use the same palette, or custom colors in \`connectorStyles\`.

### Theme Presets
- **default** — Balanced, colorful
- **warm** — Oranges, ambers, roses
- **cool** — Blues, violets, emeralds
- **mono** — Grayscale with accent`,
        },
        {
          role: 'user',
          content: `{THEME_REQUEST}

{DIAGRAM_OR_DESCRIPTION}`,
        },
      ],
      variables: [
        { name: 'THEME_REQUEST', description: 'Color scheme you want', example: 'Use a warm palette with orange accents' },
        { name: 'DIAGRAM_OR_DESCRIPTION', description: 'Your diagram config or description' },
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
      title: 'Arc AI Assistant',
      description: 'Full context for working with Arc',
      messages: [
        {
          role: 'system',
          content: `## Arc — AI-Ready Diagram Editor

Arc creates **declarative architecture diagrams** as JSON. Key concepts:

### Config Structure
\`\`\`
layout → canvas size (width, height)
nodes → positions (x, y, size)
nodeData → visuals (icon, name, subtitle, color)
connectors → connections (from, to, anchors, style)
connectorStyles → shared line styles
\`\`\`

### Valid Values
- **size**: \`s\`, \`m\`, \`l\`
- **color**: \`violet\`, \`emerald\`, \`blue\`, \`amber\`, \`sky\`, \`zinc\`, \`rose\`, \`orange\`
- **anchor**: \`left\`, \`right\`, \`top\`, \`bottom\`, \`topLeft\`, \`topRight\`, \`bottomLeft\`, \`bottomRight\`
- **icon**: Any Lucide icon (\`Server\`, \`Database\`, \`Monitor\`, \`Cloud\`, \`Globe\`, etc.)

### Common Tasks
- Create diagrams from descriptions
- Modify existing configs
- Add/remove nodes and connectors
- Change colors, sizes, icons
- Explain diagram structure`,
        },
        {
          role: 'user',
          content: `{REQUEST}

{CONTEXT}`,
        },
      ],
      variables: [
        { name: 'REQUEST', description: 'What you need help with', example: 'Create a microservices diagram' },
        { name: 'CONTEXT', description: 'Existing config, requirements, or constraints' },
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
      title: 'Arc AI Assistant',
      description: 'Full context for working with Arc',
      messages: [
        {
          role: 'system',
          content: `## Arc — AI-Ready Diagram Editor

Arc creates **declarative architecture diagrams** as JSON. Key concepts:

### Config Structure
\`\`\`
layout → canvas size (width, height)
nodes → positions (x, y, size)
nodeData → visuals (icon, name, subtitle, color)
connectors → connections (from, to, anchors, style)
connectorStyles → shared line styles
\`\`\`

### Valid Values
- **size**: \`s\`, \`m\`, \`l\`
- **color**: \`violet\`, \`emerald\`, \`blue\`, \`amber\`, \`sky\`, \`zinc\`, \`rose\`, \`orange\`
- **anchor**: \`left\`, \`right\`, \`top\`, \`bottom\`, \`topLeft\`, \`topRight\`, \`bottomLeft\`, \`bottomRight\`
- **icon**: Any Lucide icon (\`Server\`, \`Database\`, \`Monitor\`, \`Cloud\`, \`Globe\`, etc.)

### Common Tasks
- Create diagrams from descriptions
- Modify existing configs
- Add/remove nodes and connectors
- Change colors, sizes, icons
- Explain diagram structure`,
        },
        {
          role: 'user',
          content: `{REQUEST}

{CONTEXT}`,
        },
      ],
      variables: [
        { name: 'REQUEST', description: 'What you need help with', example: 'Create a microservices diagram' },
        { name: 'CONTEXT', description: 'Existing config, requirements, or constraints' },
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
