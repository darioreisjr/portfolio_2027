import { defaultLocale, locales, type Locale } from '@portfolio/contracts';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './App.tsx';

/** Ponte entre o custom element e o React, que não tem API própria para isso. */
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
    this.#root?.render(<App locale={locale} />);
  }
}
