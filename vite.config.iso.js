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
      include: ['src/iso/index.ts', 'src/iso/types.ts'],
      outDir: 'dist-iso',
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/iso/index.ts'),
      name: 'ArcIso',
      formats: ['es', 'umd'],
      fileName: (format) => `arc-iso.${format}.js`,
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
    outDir: 'dist-iso',
    minify: 'esbuild',
  },
})
