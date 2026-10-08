import { HOME_ASSETS_PATH, type AreaId } from './routes.js';

/** Áreas que têm personagem, na ordem em que aparecem na home. */
export const personaAreas = ['recruiter', 'tech', 'client', 'community'] as const;
export type PersonaArea = (typeof personaAreas)[number];

export interface PersonaFigure {
  /** WebP: reserva para navegador sem AVIF. */
  src: string;
  /** A mesma arte em AVIF, mais leve. */
  avif: string;
  /** Largura e altura do arquivo, para a imagem guardar o lugar antes de carregar. */
  width: number;
  height: number;
}

const figure = (file: string, width: number, height: number): PersonaFigure => ({
  src: `${HOME_ASSETS_PATH}personas/${file}.webp`,
  avif: `${HOME_ASSETS_PATH}personas/${file}.avif`,
  width,
  height,
});

/**
 * Arte de cada personagem. Os arquivos são servidos pelo app Next.js; a home e
 * as páginas internas (inclusive as do shell) os leem por aqui (ADR 0009).
 */
export const personaFigures: Record<PersonaArea, PersonaFigure> = {
  recruiter: figure('recruiter', 255, 640),
  tech: figure('tech', 257, 640),
  client: figure('client', 257, 640),
  community: figure('community', 234, 640),
};

/** A arte do personagem de uma área, ou `undefined` se a área não tem personagem. */
export function personaFigure(area: AreaId): PersonaFigure | undefined {
  return (personaFigures as Partial<Record<AreaId, PersonaFigure>>)[area];
}
