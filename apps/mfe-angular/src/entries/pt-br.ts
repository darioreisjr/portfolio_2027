import { site, tech, techUi } from '@portfolio/content/tech/pt-BR';
import { ui } from '@portfolio/content/ui/pt-BR';
import { createTechArea } from '../app/area';

if (!customElements.get('mfe-tecnico')) {
  customElements.define(
    'mfe-tecnico',
    await createTechArea({
      locale: 'pt-BR',
      site,
      tech,
      techUi,
      construction: ui.construction,
      areas: ui.areas,
    }),
  );
}
