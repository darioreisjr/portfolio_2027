import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

// Sem custom element: é marcação mais a folha `/_ds/areas.css` (ADR 0009). Esta
// story é a marcação de referência do palco que o shell e o Next.js repetem. A
// arte do personagem não aparece aqui: ela mora no app da home.
type Args = { area: string; title: string };

const meta: Meta<Args> = {
  title: 'Padrões/Palco das páginas internas',
  argTypes: {
    area: {
      control: 'select',
      options: ['recruiter', 'tech', 'client', 'community', 'how-it-was-built'],
    },
  },
  render: ({ area, title }) => html`
    <link rel="stylesheet" href="/_ds/areas.css" />
    <main class="area-stage" data-area=${area}>
      <div class="area-scene" aria-hidden="true">
        <span class="area-scene-back"></span><span class="area-scene-mid"></span
        ><span class="area-scene-front"></span>
        <span class="area-particles"
          ><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i
        ></span>
      </div>
      <h1 class="area-title">${title}</h1>
      <div class="area-outlet">
        <section class="area-message">
          <h2 class="area-message-title">Fase em construção</h2>
          <p class="area-message-text">Esta área ainda está sendo forjada. Volte em breve.</p>
          <div class="area-bar" aria-hidden="true"><span class="area-bar-fill"></span></div>
        </section>
      </div>
      <a class="area-back" href="#home">Voltar à escolha de perfil</a>
    </main>
    <footer class="ds-dock">
      <label class="area-motion" title="Pausar animação">
        <input type="checkbox" aria-label="Pausar animação" />
        <span class="area-motion-disc" aria-hidden="true">
          <svg class="area-motion-pause" viewBox="0 0 16 16">
            <path d="M3 2h4v12H3zM9 2h4v12H9z" />
          </svg>
          <svg class="area-motion-play" viewBox="0 0 16 16"><path d="M4 2l10 6-10 6z" /></svg>
        </span>
      </label>
    </footer>
  `,
};
export default meta;

export const Recrutador: StoryObj<Args> = { args: { area: 'recruiter', title: 'Recrutador' } };
export const Tecnico: StoryObj<Args> = {
  name: 'Técnico',
  args: { area: 'tech', title: 'Técnico' },
};
export const Clientes: StoryObj<Args> = { args: { area: 'client', title: 'Clientes' } };
export const Comunidade: StoryObj<Args> = { args: { area: 'community', title: 'Comunidade' } };
