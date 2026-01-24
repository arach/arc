import { useState } from 'react'
import DocsLayout, { type DocSection } from './DocsLayout'
import { ArcDiagram, type ThemeId, type DiagramMode, getThemeList } from '@arach/arc'

// Sample diagram for previewing themes
const sampleDiagram = {
  id: 'THEME.PREVIEW',
  layout: { width: 600, height: 280 },
  nodes: {
    frontend: { x: 50, y: 80, size: 'm' as const },
    api: { x: 250, y: 80, size: 'm' as const },
    database: { x: 450, y: 80, size: 'm' as const },
  },
  nodeData: {
    frontend: { icon: 'Monitor', name: 'Frontend', subtitle: 'React', color: 'violet' as const },
    api: { icon: 'Server', name: 'API', subtitle: 'Node.js', color: 'emerald' as const },
    database: { icon: 'Database', name: 'Database', subtitle: 'PostgreSQL', color: 'blue' as const },
  },
  connectors: [
    { from: 'frontend', to: 'api', fromAnchor: 'right' as const, toAnchor: 'left' as const, style: 'http' },
    { from: 'api', to: 'database', fromAnchor: 'right' as const, toAnchor: 'left' as const, style: 'query' },
  ],
  connectorStyles: {
    http: { color: 'violet' as const, strokeWidth: 2, label: 'HTTP' },
    query: { color: 'blue' as const, strokeWidth: 2, label: 'SQL' },
  },
}

const sections: DocSection[] = [
  { id: 'overview', title: 'Overview', level: 2 },
  { id: 'available-themes', title: 'Available Themes', level: 2 },
  { id: 'theme-default', title: 'Default', level: 3 },
  { id: 'theme-warm', title: 'Warm', level: 3 },
  { id: 'theme-cool', title: 'Cool', level: 3 },
  { id: 'theme-mono', title: 'Mono', level: 3 },
  { id: 'usage', title: 'Usage', level: 2 },
  { id: 'theme-structure', title: 'Theme Structure', level: 2 },
]

interface ThemesPageProps {
  currentPage: string
  onNavigate: (page: string) => void
  onBack: () => void
}

export default function ThemesPage({ currentPage, onNavigate, onBack }: ThemesPageProps) {
  const [previewTheme, setPreviewTheme] = useState<ThemeId>('default')
  const [previewMode, setPreviewMode] = useState<DiagramMode>('light')
  const themes = getThemeList()

  return (
    <DocsLayout
      title="Themes"
      description="Color palettes and background treatments that adapt to light and dark modes."
      badge="Styling"
      badgeColor="violet"
      sections={sections}
      currentPage={currentPage}
      onNavigate={onNavigate}
      onBack={onBack}
    >
      <h2 id="overview">Overview</h2>
      <p>
        Themes control the <strong>color palette</strong> and <strong>background treatment</strong> of
        your diagrams. Unlike templates (which control structure), themes are purely visual—they
        determine how colors are applied to nodes, connectors, and the canvas.
      </p>
      <p>
        Each theme provides both light and dark mode variants, so your diagrams look great
        in any context.
      </p>

      {/* Interactive preview */}
      <div className="my-8 not-prose">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setPreviewTheme(t.id as ThemeId)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  previewTheme === t.id
                    ? 'bg-violet-100 text-violet-700 border border-violet-300'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 bg-zinc-100 rounded-lg">
            <button
              onClick={() => setPreviewMode('light')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                previewMode === 'light' ? 'bg-white shadow-sm' : 'text-zinc-500'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setPreviewMode('dark')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                previewMode === 'dark' ? 'bg-white shadow-sm' : 'text-zinc-500'
              }`}
            >
              Dark
            </button>
          </div>
        </div>
        <ArcDiagram
          data={sampleDiagram}
          theme={previewTheme}
          mode={previewMode}
          interactive={false}
        />
      </div>

      <h2 id="available-themes">Available Themes</h2>
      <p>
        Arc ships with four built-in themes, each designed for different contexts and aesthetics.
      </p>

      <h3 id="theme-default">Default</h3>
      <p>
        Clean, neutral colors that work in most contexts. This is the default theme if none is specified.
        Uses standard Tailwind color palette with balanced saturation.
      </p>

      <h3 id="theme-warm">Warm</h3>
      <p>
        Soft, editorial warmth inspired by paper and print design. Features amber and stone tones
        in the background, with slightly muted accent colors. Great for documentation with a
        friendly, approachable feel.
      </p>

      <h3 id="theme-cool">Cool</h3>
      <p>
        Crisp, modern blues with a technical aesthetic. Uses slate and indigo tones throughout.
        Well-suited for engineering documentation and technical diagrams where you want a
        professional, precise look.
      </p>

      <h3 id="theme-mono">Mono</h3>
      <p>
        Elegant grayscale that strips away color distractions. All nodes render in zinc/gray tones,
        making structure the focus. Useful for printing, accessibility contexts, or when you want
        diagrams to blend seamlessly with black-and-white documents.
      </p>

      <h2 id="usage">Usage</h2>
      <p>
        Pass the <code>theme</code> prop to the ArcDiagram component along with <code>mode</code>
        for light/dark appearance:
      </p>

      <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto">
        <code>{`import { ArcDiagram } from '@arach/arc'
import diagram from './my-diagram'

// Light mode with warm theme
<ArcDiagram
  data={diagram}
  mode="light"
  theme="warm"
/>

// Dark mode with cool theme
<ArcDiagram
  data={diagram}
  mode="dark"
  theme="cool"
/>`}</code>
      </pre>

      <p>
        The <code>mode</code> prop controls light/dark appearance (adapts to user preference),
        while <code>theme</code> controls the color palette applied within that mode.
      </p>

      <h2 id="theme-structure">Theme Structure</h2>
      <p>
        Each theme defines colors for both light and dark modes. Here's the structure:
      </p>

      <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{`interface Theme {
  id: ThemeId
  name: string
  description: string
  light: {
    palette: ColorPalette    // Colors for each accent (violet, emerald, etc.)
    background: {
      container: string      // Container background classes
      grid: {
        color: string        // Dot grid color
        opacity: number      // Grid opacity
        size: number         // Grid spacing
      }
    }
    text: {
      primary: string        // Main text color
      secondary: string      // Secondary text
      muted: string          // Muted text
    }
  }
  dark: { /* Same structure */ }
}`}</code>
      </pre>

      <p>
        The <code>palette</code> defines how each of the 8 accent colors (violet, emerald, blue,
        amber, sky, zinc, rose, orange) render. Each accent specifies border, background, icon,
        and stroke colors.
      </p>
    </DocsLayout>
  )
}
