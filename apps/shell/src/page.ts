import type { Ui } from '@portfolio/content/schemas';
import {
  languageAlternates,
  pathFor,
  routes,
  THEME_INIT_SCRIPT,
  type Locale,
  type RouteEntry,
} from '@portfolio/contracts';

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
export function renderPage(entry: RouteEntry, locale: Locale, ui: Ui): string {
  const area = ui.areas[entry.area];
  const links = routes
    .filter((route) => route.area !== 'home')
    .map((route) => {
      const current = route.area === entry.area ? ' aria-current="page"' : '';
      return `<li><a href="${pathFor(route.area, locale)}"${current}>${escapeHtml(ui.areas[route.area].title)}</a></li>`;
    })
    .join('\n          ');

  // Troca de idioma: links comuns para a mesma área (ADR 0006). A marcação de
  // referência está na story `ds-language-switcher` do design system.
  const languages = languageAlternates(entry.area, locale)
    .map(({ locale: target, name, href, flag, current }) => {
      const mark = current ? ' aria-current="page"' : '';
      return `<li><a href="${href}" lang="${target}" hreflang="${target}" aria-label="${escapeHtml(name)}" title="${escapeHtml(name)}"${mark}><img src="${flag}" alt="" width="28" height="28" loading="lazy" decoding="async" /></a></li>`;
    })
    .join('\n          ');

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script>${THEME_INIT_SCRIPT}</script>
    <title>${escapeHtml(area.title)} | ${escapeHtml(ui.siteName)}</title>
    <meta name="description" content="${escapeHtml(area.description)}" />
    <link rel="stylesheet" href="/_ds/tokens.css" />
    <link rel="stylesheet" href="/_shell/shell.css" />
    <script type="module" src="/_ds/ds.js"></script>
    <script type="module" src="/_shell/shell.js"></script>
  </head>
  <body>
    <header class="shell-header">
      <a class="shell-brand" href="${pathFor('home', locale)}">${escapeHtml(ui.siteName)}</a>
      <ds-badge>${escapeHtml(ui.hello)}</ds-badge>
      <nav>
        <ul>
          ${links}
        </ul>
      </nav>
      <ds-theme-toggle label="${escapeHtml(ui.themeToggle)}"></ds-theme-toggle>
    </header>
    <main data-area="${entry.area}" data-load-error="${escapeHtml(ui.loadError)}">
      <h1>${escapeHtml(area.title)}</h1>
    </main>
    <footer class="ds-dock">
      <nav class="ds-language-switcher" aria-label="${escapeHtml(ui.languageSwitcher)}">
        <ul>
          ${languages}
        </ul>
      </nav>
    </footer>
  </body>
</html>
`;
}
