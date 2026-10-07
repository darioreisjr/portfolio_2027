import { DsBadge } from './ds-badge.js';

export type { DsBadge };

// O registro é global por documento e registrar duas vezes lança erro.
if (!customElements.get('ds-badge')) customElements.define('ds-badge', DsBadge);

declare global {
  interface HTMLElementTagNameMap {
    'ds-badge': DsBadge;
  }
}
