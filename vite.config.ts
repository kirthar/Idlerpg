import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: necesario para Capacitor (file://) y GitHub Pages (subruta)
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
});
