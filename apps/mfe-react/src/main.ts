import { MfeClientes } from './mfe-clientes.tsx';

// Este módulo só registra o elemento; quem o insere no documento é o shell.
if (!customElements.get('mfe-clientes')) customElements.define('mfe-clientes', MfeClientes);
