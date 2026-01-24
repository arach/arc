/**
 * Post-build script to create docs/index.html with proper OG tags
 * Copies the built index.html and replaces meta tags for /docs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')

// Read the built index.html
const indexPath = path.join(distDir, 'index.html')
let html = readFileSync(indexPath, 'utf-8')

// Replace OG meta tags for docs
const replacements = [
  // Title
  [/<title>.*?<\/title>/, '<title>Arc Documentation</title>'],
  [/<meta name="title" content=".*?"/, '<meta name="title" content="Arc Documentation"'],
  [/<meta property="og:title" content=".*?"/, '<meta property="og:title" content="Arc Documentation"'],
  [/<meta property="twitter:title" content=".*?"/, '<meta property="twitter:title" content="Arc Documentation"'],

  // Description
  [/<meta name="description" content=".*?"/, '<meta name="description" content="Everything you need to create beautiful architecture diagrams with Arc."'],
  [/<meta property="og:description" content=".*?"/, '<meta property="og:description" content="Everything you need to create beautiful architecture diagrams with Arc."'],
  [/<meta property="twitter:description" content=".*?"/, '<meta property="twitter:description" content="Everything you need to create beautiful architecture diagrams with Arc."'],

  // URL
  [/<meta property="og:url" content=".*?"/, '<meta property="og:url" content="https://arc.jdi.sh/docs"'],
  [/<meta property="twitter:url" content=".*?"/, '<meta property="twitter:url" content="https://arc.jdi.sh/docs"'],

  // Image
  [/<meta property="og:image" content=".*?"/, '<meta property="og:image" content="https://arc.jdi.sh/og-docs.png"'],
  [/<meta property="twitter:image" content=".*?"/, '<meta property="twitter:image" content="https://arc.jdi.sh/og-docs.png"'],
]

for (const [pattern, replacement] of replacements) {
  html = html.replace(pattern, replacement)
}

// Ensure docs directory exists
const docsDir = path.join(distDir, 'docs')
if (!existsSync(docsDir)) {
  mkdirSync(docsDir, { recursive: true })
}

// Write docs/index.html
writeFileSync(path.join(docsDir, 'index.html'), html)
console.log('✓ Generated dist/docs/index.html with docs OG tags')
