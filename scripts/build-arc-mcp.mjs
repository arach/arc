#!/usr/bin/env bun
/**
 * Bundle the MCP server for the published `arc-mcp` bin.
 * Dev: `bun scripts/mcp/server.ts` or `bun run mcp`
 */
import { chmodSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outfile = join(root, 'bin/arc-mcp.mjs')

const result = await Bun.build({
  entrypoints: [join(root, 'scripts/mcp/server.ts')],
  outdir: join(root, 'bin'),
  naming: 'arc-mcp.mjs',
  target: 'node',
  format: 'esm',
  banner: '#!/usr/bin/env node',
})

if (!result.success) {
  console.error('build:mcp failed')
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

chmodSync(outfile, 0o755)
console.log('built bin/arc-mcp.mjs')
