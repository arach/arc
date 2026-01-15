import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    visualizer({ open: false, gzipSize: true, filename: 'bundle-stats.html' }),
  ],
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
})
