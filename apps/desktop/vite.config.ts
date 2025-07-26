import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  base: './',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    global: 'globalThis',
    'process.env': '{}',
    'process.platform': '"browser"',
    'process.version': '"v16.0.0"',
    'process.versions': '{}',
    'process.nextTick': 'setTimeout',
    'process.browser': 'true',
    'process.title': '"browser"',
    'process.argv': '[]',
    'process.cwd': '() => "/"',
    'process.stderr': '{}',
    'process.stdout': '{}',
    'process.stdin': '{}',
  },
});