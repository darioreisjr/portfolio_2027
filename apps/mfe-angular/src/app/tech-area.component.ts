import { ui } from '@portfolio/content/ui';
import { defaultLocale, emitMfeReady, locales, type Locale } from '@portfolio/contracts';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'app-tech-area',
  template: `
    <section>
      <p class="hello">
        {{ text().hello }}
        <ds-badge>Angular</ds-badge>
      </p>
    </section>
  `,
  styles: `
    .hello {
      display: flex;
      align-items: center;
      gap: var(--space-inline-sm);
      margin: 0;
      color: var(--color-text);
      font-size: var(--text-size-md);
    }
  `,
  // ds-badge é um custom element do design system, não um componente Angular.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechAreaComponent {
  /** Atributos `locale` e `base-path` do custom element. */
  readonly locale = input<string>();
  readonly basePath = input<string>();

  protected readonly resolvedLocale = computed<Locale>(
    () => locales.find((candidate) => candidate === this.locale()) ?? defaultLocale,
  );
  protected readonly text = computed(() => ui[this.resolvedLocale()]);

  constructor() {
    afterNextRender(() => emitMfeReady({ area: 'tech', locale: this.resolvedLocale() }));
  }
}
