import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { resolve } from 'path'
import { existsSync } from 'fs'

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
