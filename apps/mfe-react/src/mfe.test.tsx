import { onMfeReady, type MfeReadyDetail } from '@portfolio/contracts';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import './main.ts';

afterEach(() => document.body.replaceChildren());

function mount(locale: string): Promise<{ element: HTMLElement; ready: MfeReadyDetail }> {
  return new Promise((resolve) => {
    const element = document.createElement('mfe-clientes');
    const cancel = onMfeReady((ready) => {
      cancel();
      resolve({ element, ready });
    });
    element.setAttribute('locale', locale);
    document.body.append(element);
  });
}

describe('mfe-clientes', () => {
  it('mostra o olá do idioma recebido e avisa o shell', async () => {
    const { element, ready } = await mount('es');
    expect(element.shadowRoot?.textContent).toContain('Hola');
    expect(ready).toEqual({ area: 'client', locale: 'es' });
  });

  it('usa o componente do design system', async () => {
    const { element } = await mount('pt-BR');
    expect(element.shadowRoot?.querySelector('ds-badge')).not.toBeNull();
  });

  it('desmonta ao sair do documento', async () => {
    const { element } = await mount('pt-BR');
    element.remove();
    await new Promise((resolve) => setTimeout(resolve));
    expect(element.shadowRoot?.textContent).toBe('');
  });
});

// Pendência do ADR 0003: confirmar que o React 19 dispensa o wrapper @lit/react.
describe('React com custom element, sem wrapper', () => {
  class Probe extends HTMLElement {
    data: unknown = undefined;
  }
  customElements.define('x-probe', Probe);

  it('atribui objeto por propriedade e escuta evento customizado', async () => {
    const payload = { answer: 42 };
    const heard: string[] = [];
    const container = document.createElement('div');
    document.body.append(container);

    const root = createRoot(container);
    root.render(
      // @ts-expect-error tag só deste teste, sem tipos de JSX
      <x-probe data={payload} onprobe-fired={(event: Event) => heard.push(event.type)} />,
    );
    await expect.poll(() => container.querySelector('x-probe')).not.toBeNull();

    const probe = container.querySelector<Probe>('x-probe');
    probe?.dispatchEvent(new CustomEvent('probe-fired'));

    expect(probe?.data).toBe(payload);
    expect(heard).toEqual(['probe-fired']);
    root.unmount();
  });
});
