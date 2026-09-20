#!/usr/bin/env bun
/**
 * Bundle the Arc CLI for the published `arc` bin.
 * Dev: `bun scripts/arc-cli.ts check diagram.json`
 */
import { chmodSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outfile = join(root, 'bin/arc.mjs')

const result = await Bun.build({
  entrypoints: [join(root, 'scripts/arc-cli.ts')],
  outdir: join(root, 'bin'),
  naming: 'arc.mjs',
  target: 'node',
  format: 'esm',
  banner: '#!/usr/bin/env node',
})

if (!result.success) {
  console.error('build:cli failed')
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

chmodSync(outfile, 0o755)
console.log('built bin/arc.mjs')
