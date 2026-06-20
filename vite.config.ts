import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/db': path.resolve(__dirname, 'db'),
      '@/types': path.resolve(__dirname, 'src/types/index.ts'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
    },
  },
});