import { ui } from '@portfolio/content/ui';
import { locales, routesOwnedBy } from '@portfolio/contracts';
import { describe, expect, it } from 'vitest';
import { renderPage } from './page.ts';

describe('documento de uma área', () => {
  const [recruiter] = routesOwnedBy('shell');
  if (!recruiter) throw new Error('Tabela de rotas sem área do shell');

  it('tem idioma, título e descrição próprios em cada idioma', () => {
    for (const locale of locales) {
      const html = renderPage(recruiter, locale, ui[locale]);
      const area = ui[locale].areas[recruiter.area];
      expect(html).toContain(`<html lang="${locale}">`);
      expect(html).toContain(`<title>${area.title} | ${ui[locale].siteName}</title>`);
      expect(html).toContain(`content="${area.description}"`);
    }
  });

  it('carrega tokens e design system antes do script do shell', () => {
    const html = renderPage(recruiter, 'pt-BR', ui['pt-BR']);
    expect(html.indexOf('/_ds/ds.js')).toBeLessThan(html.indexOf('/_shell/shell.js'));
    expect(html).toContain('/_ds/tokens.css');
  });

  it('não tem menu de áreas: o único caminho é a volta à escolha de perfil', () => {
    const html = renderPage(recruiter, 'en', ui.en);
    expect(html).not.toContain('href="/en/tech/"');
    expect(html).not.toContain('href="/en/how-it-was-built/"');
    expect(html).toContain('<a class="area-back" href="/en/">');
  });

  it('aplica o tema salvo antes de carregar qualquer estilo', () => {
    const html = renderPage(recruiter, 'pt-BR', ui['pt-BR']);
    const script = html.indexOf('localStorage.getItem("portfolio:tema")');
    expect(script).toBeGreaterThan(-1);
    expect(script).toBeLessThan(html.indexOf('rel="stylesheet"'));
  });

  it('tem o seletor de tema com o rótulo do idioma', () => {
    for (const locale of locales) {
      const html = renderPage(recruiter, locale, ui[locale]);
      expect(html).toContain(`<ds-theme-toggle label="${ui[locale].themeToggle}">`);
    }
  });

  it('mostra a bandeira do idioma em uso, que abre os outros dois para a mesma área', () => {
    const html = renderPage(recruiter, 'es', ui.es);
    const start = html.indexOf('<details class="ds-language-switcher">');
    const switcher = html.slice(start, html.indexOf('</details>', start));
    expect(start).toBeGreaterThan(html.indexOf(`<nav aria-label="${ui.es.languageSwitcher}">`));

    // O idioma em uso é o <summary>: nome pela imagem, sem link.
    expect(switcher).toContain(
      '<summary title="Español"><img src="/_ds/flags/es.svg" alt="Español"',
    );
    expect(switcher).not.toContain('hreflang="es"');
    expect(switcher).not.toContain('aria-current');

    for (const locale of locales.filter((candidate) => candidate !== 'es')) {
      expect(switcher).toContain(
        `<a href="${recruiter.paths[locale]}" lang="${locale}" hreflang="${locale}"`,
      );
      expect(switcher).toContain(`src="/_ds/flags/${locale}.svg" alt=""`);
    }
    expect(switcher.match(/<a /g)).toHaveLength(2);
    // Depois do conteúdo, para o Tab chegar nele por último.
    expect(html.indexOf('class="ds-dock"')).toBeGreaterThan(html.indexOf('</main>'));
  });

  it('monta o palco da área: cenário, título, personagem, lugar do MFE e volta', () => {
    const html = renderPage(recruiter, 'en', ui.en);
    expect(html).toContain('<link rel="stylesheet" href="/_ds/areas.css" />');
    expect(html).toContain('<main class="area-stage" data-area="recruiter">');
    expect(html).toContain('<div class="area-scene" aria-hidden="true">');
    expect(html.match(/<i><\/i>/g)).toHaveLength(10);
    expect(html).toContain('<h1 class="area-title">Recruiter</h1>');
    // O personagem já vem no HTML, com as dimensões, e é o que carrega primeiro.
    expect(html).toContain('<source type="image/avif" srcset="/_home/personas/recruiter.avif" />');
    expect(html).toContain(
      'src="/_home/personas/recruiter.webp" alt="" width="255" height="640" loading="eager" fetchpriority="high"',
    );
    expect(html).toContain(`<div class="area-outlet" data-load-error="${ui.en.loadError}"></div>`);
    expect(html).toContain(`<a class="area-back" href="/en/">${ui.en.construction.back}</a>`);
    // O selo de olá do cabeçalho saiu.
    expect(html).not.toContain('ds-badge');
  });

  it('marca o palco de uma área com conteúdo, sem mudar o resto do documento', () => {
    const construction = renderPage(recruiter, 'pt-BR', ui['pt-BR']);
    const content = renderPage(recruiter, 'pt-BR', ui['pt-BR'], { content: true });
    expect(content).toContain('<main class="area-stage" data-area="recruiter" data-content>');
    // O palco continua do documento: título, personagem, volta e pausa (ADR 0010).
    expect(content.replace(' data-content', '')).toBe(construction);
  });

  it('põe a pausa do cenário no grupo do canto, antes das bandeiras', () => {
    const html = renderPage(recruiter, 'es', ui.es);
    const pause = html.indexOf(`<input type="checkbox" aria-label="${ui.es.pauseMotion}" />`);
    expect(pause).toBeGreaterThan(html.indexOf('class="ds-dock"'));
    expect(pause).toBeLessThan(html.indexOf('class="ds-language-switcher"'));
  });

  it('escapa texto vindo do conteúdo', () => {
    const html = renderPage(recruiter, 'pt-BR', { ...ui['pt-BR'], siteName: '<b>x</b>' });
    expect(html).not.toContain('<b>x</b>');
  });
});
