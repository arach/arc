import React, { useState } from 'react'
import { Copy, Check, Bot, FileText, Code, Palette, ArrowLeft } from 'lucide-react'
import { useMeta } from '../../hooks/useMeta'
// Import Dewey-generated docs as raw string
import fullDocumentation from '../../../docs/AGENTS.md?raw'

interface LLMPageProps {
  currentPage: string
  onNavigate: (page: string) => void
  onBack: () => void
}

// Legacy hardcoded docs removed - now powered by Dewey
const _legacyDocs = `# Arc - Visual Architecture Diagram Library

Arc is a React component library for rendering beautiful, interactive architecture diagrams. It provides a declarative JSON format for defining diagrams and multiple built-in themes.

## Installation

\`\`\`bash
# Install the player/renderer
npm install @arach/arc

# Or install the visual editor CLI
npx @arach/arc-editor
\`\`\`

## Quick Start

\`\`\`tsx
import { ArcDiagram } from '@arach/arc'
import type { ArcDiagramData } from '@arach/arc'

const diagram: ArcDiagramData = {
  layout: { width: 600, height: 300 },
  nodes: {
    frontend: { x: 50, y: 100, size: 'm' },
    backend: { x: 250, y: 100, size: 'm' },
    database: { x: 450, y: 100, size: 'm' },
  },
  nodeData: {
    frontend: { icon: 'Monitor', name: 'Frontend', color: 'violet' },
    backend: { icon: 'Server', name: 'Backend', color: 'emerald' },
    database: { icon: 'Database', name: 'Database', color: 'blue' },
  },
  connectors: [
    { from: 'frontend', to: 'backend', fromAnchor: 'right', toAnchor: 'left', style: 'api' },
    { from: 'backend', to: 'database', fromAnchor: 'right', toAnchor: 'left', style: 'db' },
  ],
  connectorStyles: {
    api: { color: 'violet', strokeWidth: 2, label: 'REST' },
    db: { color: 'blue', strokeWidth: 2, label: 'SQL' },
  },
}

function App() {
  return <ArcDiagram data={diagram} mode="light" theme="default" />
}
\`\`\`

## API Reference

### ArcDiagram Component

\`\`\`tsx
interface ArcDiagramProps {
  data: ArcDiagramData     // Diagram configuration
  mode?: 'light' | 'dark'  // Color mode (default: 'light')
  theme?: ThemeId          // Theme preset (default: 'default')
  interactive?: boolean    // Enable zoom/pan (default: true)
  className?: string       // Additional CSS classes
}
\`\`\`

### ArcDiagramData Schema

\`\`\`typescript
interface ArcDiagramData {
  id?: string                                    // Optional diagram identifier
  layout: { width: number; height: number }     // Canvas dimensions
  nodes: Record<string, NodePosition>           // Node positions by ID
  nodeData: Record<string, NodeData>            // Node display data by ID
  connectors: Connector[]                       // Connection definitions
  connectorStyles: Record<string, ConnectorStyle> // Style definitions
}
\`\`\`

### Node Types

\`\`\`typescript
interface NodePosition {
  x: number           // X coordinate
  y: number           // Y coordinate
  size: 's' | 'm' | 'l'  // Node size (small, medium, large)
}

interface NodeData {
  icon: string        // Lucide icon name (e.g., 'Monitor', 'Server', 'Database')
  name: string        // Display name
  subtitle?: string   // Optional subtitle
  description?: string // Optional description
  color: DiagramColor // Color theme for this node
}

type DiagramColor = 'violet' | 'emerald' | 'blue' | 'amber' | 'sky' | 'zinc' | 'rose' | 'orange'
\`\`\`

### Connector Types

\`\`\`typescript
interface Connector {
  from: string          // Source node ID
  to: string            // Target node ID
  fromAnchor: AnchorPosition  // Where to attach on source
  toAnchor: AnchorPosition    // Where to attach on target
  style: string         // Reference to connectorStyles key
  curve?: 'natural' | 'step'  // Line curve style (default: 'natural')
}

type AnchorPosition = 'left' | 'right' | 'top' | 'bottom' |
                      'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'

interface ConnectorStyle {
  color: DiagramColor   // Line color
  strokeWidth: number   // Line thickness (1-4 recommended)
  label?: string        // Optional label text
  labelAlign?: 'left' | 'right' | 'center'  // Label position
  dashed?: boolean      // Dashed line style
}
\`\`\`

## Themes

Arc includes 4 built-in themes:

| Theme ID | Name | Description |
|----------|------|-------------|
| default | Default | Balanced, vibrant colors |
| warm | Warm | Editorial, earth tones |
| cool | Cool | Technical, blue-focused |
| mono | Mono | Grayscale for print |

### Theme API

\`\`\`typescript
import { getTheme, getThemeList, THEMES } from '@arach/arc'

// Get a specific theme
const theme = getTheme('warm')

// List all available themes
const themes = getThemeList()
// Returns: [{ id: 'default', name: 'Default', description: '...' }, ...]

// Access theme colors
const palette = theme.light.palette.violet
// { border: '#...', bg: '#...', icon: '#...', stroke: '#...' }
\`\`\`

## Available Icons

Arc uses Lucide React icons. Common architecture icons:

**Infrastructure**: Server, Database, Cloud, CloudCog, HardDrive, Network, Cpu
**Interfaces**: Monitor, Smartphone, Laptop, Globe, Terminal
**Services**: MessageSquare, Mail, Bell, Shield, Lock, Key
**Data**: FileText, Folder, Package, Archive, Layers
**Connectivity**: Wifi, Radio, Plug, Cable, Router
**Actions**: RefreshCw, Download, Upload, Send, Zap

## Export Formats

The Arc Editor can export diagrams as:
- **JSON**: Full diagram configuration
- **TypeScript**: Type-safe diagram constant
- **SVG**: Vector graphic (light or dark)
- **PNG**: Raster image

## Example: Complex Architecture

\`\`\`tsx
const microservicesArchitecture: ArcDiagramData = {
  layout: { width: 900, height: 500 },
  nodes: {
    client: { x: 50, y: 200, size: 'l' },
    gateway: { x: 200, y: 200, size: 'm' },
    auth: { x: 400, y: 50, size: 'm' },
    users: { x: 400, y: 200, size: 'm' },
    orders: { x: 400, y: 350, size: 'm' },
    cache: { x: 600, y: 50, size: 's' },
    userDb: { x: 600, y: 200, size: 's' },
    orderDb: { x: 600, y: 350, size: 's' },
    queue: { x: 750, y: 275, size: 'm' },
  },
  nodeData: {
    client: { icon: 'Smartphone', name: 'Mobile App', color: 'violet' },
    gateway: { icon: 'Network', name: 'API Gateway', color: 'emerald' },
    auth: { icon: 'Shield', name: 'Auth Service', color: 'amber' },
    users: { icon: 'Users', name: 'User Service', color: 'blue' },
    orders: { icon: 'ShoppingCart', name: 'Order Service', color: 'rose' },
    cache: { icon: 'Zap', name: 'Redis', subtitle: 'Cache', color: 'orange' },
    userDb: { icon: 'Database', name: 'PostgreSQL', subtitle: 'Users', color: 'blue' },
    orderDb: { icon: 'Database', name: 'PostgreSQL', subtitle: 'Orders', color: 'rose' },
    queue: { icon: 'MessageSquare', name: 'RabbitMQ', color: 'sky' },
  },
  connectors: [
    { from: 'client', to: 'gateway', fromAnchor: 'right', toAnchor: 'left', style: 'http' },
    { from: 'gateway', to: 'auth', fromAnchor: 'topRight', toAnchor: 'left', style: 'grpc' },
    { from: 'gateway', to: 'users', fromAnchor: 'right', toAnchor: 'left', style: 'grpc' },
    { from: 'gateway', to: 'orders', fromAnchor: 'bottomRight', toAnchor: 'left', style: 'grpc' },
    { from: 'auth', to: 'cache', fromAnchor: 'right', toAnchor: 'left', style: 'redis' },
    { from: 'users', to: 'userDb', fromAnchor: 'right', toAnchor: 'left', style: 'sql' },
    { from: 'orders', to: 'orderDb', fromAnchor: 'right', toAnchor: 'left', style: 'sql' },
    { from: 'orders', to: 'queue', fromAnchor: 'right', toAnchor: 'left', style: 'amqp' },
    { from: 'users', to: 'queue', fromAnchor: 'bottomRight', toAnchor: 'topLeft', style: 'amqp' },
  ],
  connectorStyles: {
    http: { color: 'violet', strokeWidth: 3, label: 'HTTPS' },
    grpc: { color: 'emerald', strokeWidth: 2, label: 'gRPC' },
    redis: { color: 'orange', strokeWidth: 2, dashed: true },
    sql: { color: 'blue', strokeWidth: 2, label: 'SQL' },
    amqp: { color: 'sky', strokeWidth: 2, label: 'AMQP', dashed: true },
  },
}
\`\`\`

## Links

- GitHub: https://github.com/arach/arc
- npm (player): https://www.npmjs.com/package/@arach/arc
- npm (editor): https://www.npmjs.com/package/@arach/arc-editor
`

export default function LLMPage({ currentPage, onNavigate, onBack }: LLMPageProps) {
  const [copied, setCopied] = useState(false)

  // Set page-specific meta tags
  useMeta({
    title: 'LLM & Agent Reference | Arc Docs',
    description: 'Agent-friendly documentation for AI-assisted diagram generation with Arc.',
    image: '/og-docs-llm.png',
    url: '/docs/llm',
  })

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullDocumentation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('index')}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-violet-400" />
              <span className="font-mono text-sm font-semibold">LLM Documentation</span>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg transition-colors font-medium text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy All</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Intro */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-4">Arc Documentation for Agents</h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-6">
            This page contains the complete Arc documentation in a machine-readable markdown format,
            optimized for LLMs and AI coding assistants.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
              <FileText className="w-5 h-5 text-emerald-400 mb-2" />
              <span className="text-sm text-zinc-300 font-medium">Single-file format</span>
              <p className="text-xs text-zinc-500 mt-1">All docs in one copyable block</p>
            </div>
            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
              <Code className="w-5 h-5 text-blue-400 mb-2" />
              <span className="text-sm text-zinc-300 font-medium">Complete API reference</span>
              <p className="text-xs text-zinc-500 mt-1">Types, schemas, and examples</p>
            </div>
            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
              <Palette className="w-5 h-5 text-violet-400 mb-2" />
              <span className="text-sm text-zinc-300 font-medium">Theme & style guide</span>
              <p className="text-xs text-zinc-500 mt-1">All available options</p>
            </div>
          </div>
        </div>

        {/* Documentation content */}
        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 pt-14 overflow-x-auto text-sm text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
            {fullDocumentation}
          </pre>
        </div>

        {/* Quick links */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <h2 className="text-lg font-semibold mb-4">Human-readable docs</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('overview')}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('quickstart')}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Quickstart
            </button>
            <button
              onClick={() => onNavigate('diagram-format')}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Diagram Format
            </button>
            <button
              onClick={() => onNavigate('themes')}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Themes
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
