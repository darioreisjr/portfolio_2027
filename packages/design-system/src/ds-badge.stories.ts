import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

const meta: Meta = {
  title: 'Componentes/ds-badge',
  component: 'ds-badge',
};
export default meta;

export const Padrao: StoryObj = {
  name: 'Padrão',
  render: () => html`<ds-badge>Olá</ds-badge>`,
};
