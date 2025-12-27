import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  plugins: [react()],
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
