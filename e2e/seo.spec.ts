import { expect, test } from '@playwright/test';

// Escrito à mão de propósito: o teste confere o site publicado contra a tabela de
// docs/architecture/mfe-map.md e a ADR 0014 (SEO: canonical, hreflang, sitemap, robots).
const PRODUCTION_ORIGIN = 'https://2027.darioreis.dev';

const areas = [
  {
    area: 'home',
    paths: {
      'pt-BR': '/',
      en: '/en/',
      es: '/es/',
    },
  },
  {
    area: 'recruiter',
    paths: {
      'pt-BR': '/recrutador/',
      en: '/en/recruiter/',
      es: '/es/reclutador/',
    },
  },
  {
    area: 'tech',
    paths: {
      'pt-BR': '/tecnico/',
      en: '/en/tech/',
      es: '/es/tecnico/',
    },
  },
  {
    area: 'client',
    paths: {
      'pt-BR': '/clientes/',
      en: '/en/clients/',
      es: '/es/clientes/',
    },
  },
  {
    area: 'community',
    paths: {
      'pt-BR': '/comunidade/',
      en: '/en/community/',
      es: '/es/comunidad/',
    },
  },
  {
    area: 'how-it-was-built',
    paths: {
      'pt-BR': '/como-foi-feito/',
      en: '/en/how-it-was-built/',
      es: '/es/como-se-hizo/',
    },
  },
] as const;

test('robots.txt responde 200 e aponta para o sitemap de produção', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);

  const text = await response.text();
  expect(text).toContain('User-agent: *');
  expect(text).toContain('Allow: /');
  expect(text).toContain(`Sitemap: ${PRODUCTION_ORIGIN}/sitemap.xml`);
});

test('sitemap.xml responde 200 e lista as 18 páginas com alternates hreflang', async ({
  request,
}) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);

  const xml = await response.text();
  expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');

  const urlMatches = xml.match(/<url>/g);
  expect(urlMatches).toHaveLength(18);

  for (const { paths } of areas) {
    const ptUrl = `${PRODUCTION_ORIGIN}${paths['pt-BR']}`;
    const enUrl = `${PRODUCTION_ORIGIN}${paths.en}`;
    const esUrl = `${PRODUCTION_ORIGIN}${paths.es}`;

    for (const locale of ['pt-BR', 'en', 'es'] as const) {
      const pageUrl = `${PRODUCTION_ORIGIN}${paths[locale]}`;
      expect(xml).toContain(`<loc>${pageUrl}</loc>`);
    }

    // Cada área deve conter seus links alternativos
    expect(xml).toContain(`hreflang="pt-BR" href="${ptUrl}"`);
    expect(xml).toContain(`hreflang="en" href="${enUrl}"`);
    expect(xml).toContain(`hreflang="es" href="${esUrl}"`);
    expect(xml).toContain(`hreflang="x-default" href="${ptUrl}"`);
  }
});

for (const { area, paths } of areas) {
  test(`${area}: possui canonical absoluto e hreflangs corretos nos 3 idiomas`, async ({
    page,
  }) => {
    const ptUrl = `${PRODUCTION_ORIGIN}${paths['pt-BR']}`;
    const enUrl = `${PRODUCTION_ORIGIN}${paths.en}`;
    const esUrl = `${PRODUCTION_ORIGIN}${paths.es}`;

    for (const locale of ['pt-BR', 'en', 'es'] as const) {
      const path = paths[locale];
      const expectedCanonical = `${PRODUCTION_ORIGIN}${path}`;

      await page.goto(path);

      // Confere <link rel="canonical">
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href', expectedCanonical);

      // Confere <link rel="alternate" hreflang="...">
      const alternatePt = page.locator('link[rel="alternate"][hreflang="pt-BR"]');
      await expect(alternatePt).toHaveAttribute('href', ptUrl);

      const alternateEn = page.locator('link[rel="alternate"][hreflang="en"]');
      await expect(alternateEn).toHaveAttribute('href', enUrl);

      const alternateEs = page.locator('link[rel="alternate"][hreflang="es"]');
      await expect(alternateEs).toHaveAttribute('href', esUrl);

      const alternateDefault = page.locator('link[rel="alternate"][hreflang="x-default"]');
      await expect(alternateDefault).toHaveAttribute('href', ptUrl);
    }
  });
}
