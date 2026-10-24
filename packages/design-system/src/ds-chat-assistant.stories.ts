import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

const meta: Meta = {
  title: 'Componentes/ds-chat-assistant',
  component: 'ds-chat-assistant',
};
export default meta;

export const Padrao: StoryObj = {
  name: 'Padrão (pt-BR)',
  render: () => html`<ds-chat-assistant locale="pt-BR"></ds-chat-assistant>`,
};

export const Ingles: StoryObj = {
  name: 'Inglês (en)',
  render: () => html`<ds-chat-assistant locale="en"></ds-chat-assistant>`,
};

export const Espanhol: StoryObj = {
  name: 'Espanhol (es)',
  render: () => html`<ds-chat-assistant locale="es"></ds-chat-assistant>`,
};
