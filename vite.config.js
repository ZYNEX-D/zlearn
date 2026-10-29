import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    minify: true,
    cssMinify: true,
    sourcemap: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        practicals: resolve(import.meta.dirname, 'practicals.html'),
        builder: resolve(import.meta.dirname, 'builder.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }
        }
      }
    }
  },
  server: {
    port: 4173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  }
});
