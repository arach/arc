#!/usr/bin/env node

/**
 * arc-ascii — Render Arc diagram JSON as monospace ASCII art.
 *
 * Usage:
 *   node bin/arc-ascii.mjs diagram.json
 *   cat diagram.json | node bin/arc-ascii.mjs
 *   node bin/arc-ascii.mjs diagram.json --charset ascii
 *   node bin/arc-ascii.mjs diagram.json --max-width 80
 */

import { readFileSync } from 'node:fs'

// Dynamic import so we can use the source TS via tsx or the built lib
const { renderAscii } = await import('../src/utils/asciiRenderer.ts').catch(() =>
  import('../lib/arc.es.js')
)

// ── Parse args ──────────────────────────────

const args = process.argv.slice(2)
let filePath = null
const opts = {}

for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--charset' || a === '-c') { opts.charset = args[++i]; continue }
  if (a === '--max-width' || a === '-w') { opts.maxWidth = Number(args[++i]); continue }
  if (a === '--no-labels') { opts.showLabels = false; continue }
  if (a === '--scale-x') { opts.scaleX = Number(args[++i]); continue }
  if (a === '--scale-y') { opts.scaleY = Number(args[++i]); continue }
  if (a === '--help' || a === '-h') { printHelp(); process.exit(0) }
  if (!a.startsWith('-')) filePath = a
}

// ── Read input ──────────────────────────────

let json
try {
  if (filePath) {
    json = readFileSync(filePath, 'utf-8')
  } else if (!process.stdin.isTTY) {
    // Read from stdin
    const chunks = []
    for await (const chunk of process.stdin) chunks.push(chunk)
    json = Buffer.concat(chunks).toString('utf-8')
  } else {
    printHelp()
    process.exit(1)
  }
} catch (err) {
  console.error(`Error reading input: ${err.message}`)
  process.exit(1)
}

// ── Parse & render ──────────────────────────

let data
try {
  data = JSON.parse(json)
} catch {
  // Try extracting a JS object from a TS/JS module
  const match = json.match(/(?:export\s+default\s+|(?:const|let|var)\s+\w+(?::\s*\S+)?\s*=\s*)(\{[\s\S]*\})/)
  if (match) {
    try {
      // Convert JS object literal to JSON
      const normalized = match[1]
        .replace(/'/g, '"')
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
      data = JSON.parse(normalized)
    } catch {
      console.error('Error: Could not parse diagram data.')
      process.exit(1)
    }
  } else {
    console.error('Error: Input is not valid JSON or a recognizable diagram module.')
    process.exit(1)
  }
}

if (!data.layout || !data.nodes || !data.nodeData) {
  console.error('Error: Input does not look like ArcDiagramData (missing layout, nodes, or nodeData).')
  process.exit(1)
}

// Default connectorStyles to empty if missing
if (!data.connectorStyles) data.connectorStyles = {}

console.log(renderAscii(data, opts))

// ── Help ────────────────────────────────────

function printHelp() {
  console.log(`
arc-ascii — Render Arc diagrams as ASCII art

Usage:
  arc-ascii <file.json>              Read diagram from file
  cat diagram.json | arc-ascii       Read from stdin

Options:
  -c, --charset <unicode|ascii>      Character set (default: unicode)
  -w, --max-width <cols>             Max output width in columns
      --no-labels                    Hide connector labels
      --scale-x <n>                  Pixels per char horizontally (default: 8)
      --scale-y <n>                  Pixels per char vertically (default: 16)
  -h, --help                         Show this help
`.trim())
}
