import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import path from 'path'
import { mkdirSync, existsSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

// Ensure public directory exists
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true })
}

// Main OG image HTML
const mainOGHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1200px;
      height: 630px;
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f7f3ec;
      position: relative;
      overflow: hidden;
    }

    .grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image:
        linear-gradient(rgba(16, 21, 24, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(16, 21, 24, 0.04) 1px, transparent 1px);
      background-size: 60px 60px;
    }

    .accent-glow-1 {
      position: absolute;
      top: -100px;
      left: -100px;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(240, 124, 79, 0.2) 0%, transparent 70%);
    }

    .accent-glow-2 {
      position: absolute;
      bottom: -150px;
      right: -150px;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(240, 124, 79, 0.15) 0%, transparent 70%);
    }

    .content {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      padding: 80px 100px;
      height: 100%;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 60px;
    }

    .logo-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #f07c4f;
      box-shadow: 0 0 0 6px rgba(240, 124, 79, 0.15);
    }

    .logo-text {
      font-family: 'Fraunces', serif;
      font-size: 42px;
      font-weight: 600;
      color: #101518;
    }

    .headline {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .headline-line {
      font-family: 'Fraunces', serif;
      font-size: 72px;
      font-weight: 600;
      line-height: 1.1;
      color: #101518;
    }

    .headline-accent {
      color: #f07c4f;
    }

    .tagline {
      font-size: 26px;
      color: #5c676c;
      margin-top: 40px;
      max-width: 600px;
    }

    .features {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-top: auto;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      background: rgba(16, 21, 24, 0.04);
      font-size: 15px;
      font-weight: 500;
      color: #5c676c;
    }

    .bottom-accent {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #f07c4f, #f2a071);
    }
  </style>
</head>
<body>
  <div class="grid-overlay"></div>
  <div class="accent-glow-1"></div>
  <div class="accent-glow-2"></div>

  <div class="content">
    <div class="logo">
      <div class="logo-dot"></div>
      <span class="logo-text">Arc</span>
    </div>

    <div class="headline">
      <span class="headline-line">Visual Diagram</span>
      <span class="headline-line headline-accent">Editor</span>
    </div>

    <div class="tagline">Design architecture diagrams visually. Export clean, declarative configs.</div>

    <div class="features">
      <div class="feature">Drag & Drop</div>
      <div class="feature">JSON Export</div>
      <div class="feature">Light & Dark</div>
    </div>
  </div>

  <div class="bottom-accent"></div>
</body>
</html>
`

// Docs OG image HTML
const docsOGHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1200px;
      height: 630px;
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f7f3ec;
      position: relative;
      overflow: hidden;
    }

    .grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image:
        linear-gradient(rgba(16, 21, 24, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(16, 21, 24, 0.04) 1px, transparent 1px);
      background-size: 60px 60px;
    }

    .accent-glow {
      position: absolute;
      top: -100px;
      right: -100px;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(240, 124, 79, 0.15) 0%, transparent 70%);
    }

    .content {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      padding: 80px 100px;
      height: 100%;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 60px;
    }

    .logo-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #f07c4f;
      box-shadow: 0 0 0 6px rgba(240, 124, 79, 0.15);
    }

    .logo-text {
      font-family: 'Fraunces', serif;
      font-size: 42px;
      font-weight: 600;
      color: #101518;
    }

    .divider {
      width: 1px;
      height: 28px;
      background: rgba(16, 21, 24, 0.15);
      margin: 0 8px;
    }

    .docs-label {
      font-size: 14px;
      font-weight: 700;
      color: #5c676c;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }

    .headline {
      font-family: 'Fraunces', serif;
      font-size: 64px;
      font-weight: 600;
      line-height: 1.15;
      color: #101518;
    }

    .subtitle {
      font-size: 28px;
      color: #5c676c;
      margin-top: 20px;
      max-width: 700px;
    }

    .features {
      display: flex;
      align-items: center;
      gap: 40px;
      margin-top: auto;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .feature-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f07c4f;
    }

    .feature-text {
      font-size: 18px;
      color: #5c676c;
    }

    .bottom-accent {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #f07c4f, #f2a071);
    }
  </style>
</head>
<body>
  <div class="grid-overlay"></div>
  <div class="accent-glow"></div>

  <div class="content">
    <div class="logo">
      <div class="logo-dot"></div>
      <span class="logo-text">Arc</span>
      <div class="divider"></div>
      <span class="docs-label">DOCS</span>
    </div>

    <div class="headline">Arc Documentation</div>
    <div class="subtitle">Everything you need to create beautiful architecture diagrams</div>

    <div class="features">
      <div class="feature">
        <div class="feature-dot"></div>
        <span class="feature-text">Quickstart Guide</span>
      </div>
      <div class="feature">
        <div class="feature-dot"></div>
        <span class="feature-text">Format Reference</span>
      </div>
      <div class="feature">
        <div class="feature-dot"></div>
        <span class="feature-text">Agent-Friendly</span>
      </div>
    </div>
  </div>

  <div class="bottom-accent"></div>
</body>
</html>
`

// Doc page factory
function docPageHtml(title, description) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1200px;
      height: 630px;
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f7f3ec;
      position: relative;
      overflow: hidden;
    }

    .grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image:
        linear-gradient(rgba(16, 21, 24, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(16, 21, 24, 0.04) 1px, transparent 1px);
      background-size: 60px 60px;
    }

    .accent-glow {
      position: absolute;
      bottom: -100px;
      left: -100px;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(240, 124, 79, 0.12) 0%, transparent 70%);
    }

    .content {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      padding: 80px 100px;
      height: 100%;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 60px;
    }

    .logo-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #f07c4f;
      box-shadow: 0 0 0 5px rgba(240, 124, 79, 0.15);
    }

    .logo-text {
      font-family: 'Fraunces', serif;
      font-size: 36px;
      font-weight: 600;
      color: #101518;
    }

    .divider {
      width: 1px;
      height: 24px;
      background: rgba(16, 21, 24, 0.15);
      margin: 0 8px;
    }

    .docs-label {
      font-size: 12px;
      font-weight: 700;
      color: #5c676c;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }

    .title {
      font-family: 'Fraunces', serif;
      font-size: 56px;
      font-weight: 600;
      line-height: 1.2;
      color: #101518;
      max-width: 900px;
    }

    .description {
      font-size: 24px;
      color: #5c676c;
      margin-top: 24px;
      max-width: 700px;
      line-height: 1.5;
    }

    .bottom-accent {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #f07c4f, #f2a071);
    }
  </style>
</head>
<body>
  <div class="grid-overlay"></div>
  <div class="accent-glow"></div>

  <div class="content">
    <div class="logo">
      <div class="logo-dot"></div>
      <span class="logo-text">Arc</span>
      <div class="divider"></div>
      <span class="docs-label">DOCS</span>
    </div>

    <div class="title">${title}</div>
    <div class="description">${description}</div>
  </div>

  <div class="bottom-accent"></div>
</body>
</html>
`
}

async function generateOGImage(html, filename) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 })

  await page.setContent(html, { waitUntil: 'networkidle0' })

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const outputPath = path.join(publicDir, filename)

  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  })

  await browser.close()
  console.log(`✓ Generated ${filename}`)
}

// Landing page OG - marketing focused
const landingOGHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1200px;
      height: 630px;
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f7f3ec;
      position: relative;
      overflow: hidden;
    }

    .grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image:
        linear-gradient(rgba(16, 21, 24, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(16, 21, 24, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
    }

    .accent-glow-1 {
      position: absolute;
      top: -200px;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(240, 124, 79, 0.25) 0%, transparent 60%);
    }

    .accent-glow-2 {
      position: absolute;
      bottom: -200px;
      left: 20%;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(31, 122, 101, 0.12) 0%, transparent 70%);
    }

    .accent-glow-3 {
      position: absolute;
      bottom: -150px;
      right: 10%;
      width: 350px;
      height: 350px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(46, 95, 165, 0.1) 0%, transparent 70%);
    }

    .content {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 60px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 48px;
    }

    .logo-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #f07c4f;
      box-shadow: 0 0 0 8px rgba(240, 124, 79, 0.15);
    }

    .logo-text {
      font-family: 'Fraunces', serif;
      font-size: 56px;
      font-weight: 600;
      color: #101518;
    }

    .tagline {
      font-family: 'Fraunces', serif;
      font-size: 42px;
      font-weight: 500;
      color: #101518;
      line-height: 1.3;
      max-width: 800px;
      margin-bottom: 40px;
    }

    .tagline-accent {
      color: #f07c4f;
    }

    .subtitle {
      font-size: 22px;
      color: #5c676c;
      max-width: 600px;
    }

    .bottom-accent {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #1f7a65, #f07c4f, #2e5fa5);
    }
  </style>
</head>
<body>
  <div class="grid-overlay"></div>
  <div class="accent-glow-1"></div>
  <div class="accent-glow-2"></div>
  <div class="accent-glow-3"></div>

  <div class="content">
    <div class="logo">
      <div class="logo-dot"></div>
      <span class="logo-text">Arc</span>
    </div>

    <div class="tagline">
      Design once, <span class="tagline-accent">export everywhere</span>
    </div>

    <div class="subtitle">
      Visual architecture diagrams with clean, declarative configs
    </div>
  </div>

  <div class="bottom-accent"></div>
</body>
</html>
`

// Editor page OG - shows the product
const editorOGHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1200px;
      height: 630px;
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #101518;
      position: relative;
      overflow: hidden;
    }

    .grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
    }

    .accent-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 800px;
      height: 800px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(240, 124, 79, 0.08) 0%, transparent 50%);
    }

    .content {
      position: relative;
      z-index: 10;
      display: flex;
      height: 100%;
      padding: 48px;
      gap: 48px;
    }

    .left {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
    }

    .logo-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #f07c4f;
      box-shadow: 0 0 0 5px rgba(240, 124, 79, 0.2);
    }

    .logo-text {
      font-family: 'Fraunces', serif;
      font-size: 32px;
      font-weight: 600;
      color: #f3f4f6;
    }

    .headline {
      font-family: 'Fraunces', serif;
      font-size: 48px;
      font-weight: 600;
      color: #f3f4f6;
      line-height: 1.15;
      margin-bottom: 20px;
    }

    .headline-accent {
      color: #f07c4f;
    }

    .subtitle {
      font-size: 18px;
      color: #9ca3af;
      line-height: 1.6;
      max-width: 400px;
    }

    .right {
      width: 500px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .editor-preview {
      width: 100%;
      height: 380px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
    }

    .editor-header {
      height: 40px;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 8px;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .dot-red { background: #ff5f56; }
    .dot-yellow { background: #ffbd2e; }
    .dot-green { background: #27ca40; }

    .editor-content {
      padding: 24px;
      display: flex;
      gap: 24px;
      height: calc(100% - 40px);
    }

    .canvas {
      flex: 1;
      background: rgba(247, 243, 236, 0.02);
      border-radius: 8px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .node {
      position: absolute;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .node-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }

    .node-1 { top: 40px; left: 30px; }
    .node-1 .node-icon { background: rgba(240, 124, 79, 0.2); color: #f07c4f; }

    .node-2 { top: 40px; right: 30px; }
    .node-2 .node-icon { background: rgba(31, 122, 101, 0.2); color: #1f7a65; }

    .node-3 { bottom: 40px; left: 50%; transform: translateX(-50%); }
    .node-3 .node-icon { background: rgba(46, 95, 165, 0.2); color: #2e5fa5; }

    .node-label {
      font-size: 12px;
      color: #d1d5db;
      font-weight: 500;
    }

    .connector {
      position: absolute;
      background: rgba(240, 124, 79, 0.4);
      height: 2px;
    }

    .conn-1 {
      top: 60px;
      left: 130px;
      width: 100px;
    }

    .conn-2 {
      top: 100px;
      left: 80px;
      width: 2px;
      height: 80px;
    }

    .sidebar {
      width: 120px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      padding: 12px;
    }

    .sidebar-label {
      font-size: 9px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }

    .sidebar-item {
      height: 24px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      margin-bottom: 6px;
    }

    .bottom-accent {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #f07c4f, #f2a071);
    }
  </style>
</head>
<body>
  <div class="grid-overlay"></div>
  <div class="accent-glow"></div>

  <div class="content">
    <div class="left">
      <div class="logo">
        <div class="logo-dot"></div>
        <span class="logo-text">Arc</span>
      </div>

      <div class="headline">
        Open the <span class="headline-accent">Editor</span>
      </div>

      <div class="subtitle">
        Drag-and-drop diagram builder with real-time preview and JSON export
      </div>
    </div>

    <div class="right">
      <div class="editor-preview">
        <div class="editor-header">
          <div class="dot dot-red"></div>
          <div class="dot dot-yellow"></div>
          <div class="dot dot-green"></div>
        </div>
        <div class="editor-content">
          <div class="canvas">
            <div class="node node-1">
              <div class="node-icon">◈</div>
              <span class="node-label">Client</span>
            </div>
            <div class="node node-2">
              <div class="node-icon">⬡</div>
              <span class="node-label">API</span>
            </div>
            <div class="node node-3">
              <div class="node-icon">▢</div>
              <span class="node-label">Database</span>
            </div>
          </div>
          <div class="sidebar">
            <div class="sidebar-label">Properties</div>
            <div class="sidebar-item"></div>
            <div class="sidebar-item"></div>
            <div class="sidebar-item"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="bottom-accent"></div>
</body>
</html>
`

async function main() {
  console.log('Generating Arc OG images with Puppeteer...\n')

  // Landing page OG image
  await generateOGImage(landingOGHtml, 'og-landing.png')

  // Editor page OG image
  await generateOGImage(editorOGHtml, 'og-editor.png')

  // Main site OG image (existing)
  await generateOGImage(mainOGHtml, 'og-image.png')

  // Docs index OG image
  await generateOGImage(docsOGHtml, 'og-docs.png')

  // Individual doc pages
  await generateOGImage(
    docPageHtml('Quickstart Guide', 'Get started with Arc in minutes. Create your first diagram and export it.'),
    'og-docs-quickstart.png'
  )

  await generateOGImage(
    docPageHtml('Diagram Format', 'Complete reference for Arc diagram JSON schema, nodes, and connectors.'),
    'og-docs-format.png'
  )

  await generateOGImage(
    docPageHtml('LLM & Agent Reference', 'Agent-friendly documentation for AI-assisted diagram generation.'),
    'og-docs-llm.png'
  )

  console.log('\nDone!')
}

main().catch(console.error)
