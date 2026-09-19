import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const base = process.env.NETLIFY === 'true' ? '/' : (process.env.VITE_BASE_PATH || '/FAB-LAB/');

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { proxy: { '/api': 'http://127.0.0.1:5000', '/docs': 'http://127.0.0.1:5000' } }
});
