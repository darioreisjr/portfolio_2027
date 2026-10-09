import { home } from '@portfolio/content/home';
import { profile } from '@portfolio/content/profile';
import { ui } from '@portfolio/content/ui';
import {
  languageAlternates,
  pathFor,
  personaAreas,
  personaFigures,
  routes,
  type AreaId,
  type LanguageAlternate,
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
  /** Texto da transição de entrada em uma área. */
  entering: string;
  /** Nome acessível do botão de som (música de fundo e efeitos). */
  music: string;
  /** Pop-up da primeira visita: idioma e imersão. */
  intro: {
    title: string;
    immersion: string;
    hint: string;
    hintReduced: string;
    start: string;
    /** Nome do grupo de bandeiras e os idiomas, com o desta página marcado. */
    languagesLabel: string;
    languages: LanguageAlternate[];
  };
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
    entering: text.entering,
    music: text.music,
    intro: {
      ...text.intro,
      languagesLabel: ui[locale].languageSwitcher,
      languages: languageAlternates('home', locale),
    },
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
