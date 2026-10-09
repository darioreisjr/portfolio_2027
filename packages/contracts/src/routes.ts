export const locales = ['pt-BR', 'en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt-BR';

export type AreaId = 'home' | 'recruiter' | 'tech' | 'client' | 'community' | 'how-it-was-built';
export type AppOwner = 'web-next' | 'shell';
export type Framework = 'Next.js' | 'Vue' | 'Angular' | 'React';

export interface MfeTarget {
  /** Custom element que o MFE registra. */
  tag: string;
  /** Módulo ES que registra o custom element. */
  script: string;
}

export interface RouteEntry {
  area: AreaId;
  owner: AppOwner;
  /** Tecnologia que renderiza a área. Espelha a coluna de docs/architecture/mfe-map.md. */
  framework: Framework;
  /** Presente só nas áreas servidas pelo shell. */
  mfe?: MfeTarget;
  /** Caminho por idioma, sempre com barra final. */
  paths: Record<Locale, string>;
}

/** Arquivos estáticos da home, servidos pelo app Next.js. */
export const HOME_ASSETS_PATH = '/_home/';

// Fonte única das rotas. Espelha a tabela de docs/architecture/mfe-map.md.
export const routes: readonly RouteEntry[] = [
  {
    area: 'home',
    owner: 'web-next',
    framework: 'Next.js',
    paths: { 'pt-BR': '/', en: '/en/', es: '/es/' },
  },
  {
    area: 'recruiter',
    owner: 'shell',
    framework: 'Vue',
    mfe: { tag: 'mfe-recrutador', script: '/_mfe/vue/mfe.js' },
    paths: {
      'pt-BR': '/recrutador/',
      en: '/en/recruiter/',
      es: '/es/reclutador/',
    },
  },
  {
    area: 'tech',
    owner: 'shell',
    framework: 'Angular',
    mfe: { tag: 'mfe-tecnico', script: '/_mfe/angular/main.js' },
    paths: {
      'pt-BR': '/tecnico/',
      en: '/en/tech/',
      es: '/es/tecnico/',
    },
  },
  {
    area: 'client',
    owner: 'shell',
    framework: 'React',
    mfe: { tag: 'mfe-clientes', script: '/_mfe/react/mfe.js' },
    paths: {
      'pt-BR': '/clientes/',
      en: '/en/clients/',
      es: '/es/clientes/',
    },
  },
  {
    area: 'community',
    owner: 'web-next',
    framework: 'Next.js',
    paths: {
      'pt-BR': '/comunidade/',
      en: '/en/community/',
      es: '/es/comunidad/',
    },
  },
  {
    area: 'how-it-was-built',
    owner: 'web-next',
    framework: 'Next.js',
    paths: {
      'pt-BR': '/como-foi-feito/',
      en: '/en/how-it-was-built/',
      es: '/es/como-se-hizo/',
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
