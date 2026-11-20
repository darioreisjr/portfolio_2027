import type { Site, TechContent, TechUi } from '@portfolio/content/tech';
import type { Ui } from '@portfolio/content/schemas';
import { emitMfeReady, type Locale } from '@portfolio/contracts';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
  InjectionToken,
  ViewEncapsulation,
} from '@angular/core';
import { TechPageComponent } from './tech-page.component';

/** Tudo o que a área precisa, já resolvido para um idioma (ADR 0015). */
export interface TechAreaContent {
  locale: Locale;
  site: Site;
  /** Conteúdo da área; `null`: a tela "em construção". */
  tech: TechContent | null;
  techUi: TechUi;
  construction: Ui['construction'];
  areas: Ui['areas'];
}

/** Os dados da área, fornecidos por `createTechArea` (area.ts). */
export const TECH_CONTENT = new InjectionToken<TechAreaContent>('TECH_CONTENT');

@Component({
  selector: 'app-tech-area',
  imports: [TechPageComponent],
  // Com conteúdo, a página (ADR 0010). Sem conteúdo, a mensagem "em construção",
  // sem estilo próprio: quem a estiliza é /_ds/areas.css, pelos `part` (ADR 0009).
  template: `
    @if (area.tech; as page) {
      <app-tech-page
        [content]="page"
        [text]="area.techUi"
        [site]="area.site"
        [locale]="area.locale"
        [areas]="area.areas"
      />
    } @else {
      <section part="message">
        <h2 part="title">{{ area.construction.title }}</h2>
        <p part="text">{{ area.construction.text }}</p>
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
  protected readonly area = inject(TECH_CONTENT);

  constructor() {
    afterNextRender(() => emitMfeReady({ area: 'tech', locale: this.area.locale }));
  }
}
