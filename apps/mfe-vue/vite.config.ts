import { recruiter } from '@portfolio/content/recruiter';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export const vuePlugin = () =>
  vue({
    template: {
      // Tags do design system são custom elements, não componentes Vue.
      compilerOptions: { isCustomElement: (tag) => tag.startsWith('ds-') },
    },
  });

export default defineConfig(({ command }) => ({
  plugins: [vuePlugin()],
  // O modo biblioteca não substitui process.env; sem isto o bundle quebra no navegador.
  define: {
    ...(command === 'build' ? { 'process.env.NODE_ENV': JSON.stringify('production') } : {}),
    // Sem conteúdo publicado, a página e a biblioteca de animação saem do bundle.
    __HAS_CONTENT__: JSON.stringify(recruiter !== null),
  },
  build: {
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
      fileName: () => 'mfe.js',
    },
  },
}));
