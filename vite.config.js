// vite.config.js

import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [glsl()],
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://songmap.io' 
          : 'http://localhost:5001',
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
});