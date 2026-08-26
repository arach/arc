import { runArcMcpServer } from './server.js'

runArcMcpServer().catch((err) => {
  console.error('arc-mcp failed:', err)
  process.exit(1)
})
