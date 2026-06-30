import { ExternalLink } from 'lucide-react'

interface Project {
  name: string
  description: string
  url?: string
  usage: string
  features: string[]
}

const projects: Project[] = [
  {
    name: 'Operate',
    description: 'Control-plane service for machine-aware agent routing.',
    usage: 'Architecture diagrams embedded in Astro documentation with dark/light mode toggle and interactive zoom.',
    features: ['Theme switching', 'Edit-in-Arc button', 'Multiple diagrams per page'],
  },
  {
    name: 'Lattices',
    description: 'Agentic window manager for macOS.',
    url: 'https://lattices.dev',
    usage: 'System architecture diagram on the marketing site with expand/collapse for responsive viewports.',
    features: ['Fullscreen expand', 'Fit-to-container zoom', 'Dark mode'],
  },
  {
    name: 'Fabric',
    description: 'Lightweight sandboxes for agentic workloads.',
    url: 'https://fabric.sh',
    usage: 'Multiple diagrams across docs pages showing adapters, context layers, and system overview.',
    features: ['Light/dark variants', 'Non-interactive embeds', 'Multiple diagram types'],
  },
]

export default function Showcase() {
  return (
    <div style={{ marginTop: '2rem' }}>
      <h3
        style={{
          fontSize: '13px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#888',
          marginBottom: '12px',
        }}
      >
        Arc in production
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {projects.map((p) => (
          <div
            key={p.name}
            style={{
              padding: '14px 16px',
              borderRadius: '5px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              background: '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#101518' }}>
                {p.name}
              </span>
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#888', display: 'flex' }}
                >
                  <ExternalLink style={{ width: 12, height: 12 }} />
                </a>
              )}
              <span style={{ fontSize: '12px', color: '#888', marginLeft: 'auto' }}>
                {p.description}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#555', margin: 0, lineHeight: 1.5 }}>
              {p.usage}
            </p>
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
              {p.features.map((f) => (
                <span
                  key={f}
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    background: 'rgba(0, 0, 0, 0.04)',
                    color: '#666',
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
