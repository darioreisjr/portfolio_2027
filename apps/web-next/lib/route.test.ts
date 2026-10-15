import { describe, expect, it } from 'vitest';
import { generateMetadata } from '../app/[[...slug]]/page';
import { resolvePage, staticPageParams } from './route';

describe('páginas do Next.js', () => {
  it('gera três áreas em três idiomas', () => {
    expect(staticPageParams()).toHaveLength(9);
  });

  it('gera a home pt-BR na raiz e preserva /como-foi-feito', () => {
    const slugs = staticPageParams().map(({ slug }) => slug.join('/'));
    expect(slugs).toContain('');
    expect(slugs).toContain('como-foi-feito');
    expect(slugs).toContain('en/how-it-was-built');
  });

  it('resolve área e idioma a partir do slug', () => {
    expect(resolvePage({})).toMatchObject({ locale: 'pt-BR', entry: { area: 'home' } });
    expect(resolvePage({ slug: ['es', 'comunidad'] })).toMatchObject({
      locale: 'es',
      entry: { area: 'community' },
    });
  });

  it('não responde por caminho de área do shell', () => {
    expect(resolvePage({ slug: ['recrutador'] })).toBeUndefined();
    expect(resolvePage({ slug: ['nao-existe'] })).toBeUndefined();
  });

  it('gera metadata com canonical e alternates hreflang', async () => {
    const metaHome = await generateMetadata({ params: Promise.resolve({}) });
    expect(metaHome.alternates?.canonical).toBe('https://2027.darioreis.dev/');
    expect(metaHome.alternates?.languages).toEqual({
      'pt-BR': 'https://2027.darioreis.dev/',
      en: 'https://2027.darioreis.dev/en/',
      es: 'https://2027.darioreis.dev/es/',
      'x-default': 'https://2027.darioreis.dev/',
    });

    const metaCommunity = await generateMetadata({
      params: Promise.resolve({ slug: ['en', 'community'] }),
    });
    expect(metaCommunity.alternates?.canonical).toBe('https://2027.darioreis.dev/en/community/');
    expect(metaCommunity.alternates?.languages).toEqual({
      'pt-BR': 'https://2027.darioreis.dev/comunidade/',
      en: 'https://2027.darioreis.dev/en/community/',
      es: 'https://2027.darioreis.dev/es/comunidad/',
      'x-default': 'https://2027.darioreis.dev/comunidade/',
    });
  });
});
