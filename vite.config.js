import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8093',
        changeOrigin: true,
        headers: { origin: 'http://localhost:5173' },
      },
    },
  },
})
