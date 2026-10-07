import { DsBadge } from './ds-badge.js';
import { DsThemeToggle } from './ds-theme-toggle.js';

export type { DsBadge, DsThemeToggle };

// O registro é global por documento e registrar duas vezes lança erro.
if (!customElements.get('ds-badge')) customElements.define('ds-badge', DsBadge);
if (!customElements.get('ds-theme-toggle')) {
  customElements.define('ds-theme-toggle', DsThemeToggle);
}

declare global {
  interface HTMLElementTagNameMap {
    'ds-badge': DsBadge;
    'ds-theme-toggle': DsThemeToggle;
  }
}
