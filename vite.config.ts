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
        const match = html.match(/<script[^>]*src="[^"]+"[^>]*><\/script>/)
        if (!match) return

        const scriptTag = match[0].replace(/\s*crossorigin/g, '').replace(' type="module"', '')
        const clean = html
          .replace(match[0], '')
          .replace(/\s*crossorigin/g, '')
          .replace('</body>', `${scriptTag}\n</body>`)

        fs.writeFileSync(path.join(dist, 'index.html'), clean)
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
