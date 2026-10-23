import type { ClientContent, ClientUi } from '@portfolio/content/client';
import type { Ui } from '@portfolio/content/schemas';
import type { Locale } from '@portfolio/contracts';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './App.tsx';

export interface MfeClientesOptions {
  locale: Locale;
  content: ClientContent | null;
  text: ClientUi;
  construction: Ui['construction'];
}

/** Cria a classe custom element vinculada aos dados de um idioma específico. */
export function createMfeClientes(options: MfeClientesOptions): typeof HTMLElement {
  return class extends HTMLElement {
    static observedAttributes = ['locale', 'base-path'];

    #root: Root | undefined;

    connectedCallback(): void {
      this.#root = createRoot(this.shadowRoot ?? this.attachShadow({ mode: 'open' }));
      this.#root.render(
        <App
          locale={options.locale}
          content={options.content}
          text={options.text}
          construction={options.construction}
        />,
      );
    }

    disconnectedCallback(): void {
      this.#root?.unmount();
      this.#root = undefined;
    }
  };
}
