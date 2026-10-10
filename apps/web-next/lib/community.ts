import {
  community,
  communityUi,
  type CommunityContent,
  type CommunityUi,
} from '@portfolio/content/community';
import { site } from '@portfolio/content/tech';
import { ui } from '@portfolio/content/ui';
import {
  localeNames,
  pathFor,
  personaFigure,
  type Locale,
  type PersonaFigure,
} from '@portfolio/contracts';
import { tokenNames } from '@portfolio/tokens';

export interface CommunityModel {
  content: CommunityContent;
  text: CommunityUi;
  /** Nome da área, o título da página. */
  title: string;
  figure: PersonaFigure | undefined;
  /** Endereço real do repositório deste site (ADR 0012). */
  repository: string;
  /** Artigos com a data escrita no idioma e a fração do medidor de leitura. */
  articles: (CommunityContent['articles'][number] & {
    date: string;
    language: string;
    /** Minutos deste artigo sobre os do mais longo, de 0 a 100. */
    power: number;
  })[];
  totalMinutes: number;
  /** Tokens mostrados na vitrine: os nomes vêm do pacote, o valor é o do tema em uso. */
  areaColors: string[];
  baseColors: string[];
  typeSizes: string[];
  homeHref: string;
  builtHref: string;
  back: string;
  leaving: string;
}

const named = (pattern: RegExp) => tokenNames.filter((name) => pattern.test(name));

/**
 * Tudo que a página da comunidade mostra em um idioma. `null` quando não há
 * artigo nem projeto para mostrar: a página cai na tela "em construção".
 */
export function buildCommunityPage(locale: Locale): CommunityModel | null {
  const content = community?.[locale];
  if (!content) return null;

  const longest = Math.max(1, ...content.articles.map((article) => article.readingMinutes));
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' });

  return {
    content,
    text: communityUi[locale],
    title: ui[locale].areas.community.title,
    figure: personaFigure('community'),
    repository: site.repository,
    articles: content.articles.map((article) => ({
      ...article,
      date: date.format(new Date(`${article.publishedAt}T00:00:00Z`)),
      language: localeNames[article.locale],
      power: Math.round((article.readingMinutes / longest) * 100),
    })),
    totalMinutes: content.articles.reduce((sum, article) => sum + article.readingMinutes, 0),
    areaColors: named(/^color-area-/),
    baseColors: named(/^color-(surface|text|border)/),
    typeSizes: named(/^text-size-/),
    homeHref: pathFor('home', locale),
    builtHref: pathFor('how-it-was-built', locale),
    back: ui[locale].construction.back,
    leaving: ui[locale].leaving,
  };
}
