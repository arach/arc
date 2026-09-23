#!/usr/bin/env bun
/**
 * Bundle the MCP server for the published `arc-mcp` bin.
 * Dev: `bun src/server.ts` or `bun run dev`
 */
import { chmodSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const outfile = join(root, 'dist/arc-mcp.mjs')

const result = await Bun.build({
  entrypoints: [join(root, 'src/server.ts')],
  outdir: join(root, 'dist'),
  naming: 'arc-mcp.mjs',
  target: 'node',
  format: 'esm',
  banner: '#!/usr/bin/env node',
})

if (!result.success) {
  console.error('build failed')
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

chmodSync(outfile, 0o755)
console.log('built dist/arc-mcp.mjs')
