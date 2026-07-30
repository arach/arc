import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const __dirname = new URL('.', import.meta.url).pathname

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'hudson-html',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/' || req.url === '/index.html') {
            req.url = '/hudson.html'
          }
          next()
        })
      },
    },
  ],
  server: { port: 5189 },
  build: {
    outDir: 'dist-hudson',
    rollupOptions: {
      input: resolve(__dirname, 'hudson.html'),
    },
  },
})
