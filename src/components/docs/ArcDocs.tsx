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
  useActiveSection,
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
      description: 'Generate architecture diagrams from natural language descriptions',
      info: 'Arc outputs JSON configs with four keys: layout (canvas), nodes (positions), nodeData (appearance), connectors (lines). Choose a layout pattern (left-to-right for pipelines, hub-and-spoke for central services) based on your architecture.',
      params: [
        { name: 'ARCHITECTURE', description: 'The system you\'re diagramming', example: 'microservices with API gateway, auth, and three backends' },
        { name: 'PATTERN', description: 'Layout style: "flow" (left-to-right) or "hub" (central node with spokes)', example: 'flow' },
      ],
      starterTemplate: `Create an Arc diagram for: {ARCHITECTURE}

Layout pattern: {PATTERN}

Requirements:
- Use size "l" for the primary/central component
- Use size "m" for services and "s" for utilities
- Space nodes ~200px apart horizontally
- Keep canvas compact (700-900px wide)`,
      examples: `// examples.json
// PATTERN 1: Left-to-right flow (pipelines, data flow)
{
  "layout": { "width": 700, "height": 350 },
  "nodes": {
    "client": { "x": 50, "y": 130, "size": "m" },
    "api": { "x": 270, "y": 100, "size": "l" },    // WHY: Primary component = large
    "db": { "x": 520, "y": 130, "size": "m" }
  },
  "nodeData": {
    "client": { "icon": "Monitor", "name": "Client", "color": "sky" },
    "api": { "icon": "Server", "name": "API", "subtitle": "Express", "color": "violet" },
    "db": { "icon": "Database", "name": "PostgreSQL", "color": "emerald" }
  },
  "connectors": [
    { "from": "client", "to": "api", "fromAnchor": "right", "toAnchor": "left" },  // WHY: right→left for horizontal flow
    { "from": "api", "to": "db", "fromAnchor": "right", "toAnchor": "left" }
  ]
}

// PATTERN 2: Hub-and-spoke (gateway, orchestrator, central service)
{
  "layout": { "width": 600, "height": 400 },
  "nodes": {
    "gateway": { "x": 220, "y": 140, "size": "l" },  // WHY: Central hub = large, centered
    "auth": { "x": 50, "y": 50, "size": "m" },
    "users": { "x": 420, "y": 50, "size": "m" },
    "orders": { "x": 420, "y": 260, "size": "m" }
  },
  "nodeData": {
    "gateway": { "icon": "Server", "name": "Gateway", "color": "violet" },
    "auth": { "icon": "Lock", "name": "Auth", "color": "emerald" },
    "users": { "icon": "Users", "name": "Users API", "color": "blue" },
    "orders": { "icon": "Package", "name": "Orders", "color": "amber" }
  },
  "connectors": [
    { "from": "gateway", "to": "auth", "fromAnchor": "top", "toAnchor": "bottom" },  // WHY: spokes radiate from center
    { "from": "gateway", "to": "users", "fromAnchor": "right", "toAnchor": "left" },
    { "from": "gateway", "to": "orders", "fromAnchor": "bottomRight", "toAnchor": "left" }
  ]
}`,
      expectedOutput: `// validation-rules.md
Return complete JSON. Before responding, verify:
1. All four keys present: layout, nodes, nodeData, connectors
2. Node IDs match exactly between "nodes" and "nodeData"
3. Icons from valid set: Monitor, Server, Cloud, Database, Lock, User, Users, Globe, Code, Terminal, Zap, Settings, Mail, Package, Box, Layers (48 total)
4. Colors: violet, emerald, blue, amber, zinc, sky
5. Sizes: xs, s, m, l
6. Anchors: top, right, bottom, left, bottomRight, bottomLeft
7. Spacing: ~200px between nodes, canvas fits content`,
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
      description: 'Add Arc diagrams to your React project',
      info: 'Arc is a React component that renders diagrams from JSON configs. Install the package, import ArchitectureDiagram, and pass your config as a prop. Works with Next.js, Vite, CRA, and any React setup.',
      params: [
        { name: 'FRAMEWORK', description: 'Your React setup', example: 'Next.js 14 with App Router' },
        { name: 'PACKAGE_MANAGER', description: 'npm, yarn, pnpm, or bun', example: 'pnpm' },
        { name: 'DIAGRAM', description: 'What you want to visualize', example: 'authentication flow' },
      ],
      starterTemplate: `Help me add Arc diagrams to my {FRAMEWORK} project.

Package manager: {PACKAGE_MANAGER}
First diagram: {DIAGRAM}

I need:
1. Installation command
2. Basic component setup
3. A starter config for my diagram`,
      examples: `// setup-examples.md
// INSTALLATION (choose your package manager)
npm install @arach/arc
pnpm add @arach/arc
yarn add @arach/arc

// BASIC USAGE - React component
import { ArchitectureDiagram } from '@arach/arc'

const config = {
  layout: { width: 600, height: 300 },
  nodes: {
    client: { x: 50, y: 100, size: "m" },
    server: { x: 300, y: 100, size: "l" }
  },
  nodeData: {
    client: { icon: "Monitor", name: "Client", color: "sky" },
    server: { icon: "Server", name: "API", color: "violet" }
  },
  connectors: [
    { from: "client", to: "server", fromAnchor: "right", toAnchor: "left" }
  ]
}

export default function Page() {
  return <ArchitectureDiagram config={config} />
}

// NEXT.JS APP ROUTER - app/architecture/page.tsx
// WHY: Use 'use client' because Arc uses browser APIs
'use client'
import { ArchitectureDiagram } from '@arach/arc'
// ... rest of component

// STORING CONFIGS - recommended pattern
// WHY: Keep configs in separate files for reusability
// lib/diagrams/auth-flow.json
{
  "layout": { "width": 700, "height": 350 },
  // ... config
}
// Then import: import authFlow from '@/lib/diagrams/auth-flow.json'`,
      expectedOutput: `// expected-output.md
Provide:
1. Exact install command for the user's package manager
2. Complete, copy-pasteable component code
3. A valid starter config matching their diagram description
4. Framework-specific notes (e.g., 'use client' for Next.js App Router)`,
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
      description: 'Understand, debug, or extend the Arc editor codebase',
      info: 'Arc editor uses useReducer + Context for state (diagram, editor, meta, history). Canvas handles pointer events, nodes use pointer capture for drag, SVG layer renders connectors. All state flows through dispatch actions.',
      params: [
        { name: 'TASK', description: 'Feature to add, bug to fix, or code to understand', example: 'add keyboard shortcuts for copy/paste' },
        { name: 'FILES', description: 'Specific files you\'re working with (optional)', example: 'EditableNode.jsx' },
      ],
      starterTemplate: `I'm working on the Arc editor codebase.

**Task:** {TASK}

**Files I'm looking at:** {FILES}

Help me understand the relevant patterns and implement the change.`,
      examples: `// architecture-patterns.md
// STATE SHAPE - EditorProvider.jsx
{
  diagram: {
    layout: { width, height },
    nodes: { [id]: { x, y, size } },
    nodeData: { [id]: { icon, name, subtitle, color } },
    connectors: [{ from, to, fromAnchor, toAnchor }]
  },
  editor: {
    selectedNodeId: string | null,
    selectedConnectorIndex: number | null,
    mode: 'select' | 'addNode' | 'addConnector',
    pendingConnector: { from, fromAnchor } | null,
    isDragging: boolean
  },
  meta: { filename, isDirty, lastSaved },
  history: { past: [], future: [] }
}

// ACTION PATTERNS - editorReducer.js
// WHY: All state changes go through dispatch, enabling undo/redo
dispatch({ type: 'SELECT_NODE', nodeId: 'api' })
dispatch({ type: 'UPDATE_NODE_DATA', nodeId: 'api', data: { name: 'New Name' } })
dispatch({ type: 'MOVE_NODE', nodeId: 'api', x: 100, y: 200 })
dispatch({ type: 'ADD_CONNECTOR', connector: { from, to, fromAnchor, toAnchor } })
dispatch({ type: 'UNDO' })  // Pops from history.past
dispatch({ type: 'REDO' })  // Pops from history.future

// DRAG PATTERN - EditableNode.jsx
// WHY: Pointer capture ensures drag continues even if cursor leaves element
const handlePointerDown = (e) => {
  e.target.setPointerCapture(e.pointerId)
  dispatch({ type: 'START_DRAG' })
}
const handlePointerMove = (e) => {
  if (!isDragging) return
  dispatch({ type: 'MOVE_NODE', nodeId, x: e.clientX - offset.x, y: e.clientY - offset.y })
}
const handlePointerUp = (e) => {
  e.target.releasePointerCapture(e.pointerId)
  dispatch({ type: 'END_DRAG' })
}

// CONNECTOR LAYER - ConnectorLayer.jsx
// WHY: SVG layer sits below nodes with pointer-events: none, except on paths
<svg style={{ pointerEvents: 'none' }}>
  <path style={{ pointerEvents: 'stroke' }} onClick={handleSelect} />
</svg>

// FILE STRUCTURE
src/components/editor/
├── DiagramEditor.jsx    // Main layout (toolbar + canvas + panel)
├── EditorProvider.jsx   // Context + useReducer setup
├── editorReducer.js     // All state mutation logic
├── DiagramCanvas.jsx    // Interactive canvas, pointer events
├── EditableNode.jsx     // Draggable node component
├── ConnectorLayer.jsx   // SVG connector rendering
├── AnchorPoints.jsx     // Connection point UI
├── Toolbar.jsx          // File/mode/history controls
└── PropertiesPanel.jsx  // Right sidebar editor`,
      expectedOutput: `// expected-output.md
Provide:
1. Specific file paths for changes
2. Code following existing patterns (dispatch actions, pointer capture)
3. Explanation of WHY this approach fits the architecture
4. Any new action types that need adding to editorReducer.js`,
    },
    title: 'Architecture',
    description: 'How the Arc editor is built.',
    badge: 'Core Concepts',
  },
  templates: {
    content: stripFrontmatter(examplesMd),
    agentContent: stripFrontmatter(apiAgentMd),
    prompt: {
      title: 'Apply Structural Styling',
      description: 'Change node sizes, spacing, and layout structure',
      info: 'Templates control structural styling: sizes (xs/s/m/l map to 60/80/120/160px), spacing (~200px between nodes), and layout patterns. Use sizes to create visual hierarchy - large for primary components, small for utilities.',
      params: [
        { name: 'CONFIG', description: 'Your current diagram config (paste JSON)', example: '' },
        { name: 'CHANGES', description: 'Structural changes needed', example: 'make gateway larger, add more spacing' },
      ],
      starterTemplate: `Apply structural changes to this Arc diagram:

\`\`\`json
{CONFIG}
\`\`\`

Changes needed: {CHANGES}`,
      examples: `// templates-examples.json
// SIZE HIERARCHY - creates visual importance
{
  "nodes": {
    "gateway": { "x": 250, "y": 100, "size": "l" },   // 160px - WHY: Primary entry point
    "auth": { "x": 50, "y": 100, "size": "m" },       // 120px - WHY: Core service
    "cache": { "x": 500, "y": 100, "size": "s" },     // 80px  - WHY: Supporting utility
    "metrics": { "x": 500, "y": 220, "size": "xs" }   // 60px  - WHY: Background process
  }
}

// SIZE REFERENCE:
// xs = 60px  - Background services, metrics, logs
// s  = 80px  - Utilities, caches, queues
// m  = 120px - Core services, APIs, databases
// l  = 160px - Primary components, gateways, main entry points

// SPACING PATTERNS
// Horizontal flow: ~200-250px between nodes
{
  "nodes": {
    "a": { "x": 50, "y": 100 },   // Start
    "b": { "x": 270, "y": 100 },  // +220px
    "c": { "x": 490, "y": 100 }   // +220px
  }
}

// Vertical stack: ~120-150px between rows
{
  "nodes": {
    "top": { "x": 200, "y": 50 },
    "mid": { "x": 200, "y": 180 },   // +130px
    "bot": { "x": 200, "y": 310 }    // +130px
  }
}

// BAD: Cramped spacing
{
  "nodes": {
    "a": { "x": 50, "y": 100 },
    "b": { "x": 120, "y": 100 }  // WHY BAD: Only 70px apart, nodes will overlap
  }
}`,
      expectedOutput: `// expected-output.md
Return the complete config with:
1. Sizes reflecting visual hierarchy (l for primary, xs for background)
2. Proper spacing (~200px horizontal, ~130px vertical)
3. Layout fitting canvas dimensions
4. Preserved nodeData and connectors (unless specifically changing them)`,
    },
    title: 'Templates',
    description: 'Structural presets that define box shapes, line styles, and layout behaviors.',
    badge: 'Styling',
  },
  themes: {
    content: stripFrontmatter(examplesMd),
    agentContent: stripFrontmatter(apiAgentMd),
    prompt: {
      title: 'Apply Color Theme',
      description: 'Change colors for visual cohesion or meaning',
      info: 'Arc has 6 theme colors: violet, emerald, blue, amber, sky, zinc. Apply colors semantically (violet for primary, emerald for data, amber for warnings) or aesthetically (warm palette, cool palette). Use 2-3 colors per diagram for cohesion.',
      params: [
        { name: 'CONFIG', description: 'Your diagram config (paste JSON)', example: '' },
        { name: 'THEME', description: 'Color scheme or semantic mapping', example: 'cool corporate look' },
      ],
      starterTemplate: `Apply color theme to this Arc diagram:

\`\`\`json
{CONFIG}
\`\`\`

Theme: {THEME}`,
      examples: `// themes-examples.json
// SEMANTIC COLORING - colors convey meaning
{
  "nodeData": {
    "gateway": { "icon": "Server", "name": "Gateway", "color": "violet" },   // WHY: Violet for primary/main entry
    "auth": { "icon": "Lock", "name": "Auth", "color": "emerald" },          // WHY: Emerald for security
    "db": { "icon": "Database", "name": "Database", "color": "blue" },       // WHY: Blue for data/storage
    "cache": { "icon": "Zap", "name": "Cache", "color": "amber" }            // WHY: Amber for performance/speed
  }
}

// SEMANTIC COLOR GUIDE:
// violet  - Primary components, main entry points, orchestrators
// emerald - Security, auth, encryption, validation
// blue    - Data, storage, databases, persistence
// amber   - Performance, caching, optimization, warnings
// sky     - External services, cloud, third-party integrations
// zinc    - Infrastructure, utilities, background processes

// AESTHETIC PALETTES
// Warm palette (friendly, approachable)
{
  "nodeData": {
    "main": { "color": "amber" },     // WHY: Warm primary
    "service": { "color": "emerald" }, // WHY: Complementary warmth
    "utility": { "color": "sky" }      // WHY: Cool accent for contrast
  }
}

// Cool palette (professional, corporate)
{
  "nodeData": {
    "main": { "color": "violet" },
    "service": { "color": "blue" },
    "utility": { "color": "zinc" }
  }
}

// Monochrome (clean, minimal)
{
  "nodeData": {
    "primary": { "color": "violet" },
    "secondary": { "color": "violet" },  // WHY: Same color, different sizes for hierarchy
    "tertiary": { "color": "zinc" }       // WHY: Neutral for supporting elements
  }
}

// BAD: Too many colors
{
  "nodeData": {
    "a": { "color": "violet" },
    "b": { "color": "emerald" },
    "c": { "color": "blue" },
    "d": { "color": "amber" },
    "e": { "color": "sky" },
    "f": { "color": "zinc" }  // WHY BAD: 6 colors = visual chaos, pick 2-3
  }
}`,
      expectedOutput: `// expected-output.md
Return the complete config with:
1. Colors applied to nodeData
2. 2-3 colors max for visual cohesion
3. Semantic meaning if requested (security=emerald, data=blue)
4. Preserved structure (nodes, connectors unchanged unless specified)`,
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
      description: 'Self-contained context for any AI assistant',
      info: 'This prompt gives your AI assistant everything it needs to work with Arc configs: schema, valid values, and examples. Copy and paste to Claude, ChatGPT, Copilot, or any LLM.',
      params: [
        { name: 'TASK', description: 'What you need the AI to do', example: 'create a diagram for my microservices' },
        { name: 'CONTEXT', description: 'Additional context (existing config, constraints)', example: 'must fit in 600x400 canvas' },
      ],
      starterTemplate: `I need help with Arc, a diagram editor that outputs JSON configs.

**Task:** {TASK}

**Context:** {CONTEXT}

## Arc Config Schema

Arc configs have four required keys:
- layout: { width: number, height: number }
- nodes: { [id]: { x: number, y: number, size: "xs"|"s"|"m"|"l" } }
- nodeData: { [id]: { icon: string, name: string, subtitle?: string, color: string } }
- connectors: [{ from: string, to: string, fromAnchor: string, toAnchor: string }]

## Valid Values

Icons (48): Monitor, Server, Smartphone, Cloud, Cpu, Database, HardDrive, Wifi, Globe, User, Users, Lock, Key, Shield, Code, Terminal, FileCode, Folder, Zap, Activity, BarChart, Box, Package, Layers, Settings, Bell, Mail, MessageSquare, Search, Filter, Download, Upload, Play, GitBranch, Workflow...

Colors (6): violet, emerald, blue, amber, sky, zinc

Sizes: xs (60px), s (80px), m (120px), l (160px)

Anchors: top, right, bottom, left, bottomRight, bottomLeft

## Example Output
\`\`\`json
{
  "layout": { "width": 700, "height": 350 },
  "nodes": {
    "client": { "x": 50, "y": 130, "size": "m" },
    "api": { "x": 270, "y": 100, "size": "l" },
    "db": { "x": 520, "y": 130, "size": "m" }
  },
  "nodeData": {
    "client": { "icon": "Monitor", "name": "Client", "color": "sky" },
    "api": { "icon": "Server", "name": "API", "color": "violet" },
    "db": { "icon": "Database", "name": "PostgreSQL", "color": "emerald" }
  },
  "connectors": [
    { "from": "client", "to": "api", "fromAnchor": "right", "toAnchor": "left" },
    { "from": "api", "to": "db", "fromAnchor": "right", "toAnchor": "left" }
  ]
}
\`\`\``,
      examples: `// agent-briefing-tips.md
// TIP 1: Include schema inline (LLMs can't fetch URLs reliably)
// This prompt includes the full schema so it works without external fetch

// TIP 2: Add constraints to your CONTEXT
// Good: "must fit in 600x400, max 5 nodes"
// Bad: "make it look nice"

// TIP 3: Ask for validation
// Add to your task: "...and verify all node IDs match between nodes and nodeData"

// TIP 4: For complex diagrams, ask step by step
// First: "List the components I need"
// Then: "Now generate the config"`,
      expectedOutput: `// expected-output.md
The AI should return:
1. Complete, valid JSON (all four keys)
2. Node IDs matching between nodes and nodeData
3. Only valid icons, colors, sizes, and anchors
4. Proper spacing (~200px between nodes)`,
    },
    title: 'AI Agents',
    description: 'LLM-optimized documentation for AI coding assistants.',
    badge: 'Agents',
  },
  skills: {
    content: stripFrontmatter(agentsMd),
    agentContent: llmTxt,
    prompt: {
      title: 'Arc Skills Library',
      description: 'Task-specific prompts for common operations',
      info: 'Four pre-built skills: CREATE (new diagram), MODIFY (edit existing), DEBUG (fix invalid config), EXPORT (convert to Mermaid/PlantUML). Select a skill and provide your input.',
      params: [
        { name: 'SKILL', description: 'Which skill: create, modify, debug, or export', example: 'create' },
        { name: 'INPUT', description: 'Your architecture description or existing config', example: 'three-tier web app' },
      ],
      starterTemplate: `**Skill:** {SKILL}

**Input:** {INPUT}`,
      examples: `// skills-library.md
// ═══════════════════════════════════════════════════════════════
// SKILL: CREATE - Generate new diagram from description
// ═══════════════════════════════════════════════════════════════
Create an Arc diagram for: [YOUR ARCHITECTURE]

Requirements:
- layout: fit content (700-900px wide typical)
- sizes: "l" for primary, "m" for services, "s" for utilities
- colors: 2-3 max (violet/emerald/blue for cool, amber/sky for warm)
- spacing: ~200px between nodes horizontally
- flow: left-to-right for pipelines, hub-spoke for gateways

Return complete JSON with: layout, nodes, nodeData, connectors

// ═══════════════════════════════════════════════════════════════
// SKILL: MODIFY - Change existing config
// ═══════════════════════════════════════════════════════════════
Modify this Arc diagram:

\`\`\`json
[PASTE YOUR CONFIG]
\`\`\`

Changes needed: [DESCRIBE CHANGES]

Return the complete updated config (not just the diff).

// ═══════════════════════════════════════════════════════════════
// SKILL: DEBUG - Fix broken config
// ═══════════════════════════════════════════════════════════════
Debug this Arc config (it's not rendering correctly):

\`\`\`json
[PASTE BROKEN CONFIG]
\`\`\`

Check for:
1. Missing keys (layout, nodes, nodeData, connectors)
2. ID mismatches between nodes and nodeData
3. Invalid values (colors must be: violet, emerald, blue, amber, sky, zinc)
4. Invalid sizes (must be: xs, s, m, l)
5. Invalid anchors (must be: top, right, bottom, left, bottomRight, bottomLeft)

Return the fixed config with comments explaining what was wrong.

// ═══════════════════════════════════════════════════════════════
// SKILL: EXPORT - Convert to other formats
// ═══════════════════════════════════════════════════════════════
Export this Arc config for: [TARGET FORMAT]

Targets:
- Mermaid: Convert to Mermaid diagram syntax
- PlantUML: Convert to PlantUML syntax
- Markdown: Convert to markdown table describing components
- TypeScript: Generate TypeScript types for the config

\`\`\`json
[PASTE YOUR CONFIG]
\`\`\``,
      expectedOutput: `// expected-output.md
For CREATE: Complete JSON with all four keys, valid values only
For MODIFY: Complete updated config (not diff)
For DEBUG: Fixed config with // comments explaining fixes
For EXPORT: Target format output`,
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
  const activeSection = useActiveSection(tocItems)

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
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  title="Open AI prompt template"
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
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
            {tocItems.map((item) => (
              <li key={item.id} className="dw-toc-item">
                <a
                  href={`#${item.id}`}
                  className={`dw-toc-link ${activeSection === item.id ? 'active' : ''}`}
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
