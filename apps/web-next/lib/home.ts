import { home } from '@portfolio/content/home';
import { profile } from '@portfolio/content/profile';
import { ui } from '@portfolio/content/ui';
import { HOME_ASSETS_PATH, pathFor, routes, type AreaId, type Locale } from '@portfolio/contracts';

export const personaAreas = ['recruiter', 'tech', 'client', 'community'] as const;
export type PersonaArea = (typeof personaAreas)[number];

export interface Persona {
  area: PersonaArea;
  href: string;
  /** Falso quando a área é de outro app: aí o link é `<a>`, nunca `<Link>`. */
  sameApp: boolean;
  phrase: string;
  summary: string;
  badge: string;
  image: string;
}

export interface HomeModel {
  /** `null` enquanto o perfil não está publicado (ou sem rascunhos no build). */
  identity: { name: string; role: string } | null;
  title: string;
  enter: string;
  personas: Persona[];
  more: { href: string; label: string; sameApp: boolean };
}

const routeOf = (area: AreaId) => {
  const route = routes.find((candidate) => candidate.area === area);
  if (!route) throw new Error(`Área sem rota: ${area}`);
  return route;
};

/** Tudo que a tela de escolha de perfil mostra em um idioma. */
export function buildHome(locale: Locale): HomeModel {
  const text = home[locale];

  return {
    identity: profile
      ? { name: profile.name, role: profile.role[locale] ?? profile.role['pt-BR'] }
      : null,
    title: text.title,
    enter: text.enter,
    personas: personaAreas.map((area) => {
      const route = routeOf(area);
      return {
        area,
        href: pathFor(area, locale),
        sameApp: route.owner === 'web-next',
        phrase: text.personas[area].phrase,
        summary: ui[locale].areas[area].description,
        badge: text.madeIn.replace('{tech}', route.framework),
        image: `${HOME_ASSETS_PATH}personas/${area}.svg`,
      };
    }),
    more: {
      href: pathFor('how-it-was-built', locale),
      label: ui[locale].areas['how-it-was-built'].title,
      sameApp: routeOf('how-it-was-built').owner === 'web-next',
    },
  };
}
