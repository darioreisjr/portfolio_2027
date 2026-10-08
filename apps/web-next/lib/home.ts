import { home } from '@portfolio/content/home';
import { profile } from '@portfolio/content/profile';
import { HOME_ASSETS_PATH, pathFor, routes, type AreaId, type Locale } from '@portfolio/contracts';

export const personaAreas = ['recruiter', 'tech', 'client', 'community'] as const;
export type PersonaArea = (typeof personaAreas)[number];

export interface Figure {
  src: string;
  /** Mesma arte em AVIF, mais leve; `src` fica de reserva para navegador sem AVIF. */
  avif?: string;
  width: number;
  height: number;
}

// Arte de cada personagem, em public/_home/personas. Silhueta provisória onde a
// arte final ainda não chegou; largura e altura são as do arquivo.
const figures: Record<PersonaArea, { file: string; avif?: string; width: number; height: number }> =
  {
    recruiter: { file: 'recruiter.webp', avif: 'recruiter.avif', width: 255, height: 640 },
    tech: { file: 'tech.webp', avif: 'tech.avif', width: 257, height: 640 },
    client: { file: 'client.webp', avif: 'client.avif', width: 257, height: 640 },
    community: { file: 'community.webp', avif: 'community.avif', width: 234, height: 640 },
  };

export interface Persona {
  area: PersonaArea;
  href: string;
  /** Falso quando a área é de outro app: aí o link é `<a>`, nunca `<Link>`. */
  sameApp: boolean;
  phrase: string;
  /** O que a área traz e para quem, no tom daquele público. */
  description: string;
  figure: Figure;
}

export interface HomeModel {
  /** `null` enquanto o perfil não está publicado (ou sem rascunhos no build). */
  identity: { name: string; role: string } | null;
  title: string;
  enter: string;
  /** Desfaz a escolha do personagem. */
  back: string;
  /** Nome acessível do botão da música de fundo. */
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
        figure: {
          src: `${HOME_ASSETS_PATH}personas/${figures[area].file}`,
          avif: figures[area].avif && `${HOME_ASSETS_PATH}personas/${figures[area].avif}`,
          width: figures[area].width,
          height: figures[area].height,
        },
      };
    }),
  };
}
