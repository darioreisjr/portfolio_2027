import { languageAlternates } from '@portfolio/contracts';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

// Sem custom element: é marcação mais CSS dos tokens (ADR 0006). Esta story é a
// marcação de referência que o shell e o layout do Next.js repetem.
const meta: Meta = {
  title: 'Padrões/ds-language-switcher',
};
export default meta;

const alternates = languageAlternates('home', 'pt-BR');
const current = alternates.find((alternate) => alternate.current);

export const Padrao: StoryObj = {
  name: 'Padrão',
  render: () => html`
    <footer class="ds-dock">
      <nav aria-label="Idioma">
        <details class="ds-language-switcher">
          <summary title=${current?.name ?? ''}>
            <img src=${current?.flag ?? ''} alt=${current?.name ?? ''} width="28" height="28" />
          </summary>
          <ul>
            ${alternates
              .filter((alternate) => !alternate.current)
              .map(
                ({ locale, name, flag }) => html`
                  <li>
                    <a
                      href="#${locale}"
                      lang=${locale}
                      hreflang=${locale}
                      aria-label=${name}
                      title=${name}
                    >
                      <img src=${flag} alt="" width="28" height="28" />
                    </a>
                  </li>
                `,
              )}
          </ul>
        </details>
      </nav>
    </footer>
  `,
};
