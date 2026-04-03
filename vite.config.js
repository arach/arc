import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { resolve } from 'path'
import { existsSync, readFileSync, statSync } from 'fs'
import captureMiddleware from './plugins/captureMiddleware.js'

const __dirname = new URL('.', import.meta.url).pathname

export default defineConfig(({ mode }) => {
  // Dogfood: In production, use the pre-built library (lib/) to catch regressions
  // This requires running `pnpm build:lib` first before `pnpm build`
  const libPath = resolve(__dirname, 'lib/arc.es.js')
  const libExists = existsSync(libPath)
  const useBuiltLib = mode === 'production' && libExists

  // Error if production build is attempted without pre-built library
  if (mode === 'production' && !libExists) {
    throw new Error(
      'Production build requires pre-built library. Run `pnpm build:lib` first.\n' +
      `Expected file at: ${libPath}`
    )
  }

  return {
    base: '/',
    plugins: [
      react(),
      tailwindcss(),
      captureMiddleware(),
      {
        name: 'arc-dev-file-loader',
        configureServer(server) {
          server.middlewares.use('/__arc/dev/file', (req, res, next) => {
            try {
              const url = new URL(req.url || '', 'http://127.0.0.1')
              const filePath = url.searchParams.get('path')
              if (!filePath) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Missing path query param' }))
                return
              }

              const stats = statSync(filePath)
              if (!stats.isFile()) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Path is not a file' }))
                return
              }

              const content = readFileSync(filePath, 'utf8')
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(content)
            } catch (error) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                error: error instanceof Error ? error.message : 'Failed to load file',
              }))
            }
          })
        },
      },
      visualizer({ open: false, gzipSize: true, filename: 'bundle-stats.html' }),
    ],
    resolve: {
      alias: {
        '@arach/arc': useBuiltLib ? libPath : resolve(__dirname, 'src/index.ts'),
      },
    },
    server: {
      port: 5188,
      strictPort: true,
    },
    build: {
      rollupOptions: {
        input: {
          main: './index.html',
        },
      },
    },
  }
})
