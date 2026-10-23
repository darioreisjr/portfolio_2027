import { defineConfig } from 'vite';

// Bundle único, com o Lit dentro: é a única cópia carregada por documento (ADR 0003).
// Fica fora de vite.config.ts para o Storybook não herdar o modo biblioteca.
export default defineConfig({
  // Recursos estáticos compartilhados (bandeiras) vão para o dist como estão (ADR 0006).
  publicDir: 'assets',
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
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'ds.js',
    },
    // tsc escreve dist/types depois; o watch não pode apagá-los.
    emptyOutDir: false,
  },
});
