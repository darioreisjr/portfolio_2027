import { findRoute, locales, routesOwnedBy, type RouteMatch } from '@portfolio/contracts';

export interface PageParams {
  slug?: string[];
}

const toPath = (slug: string[] = []): string => `/${slug.join('/')}`;

/** Área e idioma de uma página deste app; `undefined` se o caminho não é dele. */
export function resolvePage({ slug }: PageParams): RouteMatch | undefined {
  const match = findRoute(toPath(slug));
  return match?.entry.owner === 'web-next' ? match : undefined;
}

/** Todas as páginas que o export estático precisa gerar, vindas da tabela de rotas. */
export function staticPageParams(): Required<PageParams>[] {
  return routesOwnedBy('web-next').flatMap((route) =>
    locales.map((locale) => ({ slug: route.paths[locale].split('/').filter(Boolean) })),
  );
}
