import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { TECH_CONTENT, TechAreaComponent, type TechAreaContent } from './tech-area.component';

/**
 * Cria o custom element da área técnica com os dados de um idioma.
 * Quem chama decide a tag e registra: as entradas por idioma, o dev e os testes.
 * Sem zone.js: a detecção de mudanças vem dos signals.
 */
export async function createTechArea(area: TechAreaContent): Promise<CustomElementConstructor> {
  const app = await createApplication({ providers: [{ provide: TECH_CONTENT, useValue: area }] });
  return createCustomElement(TechAreaComponent, { injector: app.injector });
}
