import { ui } from '@portfolio/content/ui';
import { defaultLocale, emitMfeReady, locales, type Locale } from '@portfolio/contracts';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'app-tech-area',
  // Sem estilo próprio: a aparência vem de /_ds/areas.css, pelos `part` (ADR 0009).
  template: `
    <section part="message">
      <h2 part="title">{{ text().title }}</h2>
      <p part="text">{{ text().text }}</p>
      <div part="bar" aria-hidden="true"><span part="bar-fill"></span></div>
    </section>
  `,
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
  protected readonly text = computed(() => ui[this.resolvedLocale()].construction);

  constructor() {
    afterNextRender(() => emitMfeReady({ area: 'tech', locale: this.resolvedLocale() }));
  }
}
