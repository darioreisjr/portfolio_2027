import { onMfeReady, type MfeReadyDetail } from '@portfolio/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import './main.ts';

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
  it('mostra o olá do idioma recebido e avisa o shell', async () => {
    const { element, ready } = await mount('en');
    expect(element.shadowRoot?.textContent).toContain('Hello');
    expect(ready).toEqual({ area: 'recruiter', locale: 'en' });
  });

  it('usa pt-BR quando o idioma é desconhecido', async () => {
    const { element, ready } = await mount('xx');
    expect(element.shadowRoot?.textContent).toContain('Olá');
    expect(ready.locale).toBe('pt-BR');
  });

  it('usa o componente do design system', async () => {
    const { element } = await mount('pt-BR');
    expect(element.shadowRoot?.querySelector('ds-badge')).not.toBeNull();
  });
});
