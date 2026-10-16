import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { clientLogPlugin } from './clientLogPlugin'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(rootDir, '../..')

// Proxy /api e /hubs para a API local — um único túnel (Cloudflare/ngrok) na :5173 basta.
export default defineConfig({
  plugins: [react(), clientLogPlugin(repoRoot)],
  server: {
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'http://localhost:5111',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://localhost:5111',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
