import { site, tech, techUi } from '@portfolio/content/tech/es';
import { ui } from '@portfolio/content/ui/es';
import { createTechArea } from '../app/area';

if (!customElements.get('mfe-tecnico')) {
  customElements.define(
    'mfe-tecnico',
    await createTechArea({
      locale: 'es',
      site,
      tech,
      techUi,
      construction: ui.construction,
      areas: ui.areas,
    }),
  );
}
