import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the demo from /soft75/
  base: process.env.VITE_DEMO === 'true' ? '/soft75/' : '/',
  server: {
    port: 5173,
    // Send /api calls to the Express server during development
    proxy: { '/api': 'http://localhost:3001' },
  },
  test: { environment: 'jsdom' },
});
