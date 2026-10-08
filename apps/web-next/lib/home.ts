import { home } from '@portfolio/content/home';
import { profile } from '@portfolio/content/profile';
import {
  pathFor,
  personaAreas,
  personaFigures,
  routes,
  type AreaId,
  type Locale,
  type PersonaArea,
  type PersonaFigure,
} from '@portfolio/contracts';

export interface Persona {
  area: PersonaArea;
  href: string;
  /** Falso quando a área é de outro app: aí o link é `<a>`, nunca `<Link>`. */
  sameApp: boolean;
  phrase: string;
  /** O que a área traz e para quem, no tom daquele público. */
  description: string;
  figure: PersonaFigure;
}

export interface HomeModel {
  /** `null` enquanto o perfil não está publicado (ou sem rascunhos no build). */
  identity: { name: string; role: string } | null;
  title: string;
  enter: string;
  /** Desfaz a escolha do personagem. */
  back: string;
  /** Nome acessível do botão de som (música de fundo e efeitos). */
  music: string;
  personas: Persona[];
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
    back: text.back,
    music: text.music,
    personas: personaAreas.map((area) => {
      const route = routeOf(area);
      return {
        area,
        href: pathFor(area, locale),
        sameApp: route.owner === 'web-next',
        phrase: text.personas[area].phrase,
        description: text.personas[area].description,
        figure: personaFigures[area],
      };
    }),
  };
}
