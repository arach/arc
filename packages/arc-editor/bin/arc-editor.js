#!/usr/bin/env node

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import express from 'express'
import open from 'open'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PORT = process.env.PORT || 5188
const distPath = join(__dirname, '..', 'dist')

// Check if dist exists
if (!existsSync(distPath)) {
  console.error('Error: Editor assets not found. Please rebuild the package.')
  process.exit(1)
}

const app = express()

// Serve static files from dist
app.use(express.static(distPath))

// SPA fallback - serve index.html for all routes
app.get('/{*path}', (req, res) => {
  res.sendFile(join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`
  console.log('')
  console.log('  \x1b[35m╭─────────────────────────────────────╮\x1b[0m')
  console.log('  \x1b[35m│\x1b[0m                                     \x1b[35m│\x1b[0m')
  console.log('  \x1b[35m│\x1b[0m   \x1b[1mArc Editor\x1b[0m                        \x1b[35m│\x1b[0m')
  console.log('  \x1b[35m│\x1b[0m   Visual architecture diagram editor \x1b[35m│\x1b[0m')
  console.log('  \x1b[35m│\x1b[0m                                     \x1b[35m│\x1b[0m')
  console.log(`  \x1b[35m│\x1b[0m   Local:   \x1b[36m${url}\x1b[0m      \x1b[35m│\x1b[0m`)
  console.log('  \x1b[35m│\x1b[0m                                     \x1b[35m│\x1b[0m')
  console.log('  \x1b[35m╰─────────────────────────────────────╯\x1b[0m')
  console.log('')

  // Open browser
  open(url)
})
