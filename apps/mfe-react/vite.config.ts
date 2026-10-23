import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // O modo biblioteca não substitui process.env; sem isto o bundle quebra no navegador.
  define: command === 'build' ? { 'process.env.NODE_ENV': JSON.stringify('production') } : {},
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2,
        pure_getters: true,
      },
      mangle: {
        toplevel: true,
      },
      format: {
        comments: false,
      },
    },
    lib: {
      entry: {
        'pt-br': 'src/entries/pt-br.ts',
        en: 'src/entries/en.ts',
        es: 'src/entries/es.ts',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}/mfe.js`,
    },
  },
}));
