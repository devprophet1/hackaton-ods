import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const proxy = { '/api': 'http://localhost:3000' };

export default defineConfig({
  plugins: [vue()],
  server: { port: 5173, proxy },
  preview: { proxy },
  optimizeDeps: { entries: ['index.html'] },
});
