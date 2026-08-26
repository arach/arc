import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import {
  autoLayout,
  createAutoLayout,
  renderAscii,
  validateDiagramShape,
  isDiagramShape,
  toTypeScriptSource,
  type ArcDiagramData,
  type ArcDiagram,
} from './arc.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const diagramSchema = z.record(z.unknown())

function parseDiagram(value: unknown, label = 'diagram'): ArcDiagramData {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value
  const problem = validateDiagramShape(parsed)
  if (problem) throw new Error(`${label}: ${problem}`)
  return parsed as ArcDiagramData
}

function editorBaseUrl(): string {
  return process.env.ARC_EDITOR_URL || 'http://localhost:5188'
}

function encodeHashData(diagram: ArcDiagramData): string {
  return Buffer.from(JSON.stringify(diagram), 'utf8').toString('base64')
}

function generateSessionId(): string {
  return randomBytes(4).toString('hex')
}

async function readRepoFile(...segments: string[]): Promise<string> {
  // dist/server.js → packages/mcp/dist; repo root is three levels up
  const root = join(__dirname, '..', '..', '..')
  return readFile(join(root, ...segments), 'utf8')
}

export function createArcMcpServer(): McpServer {
  const server = new McpServer({
    name: 'arc',
    version: '0.1.0',
  })

  server.tool(
    'validate_diagram',
    'Check whether a JSON value is a valid ArcDiagramData document. Returns ok:true or a human-readable error.',
    {
      diagram: diagramSchema.describe('Arc diagram JSON object or JSON string'),
    },
    async ({ diagram }) => {
      try {
        const value = typeof diagram === 'string' ? JSON.parse(diagram) : diagram
        const problem = validateDiagramShape(value)
        if (problem) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ ok: false, error: problem }, null, 2) }],
          }
        }
        return {
          content: [{ type: 'text', text: JSON.stringify({ ok: true }, null, 2) }],
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          content: [{ type: 'text', text: JSON.stringify({ ok: false, error: message }, null, 2) }],
          isError: true,
        }
      }
    },
  )

  server.tool(
    'auto_layout',
    'Run Arc auto-layout on a diagram. Pass a full diagram or minimal input (nodeData + connectors + connectorStyles).',
    {
      input: diagramSchema.describe('Full ArcDiagramData or AutoDiagramInput (nodeData, connectors, connectorStyles)'),
    },
    async ({ input }) => {
      try {
        const value = typeof input === 'string' ? JSON.parse(input) : input
        let result: ArcDiagramData

        if (isDiagramShape(value)) {
          result = autoLayout(value as ArcDiagramData)
        } else if (
          value &&
          typeof value === 'object' &&
          'nodeData' in value &&
          'connectors' in value &&
          'connectorStyles' in value
        ) {
          result = createAutoLayout(value as Parameters<typeof createAutoLayout>[0])
        } else {
          throw new Error('Expected ArcDiagramData or AutoDiagramInput (nodeData, connectors, connectorStyles)')
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: message }, null, 2) }],
          isError: true,
        }
      }
    },
  )

  server.tool(
    'render_ascii',
    'Render an Arc diagram as monospace ASCII/Unicode box art.',
    {
      diagram: diagramSchema.describe('Valid ArcDiagramData JSON'),
      charset: z.enum(['unicode', 'ascii']).optional().describe('Character set (default: unicode)'),
      maxWidth: z.number().int().positive().optional().describe('Max output width in characters'),
    },
    async ({ diagram, charset, maxWidth }) => {
      try {
        const data = parseDiagram(diagram)
        const ascii = renderAscii(data, {
          charset: charset ?? 'unicode',
          maxWidth,
        })
        return { content: [{ type: 'text', text: ascii }] }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          content: [{ type: 'text', text: message }],
          isError: true,
        }
      }
    },
  )

  server.tool(
    'diagram_to_typescript',
    'Convert a valid Arc diagram JSON into a TypeScript module that exports ArcDiagramData.',
    {
      diagram: diagramSchema.describe('Valid ArcDiagramData JSON'),
      exportName: z.string().optional().describe('Const name (default: diagram)'),
    },
    async ({ diagram, exportName }) => {
      try {
        const data = parseDiagram(diagram)
        const source = toTypeScriptSource(data as ArcDiagram, exportName ?? 'diagram')
        return { content: [{ type: 'text', text: source }] }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          content: [{ type: 'text', text: message }],
          isError: true,
        }
      }
    },
  )

  server.tool(
    'editor_handoff',
    'Build URLs to open a diagram in the Arc studio. Returns a hash-based editor URL and optional showcase link.',
    {
      diagram: diagramSchema.describe('Valid ArcDiagramData JSON'),
      sessionId: z.string().optional().describe('Session id (generated if omitted)'),
      baseUrl: z.string().url().optional().describe('Studio base URL (default: ARC_EDITOR_URL or http://localhost:5188)'),
    },
    async ({ diagram, sessionId, baseUrl }) => {
      try {
        const data = parseDiagram(diagram)
        const id = sessionId ?? generateSessionId()
        const origin = baseUrl ?? editorBaseUrl()
        const hash = encodeHashData(data)
        const editorUrl = `${origin}/editor/${id}#data=${hash}`
        const showcaseUrl = `${origin}/showcase`

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              sessionId: id,
              editorUrl,
              showcaseUrl,
              note: 'Open editorUrl in a browser with the Arc dev server running (bun run dev). The hash seeds the diagram; the session id is for bookmarking after load.',
              diagram: data,
            }, null, 2),
          }],
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          content: [{ type: 'text', text: message }],
          isError: true,
        }
      }
    },
  )

  server.resource(
    'schema',
    'arc://schema/diagram',
    { description: 'ArcDiagramData TypeScript schema excerpt', mimeType: 'text/plain' },
    async () => {
      const text = await readRepoFile('src', 'types', 'diagram.ts')
      return { contents: [{ uri: 'arc://schema/diagram', mimeType: 'text/plain', text }] }
    },
  )

  server.resource(
    'skill',
    'arc://skill/diagrams',
    { description: 'Arc diagram generation skill for agents', mimeType: 'text/markdown' },
    async () => {
      const text = await readRepoFile('skills', 'arc-diagrams', 'SKILL.md')
      return { contents: [{ uri: 'arc://skill/diagrams', mimeType: 'text/markdown', text }] }
    },
  )

  server.resource(
    'llm',
    'arc://docs/llm',
    { description: 'Dense LLM briefing (docs/llm.txt)', mimeType: 'text/plain' },
    async () => {
      const text = await readRepoFile('docs', 'llm.txt')
      return { contents: [{ uri: 'arc://docs/llm', mimeType: 'text/plain', text }] }
    },
  )

  return server
}

export async function runArcMcpServer(): Promise<void> {
  const server = createArcMcpServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}
