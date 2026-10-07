import { languageAlternates } from '@portfolio/contracts';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

// Sem custom element: é marcação mais CSS dos tokens (ADR 0006). Esta story é a
// marcação de referência que o shell e o layout do Next.js repetem.
const meta: Meta = {
  title: 'Padrões/ds-language-switcher',
};
export default meta;

export const Padrao: StoryObj = {
  name: 'Padrão',
  render: () => html`
    <footer class="ds-dock">
      <nav class="ds-language-switcher" aria-label="Idioma">
        <ul>
          ${languageAlternates('home', 'pt-BR').map(
            ({ locale, name, flag, current }) => html`
              <li>
                <a
                  href="#${locale}"
                  lang=${locale}
                  hreflang=${locale}
                  aria-label=${name}
                  title=${name}
                  aria-current=${current ? 'page' : 'false'}
                >
                  <img src=${flag} alt="" width="28" height="28" />
                </a>
              </li>
            `,
          )}
        </ul>
      </nav>
    </footer>
  `,
};
