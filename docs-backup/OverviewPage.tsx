import React from 'react'
import { ArrowRight, FileCode, Palette, Layers, GitBranch } from 'lucide-react'
import DocsLayout, { type DocSection } from './DocsLayout'

const sections: DocSection[] = [
  { id: 'what-is-arc', title: 'What is Arc?', level: 2 },
  { id: 'key-concepts', title: 'Key Concepts', level: 2 },
  { id: 'declarative-model', title: 'Declarative Model', level: 3 },
  { id: 'templates-themes', title: 'Templates & Themes', level: 3 },
  { id: 'why-arc', title: 'Why Arc?', level: 2 },
  { id: 'next-steps', title: 'Next Steps', level: 2 },
]

const FeatureCard = ({ icon: Icon, title, description, color }: {
  icon: React.ElementType
  title: string
  description: string
  color: string
}) => (
  <div className="p-4 rounded-lg border border-zinc-200 bg-white not-prose">
    <Icon className={`w-6 h-6 ${color} mb-3`} />
    <h4 className="font-bold text-zinc-900 mb-2">{title}</h4>
    <p className="text-sm text-zinc-600">{description}</p>
  </div>
)

interface OverviewPageProps {
  currentPage: string
  onNavigate: (page: string) => void
  onBack: () => void
}

export default function OverviewPage({ currentPage, onNavigate, onBack }: OverviewPageProps) {
  return (
    <DocsLayout
      title="Overview"
      description="Arc is a visual diagram editor for creating architecture diagrams that are readable, versionable, and ready for docs."
      badge="Introduction"
      badgeColor="violet"
      sections={sections}
      currentPage={currentPage}
      onNavigate={onNavigate}
      onBack={onBack}
    >
      <h2 id="what-is-arc">What is Arc?</h2>
      <p>
        Arc is a diagram editor that bridges the gap between visual design tools and code.
        Instead of exporting opaque image files, Arc outputs clean, declarative configurations
        that can be version-controlled, reviewed in PRs, and rendered anywhere.
      </p>
      <p>
        Think of it as Figma for architecture diagrams—but the output is TypeScript or JSON
        that lives alongside your codebase.
      </p>

      <h2 id="key-concepts">Key Concepts</h2>
      <p>
        Arc is built around a few core ideas that make diagrams maintainable and portable.
      </p>

      <div className="grid md:grid-cols-2 gap-4 my-6 not-prose">
        <FeatureCard
          icon={FileCode}
          title="Declarative Format"
          description="Diagrams are data structures. Nodes, connectors, and styles are all defined in a typed schema."
          color="text-blue-500"
        />
        <FeatureCard
          icon={Layers}
          title="Templates"
          description="Structural presets that define box shapes, line styles, and layout behaviors."
          color="text-amber-500"
        />
        <FeatureCard
          icon={Palette}
          title="Themes"
          description="Color palettes and background treatments. Switch between warm, cool, or mono aesthetics."
          color="text-violet-500"
        />
        <FeatureCard
          icon={GitBranch}
          title="Version Control"
          description="Configs are diff-friendly. Review diagram changes in PRs just like code."
          color="text-emerald-500"
        />
      </div>

      <h3 id="declarative-model">Declarative Model</h3>
      <p>
        Every Arc diagram is represented as a typed data structure. This structure defines:
      </p>
      <ul>
        <li><strong>Layout</strong> — Canvas dimensions and settings</li>
        <li><strong>Nodes</strong> — Positioned elements with size variants</li>
        <li><strong>Node Data</strong> — Labels, icons, colors, and descriptions</li>
        <li><strong>Connectors</strong> — Lines between nodes with anchor points</li>
        <li><strong>Connector Styles</strong> — Named styles for consistent visuals</li>
      </ul>
      <p>
        This separation means you can change how a diagram looks without changing its structure,
        and vice versa.
      </p>

      <h3 id="templates-themes">Templates & Themes</h3>
      <p>
        Arc separates <strong>structure</strong> from <strong>color</strong>:
      </p>
      <ul>
        <li>
          <strong>Templates</strong> control structural aspects—node shapes, border styles,
          connector line weights, and typography.
        </li>
        <li>
          <strong>Themes</strong> control visual aspects—color palettes, background treatments,
          and overall warmth/coolness of the design.
        </li>
      </ul>
      <p>
        This separation lets you maintain brand consistency (via templates) while adapting
        diagrams to different contexts (light mode, dark mode, warm editorial style, etc.).
      </p>

      <h2 id="why-arc">Why Arc?</h2>
      <p>
        Architecture diagrams typically die in slide decks. They get out of sync with the
        actual system, and updating them requires opening a design tool, re-exporting, and
        replacing files manually.
      </p>
      <p>Arc solves this by keeping diagrams:</p>

      <div className="my-6 space-y-4 not-prose">
        <div className="flex gap-4 p-4 rounded-lg border border-zinc-200 bg-white">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">1</div>
          <div>
            <h4 className="font-bold text-zinc-900">In the repo</h4>
            <p className="text-sm text-zinc-600 mt-1">
              Diagram configs live alongside code. They're part of the project, not external artifacts.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 rounded-lg border border-zinc-200 bg-white">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">2</div>
          <div>
            <h4 className="font-bold text-zinc-900">Reviewable</h4>
            <p className="text-sm text-zinc-600 mt-1">
              Changes show up in diffs. Team members can review diagram updates in PRs.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 rounded-lg border border-zinc-200 bg-white">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">3</div>
          <div>
            <h4 className="font-bold text-zinc-900">Reusable</h4>
            <p className="text-sm text-zinc-600 mt-1">
              The same config renders in docs sites, onboarding materials, and anywhere else.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 rounded-lg border border-zinc-200 bg-white">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">4</div>
          <div>
            <h4 className="font-bold text-zinc-900">Up to date</h4>
            <p className="text-sm text-zinc-600 mt-1">
              When you update the source, every consumer gets the change automatically.
            </p>
          </div>
        </div>
      </div>

      <h2 id="next-steps">Next Steps</h2>
      <p>
        Ready to get started? Jump into the quickstart guide or explore the diagram format.
      </p>

      <div className="space-y-3 not-prose">
        <button
          onClick={() => onNavigate('quickstart')}
          className="group w-full flex items-center justify-between p-4 rounded-lg border border-zinc-200 bg-white hover:border-violet-300 transition-colors"
        >
          <div>
            <span className="font-bold text-zinc-900 group-hover:text-violet-600 transition-colors">
              Quickstart Guide
            </span>
            <p className="text-sm text-zinc-600 mt-1">
              Create your first diagram in 5 minutes
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => onNavigate('diagram-format')}
          className="group w-full flex items-center justify-between p-4 rounded-lg border border-zinc-200 bg-white hover:border-violet-300 transition-colors"
        >
          <div>
            <span className="font-bold text-zinc-900 group-hover:text-violet-600 transition-colors">
              Diagram Format
            </span>
            <p className="text-sm text-zinc-600 mt-1">
              Deep dive into the data structure
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    </DocsLayout>
  )
}
