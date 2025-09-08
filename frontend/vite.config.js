import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/gamified-task-manager/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['localhost', '0.0.0.0',],
  },
  test: {
    globals: true,
    environment: 'jsdom',
  }
}))