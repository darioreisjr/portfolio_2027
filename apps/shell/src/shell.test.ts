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

  it('liga as outras áreas pelos caminhos do idioma da página', () => {
    const html = renderPage(recruiter, 'en', ui.en);
    expect(html).toContain('href="/en/tech/"');
    expect(html).toContain('href="/en/how-it-was-built/"');
    expect(html).toContain('href="/en/recruiter/" aria-current="page"');
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

  it('escapa texto vindo do conteúdo', () => {
    const html = renderPage(recruiter, 'pt-BR', { ...ui['pt-BR'], siteName: '<b>x</b>' });
    expect(html).not.toContain('<b>x</b>');
  });
});
