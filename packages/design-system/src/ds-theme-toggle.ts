import {
  emitThemeChanged,
  isTheme,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  type Theme,
} from '@portfolio/contracts';
import { LitElement, css, html } from 'lit';

const root = () => document.documentElement;

function savedTheme(): Theme | undefined {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(saved) ? saved : undefined;
  } catch {
    // Armazenamento bloqueado: segue sem lembrar a escolha.
    return undefined;
  }
}

/**
 * Seletor de tema: sol nascente de dia, lua crescente à noite.
 *
 * É o dono da troca de tema (ADR 0005): aplica `data-theme` no `<html>`, guarda
 * a escolha e emite o evento de `packages/contracts`. Só funciona com
 * JavaScript, então fica oculto até o upgrade; a regra
 * `ds-theme-toggle:not(:defined)` dos tokens reserva o espaço.
 *
 * O atributo `label` é o nome acessível; o estado vai em `aria-pressed`
 * (`true` quando o tema escuro está em vigor).
 */
export class DsThemeToggle extends LitElement {
  static override properties = {
    label: { type: String },
    theme: { state: true },
  };

  static override styles = css`
    :host {
      display: inline-block;
      inline-size: var(--ds-theme-toggle-size);
      block-size: var(--ds-theme-toggle-size);
    }

    button {
      all: unset;
      display: grid;
      place-items: center;
      box-sizing: border-box;
      inline-size: 100%;
      block-size: 100%;
      border: var(--ds-theme-toggle-border-width) solid var(--ds-theme-toggle-border);
      border-radius: var(--ds-theme-toggle-radius);
      background: var(--ds-theme-toggle-bg);
      cursor: pointer;
    }

    button:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: var(--focus-ring-offset);
    }

    svg {
      inline-size: 62%;
      block-size: 62%;
      fill: var(--ds-theme-toggle-icon);
    }

    /* A sombra fica fora do disco de dia e desliza sobre ele à noite, recortando a lua. */
    .shade {
      translate: 13px -13px;
      transition: translate var(--ds-theme-toggle-duration) var(--motion-ease-out);
    }

    button[aria-pressed='true'] .shade {
      translate: 0 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .shade {
        transition: none;
      }
    }
  `;

  declare label: string;
  declare theme: Theme;

  #systemDark = matchMedia('(prefers-color-scheme: dark)');
  #observer = new MutationObserver(() => this.#sync());

  constructor() {
    super();
    this.label = '';
    this.theme = this.#current();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#sync();
    this.#observer.observe(root(), { attributes: true, attributeFilter: [THEME_ATTRIBUTE] });
    this.#systemDark.addEventListener('change', this.#sync);
    window.addEventListener('storage', this.#onStorage);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer.disconnect();
    this.#systemDark.removeEventListener('change', this.#sync);
    window.removeEventListener('storage', this.#onStorage);
  }

  /** Tema em vigor: o fixado no `<html>` ou, sem ele, o do sistema. */
  #current(): Theme {
    const fixed = root().getAttribute(THEME_ATTRIBUTE);
    if (isTheme(fixed)) return fixed;
    return this.#systemDark.matches ? 'dark' : 'light';
  }

  #sync = (): void => {
    // Se algo tirou o atributo (o React em desenvolvimento faz isso ao remontar),
    // a escolha salva volta.
    const saved = savedTheme();
    if (saved && !root().hasAttribute(THEME_ATTRIBUTE)) {
      root().setAttribute(THEME_ATTRIBUTE, saved);
      return;
    }
    this.theme = this.#current();
  };

  /** Escolha feita em outra aba. */
  #onStorage = (event: StorageEvent): void => {
    if (event.key !== THEME_STORAGE_KEY) return;
    if (isTheme(event.newValue)) root().setAttribute(THEME_ATTRIBUTE, event.newValue);
    else root().removeAttribute(THEME_ATTRIBUTE);
  };

  #toggle(): void {
    const next: Theme = this.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Sem armazenamento, a escolha vale só para esta página.
    }
    root().setAttribute(THEME_ATTRIBUTE, next);
    this.theme = next;
    emitThemeChanged({ theme: next });
  }

  override render() {
    return html`
      <button
        type="button"
        aria-label=${this.label}
        aria-pressed=${this.theme === 'dark' ? 'true' : 'false'}
        @click=${this.#toggle}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <mask id="crescent">
            <rect width="24" height="24" fill="white" />
            <circle class="shade" cx="16" cy="8" r="7.5" fill="black" />
          </mask>
          <circle cx="12" cy="12" r="9" mask="url(#crescent)" />
        </svg>
      </button>
    `;
  }
}
