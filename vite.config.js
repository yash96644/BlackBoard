import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: false,

    esbuildOptions: {
      drop: ['console', 'debugger'],
      legalComments: 'none',
    },

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-core';
          if (id.includes('node_modules/@supabase')) return 'supabase';
          if (id.includes('node_modules/lucide-react')) return 'icons';
          if (id.includes('node_modules/perfect-freehand')) return 'drawing';
          if (id.includes('node_modules/jspdf')) return 'pdf';
          if (id.includes('node_modules/zustand')) return 'state';
        },
        chunkFileNames:  'assets/[name]-[hash].js',
        entryFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash].[ext]',
      },
    },

    chunkSizeWarningLimit: 1500,
  },

  server: {
    port: 5173,
    strictPort: true,
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      'perfect-freehand',
      'lucide-react',
    ],
  },
});
