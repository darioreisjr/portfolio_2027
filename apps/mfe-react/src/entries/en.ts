import { client, clientUi } from '@portfolio/content/client/en';
import { ui } from '@portfolio/content/ui/en';
import { createClientArea } from '../area.tsx';

if (!customElements.get('mfe-clientes')) {
  customElements.define(
    'mfe-clientes',
    createClientArea({
      locale: 'en',
      content: client,
      text: clientUi,
      construction: ui.construction,
    }),
  );
}
