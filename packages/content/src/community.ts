import type { Locale } from '@portfolio/contracts';
import type { Article, Contact, Localized, Project, Skill } from './schemas.js';

/**
 * Tudo que a área da comunidade mostra de artigos, código aberto e canais em um
 * idioma, já filtrado e traduzido. A vitrine do design system não vem daqui: a
 * página a monta com os componentes e os tokens de verdade.
 */
export interface CommunityContent {
  /** Que blocos são rascunho: cada um mostra a faixa "Dados de exemplo". */
  example: { articles: boolean; projects: boolean; channels: boolean };
  /** Mais recente primeiro. */
  articles: {
    id: string;
    title: string;
    summary: string;
    /** `AAAA-MM-DD`. */
    publishedAt: string;
    tags: string[];
    /** Onde o texto está publicado. */
    url: string;
    /** Idioma em que o texto foi escrito. */
    locale: Locale;
    readingMinutes: number;
  }[];
  /** Os projetos de código aberto. */
  projects: {
    id: string;
    title: string;
    summary: string;
    status: NonNullable<Project['openSourceStatus']>;
    skills: string[];
    repo?: string;
  }[];
  /** Onde acompanhar. */
  channels: { id: string; kind: Contact['kind']; url: string; display: string }[];
}

export interface CommunitySources {
  articles: Article[];
  projects: Project[];
  skills: Skill[];
  contacts: Contact[];
  example: CommunityContent['example'];
}

/** Remove chaves sem valor, para o JSON gerado não levar `undefined`. */
const compact = <Value extends object>(value: Value): Value =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Value;

export function buildCommunity(sources: CommunitySources, locale: Locale): CommunityContent {
  const { articles, projects, skills, contacts, example } = sources;
  // Rascunho pode ter só pt-BR; publicado tem os três, e a validação garante.
  const t = (value: Localized): string => value[locale] || value['pt-BR'];
  const skillName = new Map(skills.map((skill) => [skill.id, skill.name]));

  return {
    example,
    articles: [...articles]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .map((article) => ({
        id: article.id,
        title: t(article.title),
        summary: t(article.summary),
        publishedAt: article.publishedAt,
        tags: article.tags ?? [],
        url: article.url,
        locale: article.locale,
        readingMinutes: article.readingMinutes,
      })),
    projects: [...projects]
      .sort((a, b) => b.start.localeCompare(a.start))
      .flatMap((project) =>
        project.openSource && project.openSourceStatus
          ? compact({
              id: project.id,
              title: t(project.title),
              summary: t(project.summary),
              status: project.openSourceStatus,
              skills: project.skills.flatMap((id) => skillName.get(id) ?? []),
              repo: project.links?.repo,
            })
          : [],
      ),
    // Os canais marcados para a comunidade; sem marca nenhuma, nenhum.
    channels: contacts
      .filter((contact) => contact.primaryFor?.includes('community'))
      .map(({ id, kind, url, display }) => ({ id, kind, url, display })),
  };
}
