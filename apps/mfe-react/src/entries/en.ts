import { client, clientUi } from '@portfolio/content/client/en';
import { ui } from '@portfolio/content/ui/en';
import { createMfeClientes } from '../mfe-clientes.tsx';

const Element = createMfeClientes({
  locale: 'en',
  content: client,
  text: clientUi,
  construction: ui.construction,
});

if (!customElements.get('mfe-clientes')) customElements.define('mfe-clientes', Element);
