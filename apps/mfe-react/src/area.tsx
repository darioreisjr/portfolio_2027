import type { ClientContent, ClientUi } from '@portfolio/content/client';
import type { Ui } from '@portfolio/content/schemas';
import type { Locale } from '@portfolio/contracts';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './App.tsx';

/** Tudo o que a área precisa, já resolvido para um idioma (ADR 0015). */
export interface ClientArea {
  locale: Locale;
  /** Conteúdo da área; `null`: a tela "em construção". */
  content: ClientContent | null;
  text: ClientUi;
  construction: Ui['construction'];
}

/**
 * Cria o custom element da área de clientes com os dados de um idioma.
 * Quem chama decide a tag e registra: as entradas por idioma, o dev e os testes.
 */
export function createClientArea(area: ClientArea): CustomElementConstructor {
  return class extends HTMLElement {
    #root: Root | undefined;

    connectedCallback(): void {
      this.#root = createRoot(this.shadowRoot ?? this.attachShadow({ mode: 'open' }));
      this.#root.render(<App {...area} />);
    }

    disconnectedCallback(): void {
      this.#root?.unmount();
      this.#root = undefined;
    }
  };
}
