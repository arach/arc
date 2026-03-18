/**
 * Vite dev server middleware: /capture/:sessionId → PNG screenshot
 *
 * GET  /capture/:sessionId                    → capture from existing browser session
 * GET  /capture/:sessionId?hash=<base64>      → load via hash URL first, then capture
 * POST /capture/:sessionId  {diagram JSON}    → seed diagram data, then capture
 *
 * Query params:
 *   ?width=900&height=500   — viewport size (default: 1000x560)
 *   ?mode=editor            — capture editor view instead of player
 */

let puppeteerModule = null

async function getPuppeteer() {
  if (!puppeteerModule) {
    puppeteerModule = await import('puppeteer')
  }
  return puppeteerModule.default
}

// Persistent browser for fast captures
let browserInstance = null
let browserCloseTimer = null

async function getBrowser() {
  if (browserInstance) {
    clearTimeout(browserCloseTimer)
    browserCloseTimer = setTimeout(closeBrowser, 60000)
    return browserInstance
  }
  const puppeteer = await getPuppeteer()
  browserInstance = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  browserCloseTimer = setTimeout(closeBrowser, 60000)
  return browserInstance
}

function closeBrowser() {
  if (browserInstance) {
    browserInstance.close().catch(() => {})
    browserInstance = null
  }
}

export default function captureMiddleware() {
  return {
    name: 'arc-capture',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')

        if (!url.pathname.startsWith('/capture/')) return next()

        const sessionId = url.pathname.slice('/capture/'.length)
        if (!sessionId) {
          res.statusCode = 400
          res.end('Usage: /capture/<session-id>')
          return
        }

        const explicitWidth = url.searchParams.get('width')
        const explicitHeight = url.searchParams.get('height')
        const viewMode = url.searchParams.get('mode') || 'player'
        const hashData = url.searchParams.get('hash') || null
        const port = server.config.server.port || 5188
        const baseUrl = `http://localhost:${port}`

        // Read POST body if present
        let postBody = null
        if (req.method === 'POST') {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          postBody = Buffer.concat(chunks).toString()
        }

        try {
          const browser = await getBrowser()
          const page = await browser.newPage()

          // Default viewport — will be refined from diagram metadata after seeding
          let width = parseInt(explicitWidth) || 1000
          let height = parseInt(explicitHeight) || 560
          await page.setViewport({ width, height })

          // Step 1: Seed localStorage if we have data
          if (hashData || postBody) {
            if (hashData) {
              await page.goto(`${baseUrl}/editor#data=${hashData}`, { waitUntil: 'networkidle0', timeout: 12000 })
            } else if (postBody) {
              await page.goto(`${baseUrl}/editor`, { waitUntil: 'networkidle0', timeout: 10000 })
              await page.evaluate((key, json) => {
                const data = JSON.parse(json)
                data.updatedAt = Date.now()
                localStorage.setItem(key, JSON.stringify(data))
              }, `arc-session-${sessionId}`, postBody)
            }
            await new Promise(r => setTimeout(r, 1500))
          }

          // Step 2: Read viewport from session metadata if no explicit size given
          if (!explicitWidth || !explicitHeight) {
            const sessionViewport = await page.evaluate((key) => {
              const raw = localStorage.getItem(key)
              if (!raw) return null
              try {
                const session = JSON.parse(raw)
                return session.diagramMeta?.viewport || null
              } catch { return null }
            }, `arc-session-${sessionId}`)

            if (sessionViewport) {
              // Use the source site's measured viewport + some padding for chrome
              width = parseInt(explicitWidth) || sessionViewport.width + 80
              height = parseInt(explicitHeight) || sessionViewport.height + 120
              await page.setViewport({ width, height })
            }
          }

          // Step 3: Navigate to target view
          const targetUrl = viewMode === 'editor'
            ? `${baseUrl}/editor/${sessionId}`
            : `${baseUrl}/player/${sessionId}`

          await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 10000 })
          await new Promise(r => setTimeout(r, 1500))

          // Step 3: Screenshot and return
          const screenshot = await page.screenshot({ type: 'png' })
          await page.close()

          res.setHeader('Content-Type', 'image/png')
          res.setHeader('Content-Disposition', `inline; filename="${sessionId}.png"`)
          res.setHeader('Cache-Control', 'no-cache')
          res.end(screenshot)
        } catch (err) {
          console.error('Capture error:', err.message)
          res.statusCode = 500
          res.end(`Capture failed: ${err.message}`)
        }
      })
    },
  }
}
