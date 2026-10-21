import type { Site, TechContent, TechUi } from '@portfolio/content/tech';
import { site, tech, techUi } from '@portfolio/content/tech';
import type { Ui } from '@portfolio/content/schemas';
import { ui } from '@portfolio/content/ui';
import { defaultLocale, emitMfeReady, locales, type Locale } from '@portfolio/contracts';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  InjectionToken,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { TechPageComponent } from './tech-page.component';

export interface TechAreaContent {
  locale: Locale;
  site: Site;
  tech: TechContent | null;
  techUi: TechUi;
  construction: Ui['construction'];
}

export const TECH_CONTENT = new InjectionToken<TechAreaContent>('TECH_CONTENT');

@Component({
  selector: 'app-tech-area',
  imports: [TechPageComponent],
  // Com conteúdo, a página (ADR 0010). Sem conteúdo, a mensagem "em construção",
  // sem estilo próprio: quem a estiliza é /_ds/areas.css, pelos `part` (ADR 0009).
  template: `
    @if (content(); as page) {
      <app-tech-page
        [content]="page"
        [text]="pageText()"
        [site]="site"
        [locale]="resolvedLocale()"
      />
    } @else {
      <section part="message">
        <h2 part="title">{{ text().title }}</h2>
        <p part="text">{{ text().text }}</p>
        <div part="bar" aria-hidden="true"><span part="bar-fill"></span></div>
      </section>
    }
  `,
  // Todo o CSS da área fica aqui, na raiz: vive no shadow root e alcança os
  // componentes filhos, que não têm estilo nem encapsulamento próprios.
  styleUrl: './tech-page.css',
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechAreaComponent {
  /** Atributos `locale` e `base-path` do custom element. */
  readonly locale = input<string>();
  readonly basePath = input<string>();

  private readonly injected = inject(TECH_CONTENT, { optional: true });

  protected readonly site = this.injected?.site ?? site;
  protected readonly resolvedLocale = computed<Locale>(
    () =>
      this.injected?.locale ??
      locales.find((candidate) => candidate === this.locale()) ??
      defaultLocale,
  );
  protected readonly text = computed(
    () => this.injected?.construction ?? ui[this.resolvedLocale()].construction,
  );
  protected readonly content = computed(() =>
    this.injected ? this.injected.tech : tech?.[this.resolvedLocale()],
  );
  protected readonly pageText = computed(
    () => this.injected?.techUi ?? techUi[this.resolvedLocale()],
  );

  constructor() {
    afterNextRender(() => emitMfeReady({ area: 'tech', locale: this.resolvedLocale() }));
  }
}
