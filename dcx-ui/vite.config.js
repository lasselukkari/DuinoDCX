import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })],
  server: {
    proxy: {
      '/api': {
        target: 'http://duinodcx.herokuapp.com',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
