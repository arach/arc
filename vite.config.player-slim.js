import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/player/index.slim.ts'),
      name: 'ArcPlayer',
      formats: ['es', 'umd'],
      fileName: (format) => `arc-player-slim.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    outDir: 'dist-player',
    emptyOutDir: false,
    minify: 'esbuild',
  },
})
