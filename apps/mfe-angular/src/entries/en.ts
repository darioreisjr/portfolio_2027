import { site, tech, techUi } from '@portfolio/content/tech/en';
import { ui } from '@portfolio/content/ui/en';
import { createTechArea } from '../app/area';

if (!customElements.get('mfe-tecnico')) {
  customElements.define(
    'mfe-tecnico',
    await createTechArea({
      locale: 'en',
      site,
      tech,
      techUi,
      construction: ui.construction,
      areas: ui.areas,
    }),
  );
}
