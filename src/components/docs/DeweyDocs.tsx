import React from 'react'
import { DocsLayout, MarkdownContent } from '@arach/dewey'
import type { NavGroup } from '@arach/dewey'

// Import markdown files as raw strings
import overviewMd from '../../../docs/overview.md?raw'
import quickstartMd from '../../../docs/quickstart.md?raw'
import apiMd from '../../../docs/api.md?raw'
import examplesMd from '../../../docs/examples.md?raw'
import architectureMd from '../../../docs/architecture.md?raw'
import agentsMd from '../../../docs/AGENTS.md?raw'

// Map page IDs to content
const pages: Record<string, { content: string; title: string; description: string }> = {
  overview: {
    content: overviewMd,
    title: 'Overview',
    description: 'Arc is a React library for rendering architecture diagrams',
  },
  quickstart: {
    content: quickstartMd,
    title: 'Quickstart',
    description: 'Get started with Arc in 5 minutes',
  },
  api: {
    content: apiMd,
    title: 'API Reference',
    description: 'Complete API reference for Arc components and types',
  },
  examples: {
    content: examplesMd,
    title: 'Examples',
    description: 'Real-world diagram examples',
  },
  architecture: {
    content: architectureMd,
    title: 'Architecture',
    description: 'How the Arc editor is built',
  },
  llm: {
    content: agentsMd,
    title: 'LLM & Agents',
    description: 'Agent-friendly documentation for AI coding assistants',
  },
}

// Navigation structure
const navigation: NavGroup[] = [
  {
    title: 'Getting Started',
    items: [
      { id: 'overview', title: 'Overview' },
      { id: 'quickstart', title: 'Quickstart' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { id: 'api', title: 'API Reference' },
      { id: 'examples', title: 'Examples' },
      { id: 'architecture', title: 'Architecture' },
    ],
  },
  {
    title: 'AI & Agents',
    items: [
      { id: 'llm', title: 'LLM Docs' },
    ],
  },
]

// Get ordered list of page IDs for prev/next navigation
const pageOrder = navigation.flatMap(g => g.items.map(i => i.id))

interface DeweyDocsProps {
  pageId: string
}

export default function DeweyDocs({ pageId }: DeweyDocsProps) {
  const page = pages[pageId] || pages.overview

  // Calculate prev/next
  const currentIndex = pageOrder.indexOf(pageId)
  const prevPage = currentIndex > 0
    ? { id: pageOrder[currentIndex - 1], title: pages[pageOrder[currentIndex - 1]]?.title || '' }
    : undefined
  const nextPage = currentIndex < pageOrder.length - 1
    ? { id: pageOrder[currentIndex + 1], title: pages[pageOrder[currentIndex + 1]]?.title || '' }
    : undefined

  return (
    <DocsLayout
      title={page.title}
      description={page.description}
      navigation={navigation}
      projectName="Arc"
      basePath="/docs"
      homeUrl="/"
      prevPage={prevPage}
      nextPage={nextPage}
    >
      <MarkdownContent content={page.content} />
    </DocsLayout>
  )
}
