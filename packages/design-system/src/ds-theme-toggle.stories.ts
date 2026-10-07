import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

const meta: Meta = {
  title: 'Componentes/ds-theme-toggle',
  component: 'ds-theme-toggle',
};
export default meta;

// O próprio botão troca o tema da página: clique para ver os dois estados.
export const Padrao: StoryObj = {
  name: 'Padrão',
  render: () => html`<ds-theme-toggle label="Tema escuro"></ds-theme-toggle>`,
};
