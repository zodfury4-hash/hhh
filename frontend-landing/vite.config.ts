import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'zustand'],
          'motion-vendor': ['framer-motion', 'gsap', 'lenis', 'lucide-react'],
          'three-core': ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
