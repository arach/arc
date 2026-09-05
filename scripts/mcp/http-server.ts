/**
 * Arc MCP HTTP server — Streamable HTTP transport for remote clients.
 *
 * Dev:  `bun run mcp:http`
 * Prod: `ARC_EDITOR_URL=https://arc-studio.exe.xyz bun scripts/mcp/http-server.ts`
 */
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createArcMcpServer } from './server.ts'

const PORT = Number(process.env.ARC_MCP_PORT || 5190)
const HOST = process.env.ARC_MCP_HOST || '0.0.0.0'

const MCP_HEADERS = [
  'content-type',
  'mcp-session-id',
  'last-event-id',
  'mcp-protocol-version',
]

function corsHeaders(origin: string | null): HeadersInit {
  return {
    'access-control-allow-origin': origin || '*',
    'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
    'access-control-allow-headers': MCP_HEADERS.join(', '),
    'access-control-expose-headers': 'mcp-session-id, mcp-protocol-version',
  }
}

function json(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json')
  return new Response(JSON.stringify(body), { ...init, headers })
}

async function handleMcp(req: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport()
  const server = createArcMcpServer()
  await server.connect(transport)
  const res = await transport.handleRequest(req)
  res.headers.set('access-control-allow-origin', req.headers.get('origin') || '*')
  res.headers.set('access-control-expose-headers', 'mcp-session-id, mcp-protocol-version')
  return res
}

const server = Bun.serve({
  hostname: HOST,
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
    }

    if (url.pathname === '/health') {
      return json({
        ok: true,
        service: 'arc-mcp',
        editor: process.env.ARC_EDITOR_URL || 'http://localhost:5188',
      })
    }

    if (url.pathname === '/mcp') {
      return handleMcp(req)
    }

    return json({ error: 'Not found' }, { status: 404 })
  },
})

console.error(`arc-mcp http listening on http://${HOST}:${server.port}/mcp`)
console.error(`editor handoff base: ${process.env.ARC_EDITOR_URL || 'http://localhost:5188'}`)
