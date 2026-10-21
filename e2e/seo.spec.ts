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

      // Confere tags Open Graph
      const ogLocaleMap = { 'pt-BR': 'pt_BR', en: 'en_US', es: 'es_ES' };
      const siteNameMap = { 'pt-BR': 'Portfólio', en: 'Portfolio', es: 'Portafolio' };
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
        'content',
        /.+/,
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        expectedCanonical,
      );
      await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
        'content',
        siteNameMap[locale],
      );
      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
        'content',
        ogLocaleMap[locale],
      );
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        `${PRODUCTION_ORIGIN}/_home/og-image.png`,
      );
      await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
        'content',
        '1200',
      );
      await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
        'content',
        '630',
      );
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    }
  });
}

test('imagem de compartilhamento og-image.png responde 200 com tipo png', async ({ request }) => {
  const response = await request.get('/_home/og-image.png');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/png');
});

test('home possui dados estruturados Person em JSON-LD nos três idiomas', async ({ page }) => {
  const homePaths = ['/', '/en/', '/es/'] as const;

  for (const path of homePaths) {
    await page.goto(path);
    const jsonLdLocator = page.locator('script[type="application/ld+json"]');
    await expect(jsonLdLocator).toHaveCount(1);

    const jsonLdText = await jsonLdLocator.textContent();
    expect(jsonLdText).toBeTruthy();

    const data = JSON.parse(jsonLdText ?? '{}');
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('Person');
    expect(data.name).toBe('Dario Reis');
    expect(data.jobTitle).toBe('Software Engineer');
    expect(data.url).toBe(`${PRODUCTION_ORIGIN}${path}`);
    expect(Array.isArray(data.sameAs)).toBe(true);
    expect(data.sameAs).toContain('https://www.linkedin.com/in/darioreisjr/');
    expect(data.sameAs).toContain('https://github.com/darioreisjr');
    expect(data.description).toBeTruthy();
  }
});
