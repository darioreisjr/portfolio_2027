import { recruiter as recruiterEn } from '@portfolio/content/recruiter/en';
import { recruiterUi } from '@portfolio/content/recruiter';
import { ui } from '@portfolio/content/ui';
import { onMfeReady, type MfeReadyDetail } from '@portfolio/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { createRecruiterArea } from './area.ts';
// A entrada publicada de um idioma: registra `mfe-recrutador` como vai ao ar.
import './entries/en.ts';

// Sem conteúdo, a tela "em construção". A página com conteúdo é testada em page.test.ts.
customElements.define(
  'mfe-recrutador-vazio',
  createRecruiterArea({
    locale: 'pt-BR',
    content: null,
    text: recruiterUi['pt-BR'],
    construction: ui['pt-BR'].construction,
  }),
);

afterEach(() => document.body.replaceChildren());

function mount(tag: string): Promise<{ element: HTMLElement; ready: MfeReadyDetail }> {
  return new Promise((resolve) => {
    const element = document.createElement(tag);
    const cancel = onMfeReady((ready) => {
      cancel();
      resolve({ element, ready });
    });
    document.body.append(element);
  });
}

describe('mfe-recrutador', () => {
  it('a entrada publicada mostra a página no idioma dela e avisa o shell', async () => {
    const { element, ready } = await mount('mfe-recrutador');
    expect(ready).toEqual({ area: 'recruiter', locale: 'en' });
    await expect.poll(() => element.shadowRoot?.textContent).toContain(recruiterEn?.role);
  });

  it('sem conteúdo, mostra a mensagem "em construção" e avisa o shell', async () => {
    const { element, ready } = await mount('mfe-recrutador-vazio');
    expect(element.shadowRoot?.textContent).toContain('Fase em construção');
    expect(ready).toEqual({ area: 'recruiter', locale: 'pt-BR' });
  });

  it('expõe as partes que a folha das páginas internas estiliza', async () => {
    const { element } = await mount('mfe-recrutador-vazio');
    const parts = [...(element.shadowRoot?.querySelectorAll('[part]') ?? [])].map((node) =>
      node.getAttribute('part'),
    );
    expect(parts).toEqual(['message', 'title', 'text', 'bar', 'bar-fill']);
    // A barra é enfeite: não há progresso de verdade para anunciar.
    expect(element.shadowRoot?.querySelector('[part="bar"]')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });
});
