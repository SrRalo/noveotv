import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'tizen-compat',
      closeBundle() {
        const dist = path.resolve(__dirname, 'dist')
        const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf-8')
        fs.writeFileSync(
          path.join(dist, 'index.html'),
          html
            .replace(/\s*crossorigin/g, '')
            .replace(/<script type="module"/g, '<script')
        )
      },
    },
  ],
  build: {
    target: 'es2015',
    cssTarget: 'chrome49',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
