/** Atributo do `<html>` que fixa o tema. Sem ele, vale a preferência do sistema. */
export const THEME_ATTRIBUTE = 'data-theme';
/** Onde a escolha do visitante fica guardada. */
export const THEME_STORAGE_KEY = 'portfolio:tema';

export const themes = ['light', 'dark'] as const;
export type Theme = (typeof themes)[number];

export const isTheme = (value: unknown): value is Theme => themes.some((theme) => theme === value);

/**
 * Script que todo documento põe inline no `<head>`, antes das folhas de estilo:
 * aplica o tema salvo antes da primeira pintura, para a página não piscar.
 * Exportado como texto; este pacote não executa API de navegador.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(${themes
  .map((theme) => `t===${JSON.stringify(theme)}`)
  .join(
    '||',
  )})document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},t)}catch(e){}})()`;

/** Emitido quando o visitante troca o tema. */
export const THEME_CHANGED = 'portfolio:tema-alterado';

export interface ThemeChangedDetail {
  theme: Theme;
}

export function emitThemeChanged(detail: ThemeChangedDetail, target: EventTarget = window): void {
  target.dispatchEvent(new CustomEvent<ThemeChangedDetail>(THEME_CHANGED, { detail }));
}

/** Devolve a função que cancela a escuta. */
export function onThemeChanged(
  listener: (detail: ThemeChangedDetail) => void,
  target: EventTarget = window,
): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<ThemeChangedDetail>).detail);
  target.addEventListener(THEME_CHANGED, handler);
  return () => target.removeEventListener(THEME_CHANGED, handler);
}
