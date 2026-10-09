import { onMfeReady, type MfeReadyDetail } from '@portfolio/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Sem conteúdo publicado, como no build de produção de hoje: a área mostra a
// tela "em construção". A página com conteúdo é testada em page.test.ts.
vi.mock('@portfolio/content/recruiter', async (original) => ({
  ...(await original<typeof import('@portfolio/content/recruiter')>()),
  recruiter: null,
}));

await import('./main.ts');

afterEach(() => document.body.replaceChildren());

function mount(locale: string): Promise<{ element: HTMLElement; ready: MfeReadyDetail }> {
  return new Promise((resolve) => {
    const element = document.createElement('mfe-recrutador');
    const cancel = onMfeReady((ready) => {
      cancel();
      resolve({ element, ready });
    });
    element.setAttribute('locale', locale);
    document.body.append(element);
  });
}

describe('mfe-recrutador', () => {
  it('mostra a mensagem no idioma recebido e avisa o shell', async () => {
    const { element, ready } = await mount('en');
    expect(element.shadowRoot?.textContent).toContain('Stage under construction');
    expect(ready).toEqual({ area: 'recruiter', locale: 'en' });
  });

  it('usa pt-BR quando o idioma é desconhecido', async () => {
    const { element, ready } = await mount('xx');
    expect(element.shadowRoot?.textContent).toContain('Fase em construção');
    expect(ready.locale).toBe('pt-BR');
  });

  it('expõe as partes que a folha das páginas internas estiliza', async () => {
    const { element } = await mount('pt-BR');
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
