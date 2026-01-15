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
  type PromptParam,
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
  /** Grounding TLDR for the user */
  info: string
  /** Man-page style parameter definitions */
  params?: PromptParam[]
  /** Starter template with {VARIABLE} placeholders */
  starterTemplate: string
  /** In-context learning JSON examples */
  examples?: string
  /** Expected output format */
  expectedOutput?: string
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
      info: 'Arc outputs JSON configs with four keys: layout, nodes, nodeData, connectors. Describe your architecture and get a valid config you can paste directly into the editor.',
      params: [
        { name: 'ARCHITECTURE', description: 'The system you\'re diagramming', example: 'three-tier web app with React, Node API, and PostgreSQL' },
      ],
      starterTemplate: `Create an Arc diagram for: {ARCHITECTURE}

Show the main components and how they connect. Use size "l" for primary components, "m" for services, "s" for utilities.`,
      examples: `// GOOD: Left-to-right flow, proper spacing (~200px apart)
{
  "layout": { "width": 700, "height": 350 },
  "nodes": {
    "client": { "x": 50, "y": 130, "size": "m" },
    "api": { "x": 270, "y": 100, "size": "l" },    // Primary = large
    "db": { "x": 520, "y": 130, "size": "m" }
  },
  "nodeData": {
    "client": { "icon": "Monitor", "name": "React App", "color": "sky" },
    "api": { "icon": "Server", "name": "Node API", "subtitle": "Express", "color": "violet" },
    "db": { "icon": "Database", "name": "PostgreSQL", "color": "emerald" }
  },
  "connectors": [
    { "from": "client", "to": "api", "fromAnchor": "right", "toAnchor": "left" },
    { "from": "api", "to": "db", "fromAnchor": "right", "toAnchor": "left" }
  ]
}

// VALID VALUES:
// Icons: Monitor, Server, Cloud, Database, Lock, User, Globe, Code, Terminal, Zap, Settings, Mail, Search, Box, Layers... (48 total)
// Colors: violet, emerald, blue, amber, zinc, sky
// Sizes: xs, s, m, l
// Anchors: top, right, bottom, left, bottomRight, bottomLeft`,
      expectedOutput: `Complete JSON with all four keys. Verify:
- Node IDs match between "nodes" and "nodeData"
- Use only valid icons (Monitor, Server, Database, Lock, etc.)
- Colors: violet, emerald, blue, amber, zinc, sky
- Horizontal flow: use right→left anchors`,
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
      info: 'Arc is a React component that renders diagrams from JSON configs. Install via npm and import the ArchitectureDiagram component.',
      params: [
        { name: 'PROJECT', description: 'Your framework/setup', example: 'Next.js app' },
        { name: 'DIAGRAM', description: 'What to visualize', example: 'API architecture' },
      ],
      starterTemplate: `Help me set up Arc in my {PROJECT}.

I want to create a diagram showing {DIAGRAM}.

Walk me through:
1. Installation
2. Creating the config
3. Rendering the component`,
      expectedOutput: 'Step-by-step instructions with copy-pasteable code snippets for installation and basic usage.',
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
      description: 'Create, modify, or debug Arc diagram JSON',
      info: 'Arc configs are JSON with four required keys: layout (canvas size), nodes (positions), nodeData (appearance), and connectors (lines). Node IDs must match between nodes and nodeData.',
      params: [
        { name: 'CONFIG', description: 'Your existing Arc JSON config (paste below), or leave empty for new diagram' },
        { name: 'TASK', description: 'What you need done', example: 'add a database node on the right' },
      ],
      starterTemplate: `I need help with an Arc diagram config.

**My task:** {TASK}

**My current config (if modifying):**
\`\`\`json
{CONFIG}
\`\`\`

If creating from scratch, describe the architecture you want to visualize.`,
      examples: `// GOOD CONFIG - proper spacing, logical flow
{
  "layout": { "width": 800, "height": 400 },
  "nodes": {
    // ~200px horizontal spacing, vertically centered
    "client": { "x": 50, "y": 160, "size": "m" },
    "gateway": { "x": 280, "y": 115, "size": "l" },
    "auth": { "x": 560, "y": 100, "size": "m" },
    "db": { "x": 560, "y": 230, "size": "m" }
  },
  "nodeData": {
    // IDs MUST match "nodes" keys exactly
    "client": { "icon": "Monitor", "name": "Client", "color": "sky" },
    "gateway": { "icon": "Server", "name": "Gateway", "color": "violet" },
    "auth": { "icon": "Lock", "name": "Auth", "color": "emerald" },
    "db": { "icon": "Database", "name": "PostgreSQL", "color": "amber" }
  },
  "connectors": [
    { "from": "client", "to": "gateway", "fromAnchor": "right", "toAnchor": "left" },
    { "from": "gateway", "to": "auth", "fromAnchor": "right", "toAnchor": "left" },
    { "from": "gateway", "to": "db", "fromAnchor": "bottomRight", "toAnchor": "left" }
  ]
}

// BAD CONFIG - common mistakes
{
  // Missing "layout" key!
  "nodes": { "api": { "x": 50, "y": 50, "size": "medium" } },  // "medium" invalid, use "m"
  "nodeData": { "gateway": { "name": "API" } }  // ID mismatch! "api" vs "gateway"
}

// VALID VALUES:
// Icons (48): Monitor, Server, Smartphone, Cloud, Cpu, Database, HardDrive, Wifi, Globe, User, Users, Lock, Key, Shield, Code, Terminal, FileCode, Folder, Zap, Activity, BarChart, PieChart, Box, Package, Layers, Grid, Settings, Bell, Mail, MessageSquare, Search, Filter, Download, Upload, Play, Pause, Square, Circle...
// Colors (6): violet, emerald, blue, amber, zinc, sky
// Sizes: xs, s, m, l
// Anchors: top, right, bottom, left, bottomRight, bottomLeft`,
      expectedOutput: `Return complete, valid JSON. Before responding, verify:
1. All node IDs in "nodes" match entries in "nodeData"
2. All connector "from"/"to" values reference existing node IDs
3. Icons are from the 48 valid Lucide icons
4. Colors: violet, emerald, blue, amber, zinc, sky
5. Sizes: xs, s, m, l
6. Anchors: top, right, bottom, left, bottomRight, bottomLeft`,
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
      info: 'The Arc editor is a React app using useReducer + Context for state management. Key files: EditorProvider.jsx, DiagramCanvas.jsx, EditableNode.jsx.',
      params: [
        { name: 'TASK', description: 'Feature to add, bug to fix, or concept to understand' },
      ],
      starterTemplate: `I'm working on the Arc editor and need help with: {TASK}

For context, the editor uses:
- EditorProvider.jsx + editorReducer.js for state
- DiagramCanvas.jsx for the main canvas
- EditableNode.jsx for draggable nodes
- ConnectorLayer.jsx for SVG connections`,
      expectedOutput: 'Code changes with file paths and explanations. Follow existing patterns: useReducer actions, pointer capture for drag, SVG layer for connectors.',
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
      info: 'Arc styling uses node sizes (s/m/l) and colors to create visual hierarchy. Large nodes for primary components, small for utilities.',
      params: [
        { name: 'CONFIG', description: 'Your current diagram config' },
        { name: 'STYLE', description: 'Desired changes', example: 'larger gateway, warm colors' },
      ],
      starterTemplate: `Restyle this Arc diagram:

\`\`\`json
{CONFIG}
\`\`\`

I want: {STYLE}`,
      examples: `// Visual hierarchy with sizes
{
  "nodes": {
    "gateway": { "x": 200, "y": 50, "size": "l" },   // Large = primary
    "auth": { "x": 100, "y": 180, "size": "m" },     // Medium = service
    "cache": { "x": 300, "y": 180, "size": "s" }     // Small = utility
  },
  "nodeData": {
    "gateway": { "icon": "Server", "name": "Gateway", "color": "violet" },
    "auth": { "icon": "Lock", "name": "Auth", "color": "emerald" },
    "cache": { "icon": "Database", "name": "Redis", "color": "orange" }
  }
}

// Color families:
// Warm: orange, amber, rose
// Cool: violet, blue, sky
// Neutral: zinc, emerald`,
      expectedOutput: 'The complete restyled config with updated sizes and colors.',
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
      info: 'Arc has 8 colors: violet, emerald, blue, amber, sky, zinc, rose, orange. Use one primary color and 2-3 supporting colors for cohesion.',
      params: [
        { name: 'CONFIG', description: 'Your diagram config' },
        { name: 'PALETTE', description: 'Color scheme', example: 'warm tones' },
      ],
      starterTemplate: `Apply a {PALETTE} color palette to this diagram:

\`\`\`json
{CONFIG}
\`\`\``,
      examples: `// Warm palette
"nodeData": {
  "main": { "color": "orange" },    // Primary
  "service": { "color": "amber" },  // Secondary
  "accent": { "color": "rose" }     // Accent
}

// Cool palette
"nodeData": {
  "main": { "color": "violet" },
  "service": { "color": "blue" },
  "accent": { "color": "sky" }
}

// Available: violet, emerald, blue, amber, sky, zinc, rose, orange`,
      expectedOutput: 'The complete config with updated colors in nodeData.',
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
      info: 'Arc is a diagram editor that outputs JSON configs. Use this prompt to give your AI assistant the context it needs to help with Arc.',
      params: [
        { name: 'TASK', description: 'What you need help with', example: 'create a diagram' },
      ],
      starterTemplate: `I need help with Arc, a diagram editor that outputs JSON configs.

{TASK}

Quick reference:
- Sizes: s (small), m (medium), l (large)
- Colors: violet, emerald, blue, amber, sky, zinc, rose, orange
- Anchors: left, right, top, bottom

For full context: {BASE_URL}/llm.txt`,
      expectedOutput: 'Valid Arc JSON configs or step-by-step guidance depending on the task.',
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
      info: 'Arc skills are ready-to-use prompts for common tasks: creating diagrams, modifying configs, debugging issues.',
      params: [
        { name: 'TASK', description: 'What you want to do', example: 'create a microservices diagram' },
        { name: 'DETAILS', description: 'Additional requirements or existing config' },
      ],
      starterTemplate: `Use Arc to: {TASK}

{DETAILS}

Reference:
- Sizes: s, m, l
- Colors: violet, emerald, blue, amber, sky, zinc, rose, orange`,
      expectedOutput: 'Complete, valid Arc JSON ready to paste into the editor.',
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
          info={page.prompt.info}
          params={page.prompt.params}
          starterTemplate={withBaseUrl(page.prompt.starterTemplate)}
          examples={page.prompt.examples}
          expectedOutput={page.prompt.expectedOutput}
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
