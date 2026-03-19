import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@api': path.resolve(__dirname, './src/api'),
      '@components': path.resolve(__dirname, './src/components'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@views': path.resolve(__dirname, './src/views'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
})
