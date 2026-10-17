import { LitElement, css, html } from 'lit';

/**
 * Etiqueta curta. O texto vai no light DOM, então é legível antes do upgrade;
 * a regra `ds-badge:not(:defined)` dos tokens dá a mesma aparência até lá.
 */
export class DsBadge extends LitElement {
  static override properties = {
    variant: { type: String, reflect: true },
  };

  declare variant?: string;

  static override styles = css`
    :host {
      display: inline-block;
      box-sizing: border-box;
      padding: var(--ds-badge-padding-block) var(--ds-badge-padding-inline);
      border-radius: var(--ds-badge-radius);
      background: var(--ds-badge-bg);
      color: var(--ds-badge-text);
      font-size: var(--ds-badge-font-size);
      font-weight: var(--text-weight-strong);
      line-height: var(--text-line-height);
    }

    :host([variant='outline']) {
      border: var(--ds-badge-border-width) solid var(--ds-badge-border-color);
      border-radius: 0;
      background: transparent;
      color: var(--color-text);
      font-weight: normal;
    }
  `;

  override render() {
    return html`<slot></slot>`;
  }
}
