import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/Compliance-Tool/' : '/',
  server: {
    proxy: {
      '/log360-proxy': {
        target: process.env.VITE_LOG360_DEV_TARGET || 'http://localhost:8400',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/log360-proxy/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    clearMocks: true,
    restoreMocks: true,
  },
})
