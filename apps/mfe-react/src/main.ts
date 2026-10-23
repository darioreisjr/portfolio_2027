import { client, clientUi } from '@portfolio/content/client';
import { ui } from '@portfolio/content/ui';
import { defaultLocale, locales, type Locale } from '@portfolio/contracts';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './App.tsx';

/** Ponte genérica entre o custom element e o React para dev e testes. */
export class MfeClientes extends HTMLElement {
  static observedAttributes = ['locale', 'base-path'];

  #root: Root | undefined;

  connectedCallback(): void {
    this.#root = createRoot(this.shadowRoot ?? this.attachShadow({ mode: 'open' }));
    this.#render();
  }

  disconnectedCallback(): void {
    this.#root?.unmount();
    this.#root = undefined;
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  #render(): void {
    const requested = this.getAttribute('locale');
    const locale: Locale = locales.find((candidate) => candidate === requested) ?? defaultLocale;
    this.#root?.render(
      createElement(App, {
        locale,
        content: client?.[locale] ?? null,
        text: clientUi[locale],
        construction: ui[locale].construction,
      }),
    );
  }
}

// Este módulo só registra o elemento; quem o insere no documento é o shell.
if (!customElements.get('mfe-clientes')) customElements.define('mfe-clientes', MfeClientes);
