import { site, tech, techUi } from '@portfolio/content/tech/es';
import { ui } from '@portfolio/content/ui/es';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { TechAreaComponent, TECH_CONTENT } from '../app/tech-area.component';

if (!customElements.get('mfe-tecnico')) {
  const app = await createApplication({
    providers: [
      {
        provide: TECH_CONTENT,
        useValue: {
          locale: 'es',
          site,
          tech,
          techUi,
          construction: ui.construction,
        },
      },
    ],
  });
  customElements.define(
    'mfe-tecnico',
    createCustomElement(TechAreaComponent, { injector: app.injector }),
  );
}
