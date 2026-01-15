import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/player/index.ts', 'src/player/types.ts'],
      outDir: 'dist-player',
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/player/index.ts'),
      name: 'ArcPlayer',
      formats: ['es', 'umd'],
      fileName: (format) => `arc-player.${format}.js`,
    },
    rollupOptions: {
      // Externalize React for the ES build (users provide their own)
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    outDir: 'dist-player',
    minify: 'esbuild',
  },
})
