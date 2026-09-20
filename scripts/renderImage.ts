import { spawn } from 'node:child_process'
import { accessSync, constants, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { generateSVG } from '../src/utils/exportUtils.ts'
import type { ArcDiagramData } from '../src/types/diagram.ts'

export interface RenderSvgOptions {
  backgroundColor?: string
  includeGrid?: boolean
  padding?: number
}

export interface RenderedSvg {
  svg: string
  width: number
  height: number
}

export interface RenderPngOptions extends RenderSvgOptions {
  chromePath?: string
  scale?: number
  runChrome?: (executable: string, args: string[]) => Promise<void>
}

export interface RenderedPng {
  png: Buffer
  width: number
  height: number
  scale: number
  chrome: string
}

export class RenderError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly supportedFixes: string[] = [],
  ) {
    super(message)
  }
}

const DEFAULT_PADDING = 20
const DEFAULT_SCALE = 2
const MAX_SCALE = 4
const MAX_PNG_PIXELS = 64_000_000
const CHROME_TIMEOUT_MS = 15_000
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function assertNumber(value: number | undefined, fallback: number, name: string): number {
  const resolved = value ?? fallback
  if (!Number.isFinite(resolved)) throw new RenderError('render/invalid-option', `${name} must be finite`, [`pass a finite ${name}`])
  return resolved
}

function assertPadding(value: number | undefined): number {
  const padding = assertNumber(value, DEFAULT_PADDING, 'padding')
  if (padding < 0) throw new RenderError('render/invalid-option', 'padding must be >= 0', ['use padding >= 0'])
  return Math.round(padding)
}

function assertScale(value: number | undefined): number {
  const scale = assertNumber(value, DEFAULT_SCALE, 'scale')
  if (scale <= 0 || scale > MAX_SCALE) {
    throw new RenderError('render/invalid-option', `scale must be > 0 and <= ${MAX_SCALE}`, [`use scale <= ${MAX_SCALE}`])
  }
  return scale
}

type ExportZone = { x: number; y: number; width: number; height: number }

function exportBounds(diagram: ArcDiagramData): ExportZone {
  // ArcDiagramData omits exportZone, but existing saved files may still carry it.
  const zone = (diagram as ArcDiagramData & { exportZone?: ExportZone | null }).exportZone
  if (zone == null) return { x: 0, y: 0, width: diagram.layout.width, height: diagram.layout.height }
  if (![zone.x, zone.y, zone.width, zone.height].every(Number.isFinite) || zone.width <= 0 || zone.height <= 0) {
    throw new RenderError('render/invalid-diagram', 'exportZone must contain finite x, y, width, and height values', ['remove exportZone or replace it with valid bounds'])
  }
  return zone
}

export function renderDiagramSvg(diagram: ArcDiagramData, options: RenderSvgOptions = {}): RenderedSvg {
  const padding = assertPadding(options.padding)
  const backgroundColor = options.backgroundColor ?? '#ffffff'
  if (typeof backgroundColor !== 'string' || !/^(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)$/.test(backgroundColor)) {
    throw new RenderError('render/invalid-option', 'backgroundColor must be a hex or CSS named color', ['use #ffffff, #00000000, or a CSS color name'])
  }

  const bounds = exportBounds(diagram)
  return {
    svg: generateSVG(diagram, { ...options, backgroundColor, padding }),
    width: Math.round(bounds.width + padding * 2),
    height: Math.round(bounds.height + padding * 2),
  }
}

function executable(file: string | undefined): string | null {
  if (!file) return null
  try {
    accessSync(file, constants.X_OK)
    return file
  } catch {
    return null
  }
}

function findOnPath(command: string, env: Record<string, string | undefined>, platform: string): string | null {
  const pathValue = env.PATH ?? env.Path ?? ''
  const extensions = platform === 'win32'
    ? String(env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';')
    : ['']

  for (const directory of pathValue.split(delimiter).filter(Boolean)) {
    for (const extension of extensions) {
      const suffix = command.toLowerCase().endsWith(extension.toLowerCase()) ? '' : extension
      const resolved = executable(join(directory, `${command}${suffix}`))
      if (resolved) return resolved
    }
  }
  return null
}

export function findChrome(
  env: Record<string, string | undefined> = process.env,
  platform: string = process.platform,
): string | null {
  for (const key of ['ARC_CHROME', 'CHROME_PATH', 'PUPPETEER_EXECUTABLE_PATH']) {
    const resolved = executable(env[key])
    if (resolved) return resolved
  }

  const fixed: string[] = []
  const commands: string[] = []
  if (platform === 'darwin') {
    fixed.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    )
  } else if (platform === 'win32') {
    for (const root of [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter((value): value is string => Boolean(value))) {
      fixed.push(
        join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        join(root, 'Chromium', 'Application', 'chrome.exe'),
        join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      )
    }
    commands.push('chrome', 'msedge')
  } else {
    commands.push('google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome')
  }

  for (const candidate of fixed) {
    const resolved = executable(candidate)
    if (resolved) return resolved
  }
  for (const command of commands) {
    const resolved = findOnPath(command, env, platform)
    if (resolved) return resolved
  }
  return null
}

async function runChromeProcess(executablePath: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(executablePath, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new RenderError(
        'render/chrome-timeout',
        `Chrome did not finish within ${CHROME_TIMEOUT_MS}ms`,
        ['rerun the render', 'set ARC_CHROME to a different Chrome or Chromium executable'],
      ))
    }, CHROME_TIMEOUT_MS)

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
      if (stderr.length > 8_000) stderr = stderr.slice(-8_000)
    })
    child.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) resolve()
      else reject(new RenderError(
        'render/png-capture-failed',
        `Chrome exited with status ${code}${stderr ? `: ${stderr.trim()}` : ''}`,
        ['set ARC_CHROME to a Chrome or Chromium executable and rerun the render'],
      ))
    })
  })
}

export async function renderDiagramPng(diagram: ArcDiagramData, options: RenderPngOptions = {}): Promise<RenderedPng> {
  const rendered = renderDiagramSvg(diagram, options)
  const scale = assertScale(options.scale)
  const pixelCount = rendered.width * rendered.height * scale * scale
  if (pixelCount > MAX_PNG_PIXELS) {
    throw new RenderError(
      'render/png-too-large',
      `PNG would be ${Math.round(rendered.width * scale)}x${Math.round(rendered.height * scale)} (${Math.round(pixelCount)}px), above the ${MAX_PNG_PIXELS}px cap`,
      ['lower --scale', 'use a smaller layout or exportZone'],
    )
  }

  const chrome = options.chromePath ? executable(options.chromePath) : findChrome()
  if (!chrome) {
    throw new RenderError(
      'render/chrome-unavailable',
      'Chrome or Chromium is unavailable for PNG rasterization',
      ['install Chrome or Chromium', 'set ARC_CHROME to a Chrome or Chromium executable'],
    )
  }

  const dir = mkdtempSync(join(tmpdir(), 'arc-render-'))
  const svgPath = join(dir, 'diagram.svg')
  const pngPath = join(dir, 'diagram.png')
  try {
    writeFileSync(svgPath, rendered.svg, 'utf8')
    const args = [
      '--headless',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-background-networking',
      '--disable-sync',
      '--disable-extensions',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-first-run',
      '--no-sandbox',
      '--run-all-compositor-stages-before-draw',
      `--force-device-scale-factor=${scale}`,
      `--window-size=${rendered.width},${rendered.height}`,
      `--screenshot=${pngPath}`,
      pathToFileURL(svgPath).href,
    ]
    await (options.runChrome ?? runChromeProcess)(chrome, args)

    const png = readFileSync(pngPath)
    if (png.length < PNG_SIGNATURE.length || !png.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
      throw new RenderError(
        'render/png-empty',
        'Chrome did not produce a PNG',
        ['rerun the render', 'set ARC_CHROME to a different Chrome or Chromium executable'],
      )
    }
    return { png, width: rendered.width, height: rendered.height, scale, chrome }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
