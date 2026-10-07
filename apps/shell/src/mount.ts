import type { Locale, MfeTarget } from '@portfolio/contracts';

type LoadModule = (script: string) => Promise<unknown>;

const importModule: LoadModule = (script) => import(/* @vite-ignore */ script);

/**
 * Carrega o módulo do MFE da rota e insere o custom element dele.
 * O elemento é sempre criado do zero: o Angular não tolera reinserção (ADR 0002).
 */
export async function mountMfe(
  outlet: HTMLElement,
  mfe: MfeTarget,
  locale: Locale,
  basePath: string,
  load: LoadModule = importModule,
): Promise<void> {
  try {
    await load(mfe.script);
  } catch (error) {
    console.error(`Falha ao carregar ${mfe.script}`, error);
    const message = document.createElement('p');
    message.setAttribute('role', 'alert');
    message.textContent = outlet.dataset.loadError ?? '';
    outlet.append(message);
    return;
  }

  const element = document.createElement(mfe.tag);
  element.setAttribute('locale', locale);
  element.setAttribute('base-path', basePath);
  outlet.append(element);
}
