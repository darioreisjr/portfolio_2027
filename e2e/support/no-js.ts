import type { BrowserContextOptions } from '@playwright/test';

/**
 * Opções de um contexto sem JavaScript. O `storageState` da configuração grava
 * no `localStorage` a resposta ao pop-up da home; para gravar, o Firefox abre a
 * página e roda um script, e sem JavaScript fica esperando para sempre. Sem
 * script a página não lê o `localStorage`, então o estado vazio não muda nada.
 */
export const NO_JS: BrowserContextOptions = {
  javaScriptEnabled: false,
  storageState: { cookies: [], origins: [] },
};
