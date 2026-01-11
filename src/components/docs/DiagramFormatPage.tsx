import React from 'react'
import DocsLayout, { type DocSection } from './DocsLayout'
import CodeBlock from './CodeBlock'

const sections: DocSection[] = [
  { id: 'overview', title: 'Overview', level: 2 },
  { id: 'basic-structure', title: 'Basic Structure', level: 2 },
  { id: 'layout', title: 'Layout', level: 3 },
  { id: 'nodes', title: 'Nodes', level: 3 },
  { id: 'node-data', title: 'Node Data', level: 3 },
  { id: 'connectors', title: 'Connectors', level: 3 },
  { id: 'connector-styles', title: 'Connector Styles', level: 3 },
  { id: 'complete-example', title: 'Complete Example', level: 2 },
  { id: 'types', title: 'TypeScript Types', level: 2 },
]

interface DiagramFormatPageProps {
  currentPage: string
  onNavigate: (page: string) => void
  onBack: () => void
}

export default function DiagramFormatPage({ currentPage, onNavigate, onBack }: DiagramFormatPageProps) {
  return (
    <DocsLayout
      title="Diagram Format"
      description="The declarative data structure that defines Arc diagrams."
      badge="Core Concepts"
      badgeColor="blue"
      sections={sections}
      currentPage={currentPage}
      onNavigate={onNavigate}
      onBack={onBack}
    >
      <h2 id="overview">Overview</h2>
      <p>
        Arc diagrams are defined using a typed data structure called <code>ArcDiagramData</code>.
        This structure separates <strong>position</strong> (where things are) from <strong>content</strong>
        (what things look like), making diagrams easy to maintain and style consistently.
      </p>

      <h2 id="basic-structure">Basic Structure</h2>
      <p>
        Every Arc diagram has five main sections:
      </p>

      <CodeBlock
        language="typescript"
        code={`const diagram: ArcDiagramData = {
  id: 'MY.DIAGRAM.001',      // Optional identifier
  layout: { ... },           // Canvas dimensions
  nodes: { ... },            // Node positions and sizes
  nodeData: { ... },         // Node content (labels, icons, colors)
  connectors: [ ... ],       // Lines between nodes
  connectorStyles: { ... },  // Named styles for connectors
}`}
        showLineNumbers={false}
      />

      <h3 id="layout">Layout</h3>
      <p>
        The <code>layout</code> object defines the canvas dimensions:
      </p>

      <CodeBlock
        language="typescript"
        code={`layout: {
  width: 800,   // Canvas width in pixels
  height: 400,  // Canvas height in pixels
}`}
        showLineNumbers={false}
      />

      <h3 id="nodes">Nodes</h3>
      <p>
        The <code>nodes</code> object maps node IDs to their positions:
      </p>

      <CodeBlock
        language="typescript"
        code={`nodes: {
  frontend: { x: 50,  y: 100, size: 'l' },  // Large node
  api:      { x: 300, y: 100, size: 'm' },  // Medium node
  cache:    { x: 300, y: 250, size: 's' },  // Small node
}`}
        showLineNumbers={false}
      />

      <p>
        Node IDs are your choice—use descriptive names that make the config readable.
        Available sizes are:
      </p>
      <ul>
        <li><code>'l'</code> — Large (220×90px) — primary components</li>
        <li><code>'m'</code> — Medium (160×75px) — secondary components</li>
        <li><code>'s'</code> — Small (110×48px) — supporting components</li>
      </ul>

      <h3 id="node-data">Node Data</h3>
      <p>
        The <code>nodeData</code> object defines the content for each node:
      </p>

      <CodeBlock
        language="typescript"
        code={`nodeData: {
  frontend: {
    icon: 'Monitor',           // Lucide icon name
    name: 'Frontend',          // Primary label
    subtitle: 'React + Vite',  // Optional secondary label
    description: 'SPA client', // Optional description (large nodes only)
    color: 'violet',           // Accent color
  },
  api: {
    icon: 'Server',
    name: 'API Gateway',
    color: 'emerald',
  },
}`}
        showLineNumbers={false}
      />

      <p>
        Available colors: <code>violet</code>, <code>emerald</code>, <code>blue</code>,
        <code>amber</code>, <code>sky</code>, <code>zinc</code>, <code>rose</code>, <code>orange</code>.
      </p>

      <h3 id="connectors">Connectors</h3>
      <p>
        The <code>connectors</code> array defines lines between nodes:
      </p>

      <CodeBlock
        language="typescript"
        code={`connectors: [
  {
    from: 'frontend',       // Source node ID
    to: 'api',              // Target node ID
    fromAnchor: 'right',    // Where the line starts
    toAnchor: 'left',       // Where the line ends
    style: 'http',          // Reference to connectorStyles
  },
  {
    from: 'api',
    to: 'cache',
    fromAnchor: 'bottom',
    toAnchor: 'top',
    style: 'cache',
    curve: 'natural',       // Optional: curved line
  },
]`}
        showLineNumbers={false}
      />

      <p>
        Anchor positions: <code>left</code>, <code>right</code>, <code>top</code>, <code>bottom</code>,
        <code>topLeft</code>, <code>topRight</code>, <code>bottomLeft</code>, <code>bottomRight</code>.
      </p>

      <h3 id="connector-styles">Connector Styles</h3>
      <p>
        The <code>connectorStyles</code> object defines named styles for connectors:
      </p>

      <CodeBlock
        language="typescript"
        code={`connectorStyles: {
  http: {
    color: 'violet',      // Line color
    strokeWidth: 2,       // Line thickness
    label: 'HTTP',        // Optional label on line
    dashed: false,        // Optional: dashed line
  },
  cache: {
    color: 'amber',
    strokeWidth: 2,
    label: 'Redis',
    dashed: true,
  },
}`}
        showLineNumbers={false}
      />

      <h2 id="complete-example">Complete Example</h2>
      <p>
        Here's a complete diagram configuration:
      </p>

      <CodeBlock
        language="typescript"
        filename="src/diagrams/web-architecture.ts"
        code={`import type { ArcDiagramData } from '@arach/arc'

const diagram: ArcDiagramData = {
  id: 'ARCH.WEB.001',
  layout: { width: 700, height: 350 },

  nodes: {
    client:   { x: 50,  y: 120, size: 'm' },
    gateway:  { x: 250, y: 120, size: 'l' },
    service:  { x: 500, y: 60,  size: 'm' },
    database: { x: 500, y: 200, size: 'm' },
  },

  nodeData: {
    client:   { icon: 'Monitor',  name: 'Web Client',  subtitle: 'React',    color: 'violet' },
    gateway:  { icon: 'Server',   name: 'API Gateway', subtitle: 'Node.js',  color: 'emerald' },
    service:  { icon: 'Cpu',      name: 'Service',     subtitle: 'Go',       color: 'blue' },
    database: { icon: 'Database', name: 'PostgreSQL',  subtitle: 'Primary',  color: 'amber' },
  },

  connectors: [
    { from: 'client',  to: 'gateway',  fromAnchor: 'right', toAnchor: 'left',   style: 'http' },
    { from: 'gateway', to: 'service',  fromAnchor: 'right', toAnchor: 'left',   style: 'grpc' },
    { from: 'gateway', to: 'database', fromAnchor: 'right', toAnchor: 'left',   style: 'sql' },
  ],

  connectorStyles: {
    http: { color: 'violet',  strokeWidth: 2, label: 'REST' },
    grpc: { color: 'blue',    strokeWidth: 2, label: 'gRPC' },
    sql:  { color: 'amber',   strokeWidth: 2, label: 'SQL', dashed: true },
  },
}

export default diagram`}
      />

      <h2 id="types">TypeScript Types</h2>
      <p>
        Arc exports all types for full TypeScript support:
      </p>

      <CodeBlock
        language="typescript"
        code={`import type {
  ArcDiagramData,
  NodePosition,
  NodeData,
  Connector,
  ConnectorStyle,
  DiagramLayout,
  NodeSize,         // 's' | 'm' | 'l'
  DiagramColor,     // 'violet' | 'emerald' | ...
  AnchorPosition,   // 'left' | 'right' | 'top' | ...
  DiagramMode,      // 'light' | 'dark'
  ThemeId,          // 'default' | 'warm' | 'cool' | 'mono'
} from '@arach/arc'`}
        showLineNumbers={false}
      />
    </DocsLayout>
  )
}
