// vite.config.js

import vitePluginString from 'vite-plugin-string'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vitePluginString()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
