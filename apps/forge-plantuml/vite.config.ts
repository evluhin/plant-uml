import { defineConfig } from 'vite';
import { svelte } from '@svelte/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: 'static',
    rollupOptions: {
      input: {
        editor: 'src/editor.html'
      }
    }
  },
  server: {
    port: 3000
  }
});