export const locales = ['pt-BR', 'en', 'es', 'pt-PT'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt-BR';

export type AreaId = 'home' | 'recruiter' | 'tech' | 'client' | 'community' | 'how-it-was-built';
export type AppOwner = 'web-next' | 'shell';

export interface MfeTarget {
  /** Custom element que o MFE registra. */
  tag: string;
  /** Módulo ES que registra o custom element. */
  script: string;
}

export interface RouteEntry {
  area: AreaId;
  owner: AppOwner;
  /** Presente só nas áreas servidas pelo shell. */
  mfe?: MfeTarget;
  /** Caminho por idioma, sempre com barra final. */
  paths: Record<Locale, string>;
}

// Fonte única das rotas. Espelha a tabela de docs/architecture/mfe-map.md.
export const routes: readonly RouteEntry[] = [
  {
    area: 'home',
    owner: 'web-next',
    paths: { 'pt-BR': '/', en: '/en/', es: '/es/', 'pt-PT': '/pt-pt/' },
  },
  {
    area: 'recruiter',
    owner: 'shell',
    mfe: { tag: 'mfe-recrutador', script: '/_mfe/vue/mfe.js' },
    paths: {
      'pt-BR': '/recrutador/',
      en: '/en/recruiter/',
      es: '/es/reclutador/',
      'pt-PT': '/pt-pt/recrutador/',
    },
  },
  {
    area: 'tech',
    owner: 'shell',
    mfe: { tag: 'mfe-tecnico', script: '/_mfe/angular/main.js' },
    paths: {
      'pt-BR': '/tecnico/',
      en: '/en/tech/',
      es: '/es/tecnico/',
      'pt-PT': '/pt-pt/tecnico/',
    },
  },
  {
    area: 'client',
    owner: 'shell',
    mfe: { tag: 'mfe-clientes', script: '/_mfe/react/mfe.js' },
    paths: {
      'pt-BR': '/clientes/',
      en: '/en/clients/',
      es: '/es/clientes/',
      'pt-PT': '/pt-pt/clientes/',
    },
  },
  {
    area: 'community',
    owner: 'web-next',
    paths: {
      'pt-BR': '/comunidade/',
      en: '/en/community/',
      es: '/es/comunidad/',
      'pt-PT': '/pt-pt/comunidade/',
    },
  },
  {
    area: 'how-it-was-built',
    owner: 'web-next',
    paths: {
      'pt-BR': '/como-foi-feito/',
      en: '/en/how-it-was-built/',
      es: '/es/como-se-hizo/',
      'pt-PT': '/pt-pt/como-foi-feito/',
    },
  },
];

export interface RouteMatch {
  entry: RouteEntry;
  locale: Locale;
}

const withTrailingSlash = (pathname: string): string =>
  pathname.endsWith('/') ? pathname : `${pathname}/`;

export function pathFor(area: AreaId, locale: Locale): string {
  const entry = routes.find((route) => route.area === area);
  if (!entry) throw new Error(`Área desconhecida: ${area}`);
  return entry.paths[locale];
}

export function findRoute(pathname: string): RouteMatch | undefined {
  const target = withTrailingSlash(pathname);
  for (const entry of routes) {
    const locale = locales.find((candidate) => entry.paths[candidate] === target);
    if (locale) return { entry, locale };
  }
  return undefined;
}

export function routesOwnedBy(owner: AppOwner): RouteEntry[] {
  return routes.filter((route) => route.owner === owner);
}
