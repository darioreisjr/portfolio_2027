import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { TechAreaComponent } from './app/tech-area.component';

// Este módulo só registra o elemento; quem o insere no documento é o shell.
// Sem zone.js: a detecção de mudanças vem dos signals.
if (!customElements.get('mfe-tecnico')) {
  const app = await createApplication();
  customElements.define(
    'mfe-tecnico',
    createCustomElement(TechAreaComponent, { injector: app.injector }),
  );
}
