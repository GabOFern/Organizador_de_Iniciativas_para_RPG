import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api e /hubs para a API local — permite um único túnel ngrok no Vite.
export default defineConfig({
  plugins: [react()],
  server: {
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
