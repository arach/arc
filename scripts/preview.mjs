#!/usr/bin/env node
/**
 * Arc Diagram Preview - Quick iteration tool for agents
 *
 * Usage:
 *   node scripts/preview.mjs <session-id> [options]
 *
 * Options:
 *   --screenshot <path>  Output path (default: /tmp/arc-preview.png)
 *   --player             Screenshot the player view (default: editor)
 *   --port <n>           Dev server port (default: 5188)
 *   --width <n>          Viewport width (default: 1200)
 *   --height <n>         Viewport height (default: 700)
 *   --set <json>         Merge JSON updates into the session diagram
 *   --load <hash-url>    Load a diagram from a hash URL first
 *   --seed <json-file>   Seed localStorage from a JSON session file
 *
 * Agent iteration workflow:
 *   # 1. First time: load diagram via hash, screenshot player
 *   node scripts/preview.mjs operate-control-001 --load "http://...#data=..." --player --screenshot /tmp/v1.png
 *
 *   # 2. Iterate: update nodes, screenshot again
 *   node scripts/preview.mjs operate-control-001 --set '{"nodes":{"api":{"x":100,"y":100,"size":"l"}}}' --player --screenshot /tmp/v2.png
 */

import puppeteer from 'puppeteer'
import { readFileSync } from 'fs'

const args = process.argv.slice(2)
const sessionId = args[0]

function getArg(flag, defaultVal) {
  const idx = args.indexOf(flag)
  return idx >= 0 ? args[idx + 1] : defaultVal
}

const screenshotPath = getArg('--screenshot', '/tmp/arc-preview.png')
const port = getArg('--port', '5188')
const setData = getArg('--set', null)
const loadUrl = getArg('--load', null)
const seedFile = getArg('--seed', null)
const playerMode = args.includes('--player')
const width = parseInt(getArg('--width', '1200'))
const height = parseInt(getArg('--height', '700'))

if (!sessionId) {
  console.error('Usage: node scripts/preview.mjs <session-id> [--screenshot path] [--player] [--set json] [--load hash-url] [--seed file]')
  process.exit(1)
}

const STORAGE_KEY = `arc-session-${sessionId}`
const baseUrl = `http://localhost:${port}`

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width, height })

  // Step 1: Load the app to get access to localStorage
  if (loadUrl) {
    // Load via hash URL — this triggers the app's hash parsing + localStorage save
    await page.goto(loadUrl, { waitUntil: 'networkidle0', timeout: 15000 })
    await new Promise(r => setTimeout(r, 2000))
    console.error(`Loaded diagram from hash URL → session: ${sessionId}`)
  } else {
    await page.goto(`${baseUrl}/editor`, { waitUntil: 'networkidle0', timeout: 10000 })
  }

  // Step 2: Seed from file if provided
  if (seedFile) {
    const data = JSON.parse(readFileSync(seedFile, 'utf-8'))
    await page.evaluate((key, data) => {
      localStorage.setItem(key, JSON.stringify({ ...data, updatedAt: Date.now() }))
    }, STORAGE_KEY, data)
    console.error(`Seeded session from: ${seedFile}`)
  }

  // Step 3: Apply --set updates
  if (setData) {
    const updates = JSON.parse(setData)
    await page.evaluate((key, updates) => {
      const raw = localStorage.getItem(key)
      if (!raw) {
        console.error('No existing session to update')
        return
      }
      const session = JSON.parse(raw)
      if (updates.nodes) session.diagram.nodes = { ...session.diagram.nodes, ...updates.nodes }
      if (updates.nodeData) session.diagram.nodeData = { ...session.diagram.nodeData, ...updates.nodeData }
      if (updates.connectors) session.diagram.connectors = updates.connectors
      if (updates.connectorStyles) session.diagram.connectorStyles = { ...session.diagram.connectorStyles, ...updates.connectorStyles }
      if (updates.layout) session.diagram.layout = { ...session.diagram.layout, ...updates.layout }
      if (updates.groups) session.diagram.groups = updates.groups
      if (updates.themeId !== undefined) session.themeId = updates.themeId
      if (updates.colorMode !== undefined) session.colorMode = updates.colorMode
      session.updatedAt = Date.now()
      localStorage.setItem(key, JSON.stringify(session))
    }, STORAGE_KEY, updates)
    console.error(`Updated session: ${sessionId}`)
  }

  // Step 4: Navigate to target view and screenshot
  const targetUrl = playerMode
    ? `${baseUrl}/player/${sessionId}`
    : `${baseUrl}/editor/${sessionId}`

  await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 10000 })
  await new Promise(r => setTimeout(r, 2000))

  await page.screenshot({ path: screenshotPath })
  // Output just the path to stdout (for piping)
  console.log(screenshotPath)

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
