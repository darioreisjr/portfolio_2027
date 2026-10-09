import { describe, expect, it } from 'vitest';
import {
  emitMfeReady,
  findRoute,
  languageAlternates,
  locales,
  onMfeReady,
  pathFor,
  personaAreas,
  personaFigure,
  routes,
  routesOwnedBy,
} from './index.js';

describe('tabela de rotas', () => {
  const allPaths = routes.flatMap((route) => locales.map((locale) => route.paths[locale]));

  it('não repete caminho entre áreas e idiomas', () => {
    expect(new Set(allPaths).size).toBe(allPaths.length);
  });

  it('usa barra inicial e final em todo caminho', () => {
    for (const path of allPaths) expect(path).toMatch(/^\/(.*\/)?$/);
  });

  it('dá um MFE a toda área do shell e a nenhuma do Next.js', () => {
    for (const route of routesOwnedBy('shell')) expect(route.mfe).toBeDefined();
    for (const route of routesOwnedBy('web-next')) expect(route.mfe).toBeUndefined();
  });

  it('diz a tecnologia de cada área, uma por área de MFE', () => {
    const byArea = Object.fromEntries(routes.map((route) => [route.area, route.framework]));
    expect(byArea).toMatchObject({ recruiter: 'Vue', tech: 'Angular', client: 'React' });
    for (const route of routesOwnedBy('web-next')) expect(route.framework).toBe('Next.js');
  });

  it('preserva a rota /como-foi-feito em pt-BR', () => {
    expect(pathFor('how-it-was-built', 'pt-BR')).toBe('/como-foi-feito/');
  });

  it('encontra área e idioma a partir do caminho, com ou sem barra final', () => {
    expect(findRoute('/en/recruiter')).toMatchObject({
      locale: 'en',
      entry: { area: 'recruiter' },
    });
    expect(findRoute('/tecnico/')).toMatchObject({ locale: 'pt-BR', entry: { area: 'tech' } });
    expect(findRoute('/nao-existe/')).toBeUndefined();
  });
});

describe('idiomas de uma área', () => {
  it('lista os três idiomas, com um só marcado como atual', () => {
    for (const { area } of routes) {
      for (const current of locales) {
        const alternates = languageAlternates(area, current);
        expect(alternates.map((alternate) => alternate.locale)).toEqual([...locales]);
        expect(alternates.filter((alternate) => alternate.current)).toEqual([
          expect.objectContaining({ locale: current }),
        ]);
      }
    }
  });

  it('leva à mesma área no outro idioma', () => {
    for (const alternate of languageAlternates('client', 'pt-BR')) {
      expect(alternate.href).toBe(pathFor('client', alternate.locale));
      expect(findRoute(alternate.href)).toMatchObject({
        locale: alternate.locale,
        entry: { area: 'client' },
      });
    }
  });

  it('dá a cada idioma o nome no próprio idioma e a bandeira publicada', () => {
    const spanish = languageAlternates('home', 'en').find(({ locale }) => locale === 'es');
    expect(spanish).toMatchObject({ name: 'Español', flag: '/_ds/flags/es.svg', href: '/es/' });
  });
});

describe('arte dos personagens', () => {
  it('dá a cada área com personagem os dois formatos e as dimensões do arquivo', () => {
    for (const area of personaAreas) {
      const figure = personaFigure(area);
      expect(figure?.src).toBe(`/_home/personas/${area}.webp`);
      expect(figure?.avif).toBe(`/_home/personas/${area}.avif`);
      expect(figure?.width).toBeGreaterThan(0);
      expect(figure?.height).toBeGreaterThan(figure?.width ?? Infinity);
    }
  });

  it('não inventa personagem para a home nem para "como foi feito"', () => {
    expect(personaFigure('home')).toBeUndefined();
    expect(personaFigure('how-it-was-built')).toBeUndefined();
  });
});

describe('evento mfe-pronto', () => {
  it('entrega o detalhe ao ouvinte e para depois do cancelamento', () => {
    const target = new EventTarget();
    const received: unknown[] = [];
    const cancel = onMfeReady((detail) => received.push(detail), target);

    emitMfeReady({ area: 'tech', locale: 'es' }, target);
    cancel();
    emitMfeReady({ area: 'client', locale: 'en' }, target);

    expect(received).toEqual([{ area: 'tech', locale: 'es' }]);
  });
});
