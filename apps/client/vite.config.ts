import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'ws://localhost:3005',
        ws: true,
        changeOrigin: true
      }
    }
  }
});
