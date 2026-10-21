import { client, clientUi } from '@portfolio/content/client/pt-BR';
import { ui } from '@portfolio/content/ui/pt-BR';
import { createMfeClientes } from '../mfe-clientes.tsx';

const Element = createMfeClientes({
  locale: 'pt-BR',
  content: client,
  text: clientUi,
  construction: ui.construction,
});

if (!customElements.get('mfe-clientes')) customElements.define('mfe-clientes', Element);
