import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
  },
  resolve: {
    alias: {
      '@demo/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  optimizeDeps: {
    include: ['@ant-design/icons', '@ant-design/icons-svg'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
})
