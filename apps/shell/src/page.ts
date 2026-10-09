import type { Ui } from '@portfolio/content/schemas';
import {
  ARRIVAL_INIT_SCRIPT,
  languageAlternates,
  pathFor,
  personaFigure,
  THEME_INIT_SCRIPT,
  type Locale,
  type RouteEntry,
} from '@portfolio/contracts';

/** Cenário decorativo: três camadas e dez partículas, que a folha desenha por área. */
const AREA_SCENE = `<div class="area-scene" aria-hidden="true">
        <span class="area-scene-back"></span><span class="area-scene-mid"></span><span class="area-scene-front"></span>
        <span class="area-particles">${'<i></i>'.repeat(10)}</span>
      </div>`;

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  );

/**
 * Documento de uma área de MFE em um idioma. Usado pelo gerador do build e pelo
 * servidor de desenvolvimento, para os dois entregarem o mesmo HTML.
 */
export interface PageOptions {
  /** A área tem conteúdo: o palco é uma página rolável, não a caixa centrada (ADR 0010). */
  content?: boolean;
}

export function renderPage(
  entry: RouteEntry,
  locale: Locale,
  ui: Ui,
  { content = false }: PageOptions = {},
): string {
  const area = ui.areas[entry.area];
  // Troca de idioma (ADR 0006): a bandeira do idioma em uso abre os outros,
  // que são links comuns para a mesma área. Sem script. A marcação de referência
  // está na story `ds-language-switcher` do design system.
  const alternates = languageAlternates(entry.area, locale);
  const currentLanguage = alternates.find((alternate) => alternate.current);
  const flagImage = (flag: string, alt: string) =>
    `<img src="${flag}" alt="${escapeHtml(alt)}" width="28" height="28" loading="lazy" decoding="async" />`;
  const languages = alternates
    .filter((alternate) => !alternate.current)
    .map(
      ({ locale: target, name, href, flag }) =>
        `<li><a href="${href}" lang="${target}" hreflang="${target}" aria-label="${escapeHtml(name)}" title="${escapeHtml(name)}">${flagImage(flag, '')}</a></li>`,
    )
    .join('\n            ');

  // Palco da tela "em construção" (ADR 0009): o cenário e o personagem já vêm
  // no HTML; a mensagem é do MFE, que entra em `.area-outlet`.
  const figure = personaFigure(entry.area);
  const figureImage = figure
    ? `<picture>
        <source type="image/avif" srcset="${figure.avif}" />
        <img class="area-figure" src="${figure.src}" alt="" width="${figure.width}" height="${figure.height}" loading="eager" fetchpriority="high" decoding="async" />
      </picture>`
    : '';

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script>${THEME_INIT_SCRIPT};${ARRIVAL_INIT_SCRIPT}</script>
    <title>${escapeHtml(area.title)} | ${escapeHtml(ui.siteName)}</title>
    <meta name="description" content="${escapeHtml(area.description)}" />
    <link rel="stylesheet" href="/_ds/tokens.css" />
    <link rel="stylesheet" href="/_ds/areas.css" />
    <link rel="stylesheet" href="/_shell/shell.css" />
    <script type="module" src="/_ds/ds.js"></script>
    <script type="module" src="/_shell/shell.js"></script>
  </head>
  <body>
    <div class="area-arrival" aria-hidden="true"></div>
    <header class="shell-header">
      <ds-theme-toggle label="${escapeHtml(ui.themeToggle)}"></ds-theme-toggle>
    </header>
    <main class="area-stage" data-area="${entry.area}"${content ? ' data-content' : ''}>
      ${AREA_SCENE}
      <h1 class="area-title">${escapeHtml(area.title)}</h1>
      ${figureImage}
      <div class="area-outlet" data-load-error="${escapeHtml(ui.loadError)}"></div>
      <a class="area-back" href="${pathFor('home', locale)}">${escapeHtml(ui.construction.back)}</a>
    </main>
    <footer class="ds-dock">
      <label class="area-motion" title="${escapeHtml(ui.pauseMotion)}">
        <input type="checkbox" aria-label="${escapeHtml(ui.pauseMotion)}" />
        <span class="area-motion-disc" aria-hidden="true">
          <svg class="area-motion-pause" viewBox="0 0 16 16"><path d="M3 2h4v12H3zM9 2h4v12H9z" /></svg>
          <svg class="area-motion-play" viewBox="0 0 16 16"><path d="M4 2l10 6-10 6z" /></svg>
        </span>
      </label>
      <nav aria-label="${escapeHtml(ui.languageSwitcher)}">
        <details class="ds-language-switcher">
          <summary title="${escapeHtml(currentLanguage?.name ?? '')}">${flagImage(currentLanguage?.flag ?? '', currentLanguage?.name ?? '')}</summary>
          <ul>
            ${languages}
          </ul>
        </details>
      </nav>
    </footer>
  </body>
</html>
`;
}
