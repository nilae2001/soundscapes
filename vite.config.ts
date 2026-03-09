import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'stub-isomorphic-fetch',
      resolveId(id) {
        if (id === 'isomorphic-fetch') return '\0isomorphic-fetch';
      },
      load(id) {
        if (id === '\0isomorphic-fetch') return 'export default {};';
      }
    }
  ],
  base: '/soundscapes/',
  define: {
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  }
});