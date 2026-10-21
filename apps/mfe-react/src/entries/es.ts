import { client, clientUi } from '@portfolio/content/client/es';
import { ui } from '@portfolio/content/ui/es';
import { createMfeClientes } from '../mfe-clientes.tsx';

const Element = createMfeClientes({
  locale: 'es',
  content: client,
  text: clientUi,
  construction: ui.construction,
});

if (!customElements.get('mfe-clientes')) customElements.define('mfe-clientes', Element);
