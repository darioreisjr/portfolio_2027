import { DsBadge } from './ds-badge.js';
import { DsChatAssistant } from './ds-chat-assistant.js';
import { DsThemeToggle } from './ds-theme-toggle.js';

export type { DsBadge, DsChatAssistant, DsThemeToggle };

// O registro é global por documento e registrar duas vezes lança erro.
if (!customElements.get('ds-badge')) customElements.define('ds-badge', DsBadge);
if (!customElements.get('ds-chat-assistant')) {
  customElements.define('ds-chat-assistant', DsChatAssistant);
}
if (!customElements.get('ds-theme-toggle')) {
  customElements.define('ds-theme-toggle', DsThemeToggle);
}

declare global {
  interface HTMLElementTagNameMap {
    'ds-badge': DsBadge;
    'ds-chat-assistant': DsChatAssistant;
    'ds-theme-toggle': DsThemeToggle;
  }
}
