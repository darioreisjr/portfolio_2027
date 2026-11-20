import { client, clientUi } from '@portfolio/content/client/pt-BR';
import { ui } from '@portfolio/content/ui/pt-BR';
import { createClientArea } from '../area.tsx';

if (!customElements.get('mfe-clientes')) {
  customElements.define(
    'mfe-clientes',
    createClientArea({
      locale: 'pt-BR',
      content: client,
      text: clientUi,
      construction: ui.construction,
    }),
  );
}
