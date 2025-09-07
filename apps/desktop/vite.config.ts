import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  base: './',
  server: {
    port: 3000,
    host: '127.0.0.1',
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB
    rollupOptions: {
      external: [
        // Externalize Node.js modules that shouldn't be bundled for renderer
        'pg',
        'pg-pool', 
        'pg-connection-string',
        'pgpass',
        'split2',
      ],
      output: {
        // Optimize chunking to reduce bundle size warnings
        manualChunks: {
          // Separate vendor libraries
          vendor: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit'],
          // Separate UI components
          ui: ['lucide-react'],
          // Separate core business logic
          core: ['@serenity/core'],
          // Separate database layer (should be minimal in renderer)
          database: ['@serenity/database'],
        },
        // Reduce chunk names for cleaner builds
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
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
