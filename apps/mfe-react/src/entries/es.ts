import { client, clientUi } from '@portfolio/content/client/es';
import { ui } from '@portfolio/content/ui/es';
import { createClientArea } from '../area.tsx';

if (!customElements.get('mfe-clientes')) {
  customElements.define(
    'mfe-clientes',
    createClientArea({
      locale: 'es',
      content: client,
      text: clientUi,
      construction: ui.construction,
    }),
  );
}
