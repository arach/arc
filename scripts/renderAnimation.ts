import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { diagramFlowDuration } from '../src/utils/flowSvg.ts'
import { THEMES, type ThemeId } from '../src/utils/themes.ts'
import type { ArcDiagramData } from '../src/types/diagram.ts'
import {
  captureChromeScreenshots,
  executable,
  findChrome,
  findOnPath,
  RenderError,
  renderDiagramSvg,
  type RenderMode,
  type RenderSvgOptions,
} from './renderImage.ts'

export type AnimationFormat = 'gif' | 'mp4'

export interface RenderAnimationOptions extends RenderSvgOptions {
  format: AnimationFormat
  /** Capture rate. Defaults to 12 for GIF, 30 for MP4. */
  fps?: number
  /** Seconds to render. Defaults to the longest flow's first full cycle. */
  duration?: number
  scale?: number
  chromePath?: string
  ffmpegPath?: string
  env?: Record<string, string | undefined>
  /** Test seam for frame capture; receives executable + argument list. */
  runChrome?: (executable: string, args: string[]) => Promise<void>
  /** Test seam for encoding; receives executable + argument list. */
  runFfmpeg?: (executable: string, args: string[]) => Promise<void>
}

export interface RenderedAnimation {
  data: Buffer
  format: AnimationFormat
  width: number
  height: number
  scale: number
  fps: number
  duration: number
  frames: number
  chrome: string
  ffmpeg: string
  theme?: ThemeId
  mode?: RenderMode
}

const DEFAULT_FPS: Record<AnimationFormat, number> = { gif: 12, mp4: 30 }
const MAX_FPS = 60
const MAX_DURATION = 120
const MAX_ANIMATION_PIXELS = 64_000_000
const FFMPEG_TIMEOUT_MS = 60_000

function finite(value: number | undefined, fallback: number, name: string): number {
  const resolved = value ?? fallback
  if (!Number.isFinite(resolved)) {
    throw new RenderError('render/invalid-option', `${name} must be finite`, [`pass a finite ${name}`])
  }
  return resolved
}

function assertFps(value: number | undefined, format: AnimationFormat): number {
  const fps = finite(value, DEFAULT_FPS[format], 'fps')
  if (fps <= 0 || fps > MAX_FPS) {
    throw new RenderError('render/invalid-option', `fps must be > 0 and <= ${MAX_FPS}`, [`use --fps <= ${MAX_FPS}`])
  }
  return fps
}

function assertDuration(value: number | undefined, inferred: number): number {
  const duration = finite(value, inferred, 'duration')
  if (duration <= 0 || duration > MAX_DURATION) {
    throw new RenderError('render/invalid-option', `duration must be > 0 and <= ${MAX_DURATION}`, [`use --duration <= ${MAX_DURATION}`])
  }
  return duration
}

function assertAnimationScale(value: number | undefined): number {
  const scale = finite(value, 2, 'scale')
  if (scale <= 0 || scale > 4) {
    throw new RenderError('render/invalid-option', 'scale must be > 0 and <= 4', ['use scale <= 4'])
  }
  return scale
}

export function findFfmpeg(env: Record<string, string | undefined> = process.env, platform: string = process.platform): string | null {
  for (const key of ['ARC_FFMPEG', 'FFMPEG_PATH']) {
    const value = env[key]
    if (value && ['0', 'false', 'none', 'off'].includes(value.toLowerCase())) return null
    const resolved = executable(value)
    if (resolved) return resolved
  }
  return findOnPath('ffmpeg', env, platform)
}

async function runFfmpeg(ffmpeg: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new RenderError('render/ffmpeg-timeout', `ffmpeg did not finish within ${FFMPEG_TIMEOUT_MS}ms`, ['rerun the render', 'set ARC_FFMPEG to a different ffmpeg executable']))
    }, FFMPEG_TIMEOUT_MS)
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf8') })
    child.on('error', err => {
      clearTimeout(timer)
      reject(err)
    })
    child.on('exit', code => {
      clearTimeout(timer)
      if (code === 0) resolve()
      else reject(new RenderError('render/animation-empty', `ffmpeg exited ${code}${stderr ? `: ${stderr.trim()}` : ''}`, ['check the rendered PNG frames', 'set ARC_FFMPEG to a different ffmpeg executable']))
    })
  })
}

function htmlForFrame(svg: string, theme: ThemeId | undefined, backgroundColor: string): string {
  const fontLink = theme && THEMES[theme].brand?.fontImport
    ? `<link rel="stylesheet" href="${THEMES[theme].brand!.fontImport}">`
    : ''
  return `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:${backgroundColor}}svg{display:block}</style>${fontLink}${svg}`
}

/** Render a flow diagram as a deterministic animated GIF or MP4. Each frame is
 *  a static SVG at `flowTime = frame / fps`, captured by one Chrome session,
 *  then encoded by ffmpeg. */
export async function renderDiagramAnimation(diagram: ArcDiagramData, options: RenderAnimationOptions): Promise<RenderedAnimation> {
  if (options.format !== 'gif' && options.format !== 'mp4') {
    throw new RenderError('render/invalid-option', 'format must be gif or mp4', ['use gif or mp4'])
  }
  const fps = assertFps(options.fps, options.format)
  const duration = assertDuration(options.duration, diagramFlowDuration(diagram))
  const scale = assertAnimationScale(options.scale)
  const frameCount = Math.max(2, Math.ceil(duration * fps) + 1)
  const chrome = options.chromePath ? executable(options.chromePath) : findChrome(options.env)
  if (!chrome) {
    throw new RenderError('render/chrome-unavailable', 'Chrome or Chromium is unavailable for animation frames', ['install Chrome or Chromium', 'set ARC_CHROME to a Chrome or Chromium executable'])
  }
  const ffmpeg = options.ffmpegPath ? executable(options.ffmpegPath) : findFfmpeg(options.env)
  if (!ffmpeg) {
    throw new RenderError('render/ffmpeg-unavailable', 'ffmpeg is unavailable for animation encoding', ['install ffmpeg', 'set ARC_FFMPEG to an ffmpeg executable'])
  }

  const dir = mkdtempSync(join(tmpdir(), 'arc-animation-'))
  try {
    const frameUrls: string[] = []
    let width = 0
    let height = 0
    let theme: ThemeId | undefined
    let mode: RenderMode | undefined
    let backgroundColor = '#ffffff'

    for (let i = 0; i < frameCount; i++) {
      const flowTime = Math.min(duration, i / fps)
      const rendered = renderDiagramSvg(diagram, {
        ...options,
        animateFlows: false,
        flowTime,
      })
      if (i === 0) {
        width = rendered.width
        height = rendered.height
        theme = rendered.theme
        mode = rendered.mode
        backgroundColor = rendered.backgroundColor
        const pixelCount = width * height * scale * scale
        if (pixelCount > MAX_ANIMATION_PIXELS) {
          throw new RenderError('render/png-too-large', `Animation frames would be ${Math.round(width * scale)}x${Math.round(height * scale)} (${Math.round(pixelCount)}px)`, ['lower --scale', 'use a smaller layout or exportZone'])
        }
      }
      const htmlPath = join(dir, `frame-${String(i).padStart(4, '0')}.html`)
      writeFileSync(htmlPath, htmlForFrame(rendered.svg, theme, backgroundColor), 'utf8')
      frameUrls.push(pathToFileURL(htmlPath).href)
    }

    const frames = options.runChrome
      ? await (async () => {
          const buffers: Buffer[] = []
          for (let i = 0; i < frameUrls.length; i++) {
            const pngPath = join(dir, `frame-${String(i).padStart(4, '0')}.png`)
            await options.runChrome!(chrome, [
              '--headless', '--disable-gpu', '--disable-dev-shm-usage', '--disable-background-networking',
              '--disable-sync', '--disable-extensions', '--hide-scrollbars', '--mute-audio', '--no-first-run',
              '--no-sandbox', '--run-all-compositor-stages-before-draw', '--virtual-time-budget=8000',
              `--force-device-scale-factor=${scale}`, `--window-size=${width},${height}`,
              `--screenshot=${pngPath}`, frameUrls[i],
            ])
            buffers.push(readFileSync(pngPath))
          }
          return buffers
        })()
      : await captureChromeScreenshots(chrome, dir, frameUrls, width, height, scale)

    if (frames.length !== frameCount) {
      throw new RenderError('render/animation-empty', `Chrome produced ${frames.length}/${frameCount} frames`, ['rerun the render'])
    }
    for (let i = 0; i < frames.length; i++) {
      writeFileSync(join(dir, `frame-${String(i).padStart(4, '0')}.png`), frames[i])
    }

    const output = join(dir, `animation.${options.format}`)
    const input = join(dir, 'frame-%04d.png')
    const args = options.format === 'gif'
      ? ['-y', '-framerate', String(fps), '-i', input, '-vf', `fps=${fps},scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=full[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4`, '-loop', '0', output]
      : ['-y', '-framerate', String(fps), '-i', input, '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-movflags', '+faststart', output]
    if (options.runFfmpeg) await options.runFfmpeg(ffmpeg, args)
    else await runFfmpeg(ffmpeg, args)

    const data = readFileSync(output)
    if (!data.length) {
      throw new RenderError('render/animation-empty', `ffmpeg produced an empty ${options.format}`, ['rerun the render'])
    }
    return { data, format: options.format, width, height, scale, fps, duration, frames: frameCount, chrome, ffmpeg, theme, mode }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
