import { describe, expect, it } from 'vitest';
import {
  emitMfeReady,
  findRoute,
  locales,
  onMfeReady,
  pathFor,
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
