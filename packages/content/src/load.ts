import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { locales, type Locale } from '@portfolio/contracts';
import { z } from 'zod';
import { buildClient, type ClientContent } from './client.js';
import { buildCommunity, type CommunityContent } from './community.js';
import { buildRecruiter, type RecruiterContent } from './recruiter.js';
import { buildTech, type TechContent } from './tech.js';
import {
  articleSchema,
  clientTermsSchema,
  clientUiSchema,
  communityUiSchema,
  contactSchema,
  educationSchema,
  experienceSchema,
  homeSchema,
  profileSchema,
  projectSchema,
  recruiterUiSchema,
  serviceSchema,
  siteSchema,
  skillSchema,
  techUiSchema,
  testimonialSchema,
  uiSchema,
  type ClientUi,
  type CommunityUi,
  type Home,
  type Profile,
  type RecruiterUi,
  type Site,
  type Status,
  type TechUi,
  type Ui,
} from './schemas.js';

export interface Content {
  ui: Record<Locale, Ui>;
  home: Record<Locale, Home>;
  /** `null` quando não há perfil publicado e os rascunhos estão fora. */
  profile: Profile | null;
  /** Textos de interface da área do recrutador. */
  recruiterUi: Record<Locale, RecruiterUi>;
  /**
   * Conteúdo da área do recrutador por idioma; `null` quando não há perfil. É
   * assim que a área sabe que deve mostrar a tela "em construção".
   */
  recruiter: Record<Locale, RecruiterContent> | null;
  /** Textos de interface da área técnica. */
  techUi: Record<Locale, TechUi>;
  /** Projetos e tecnologias da área técnica por idioma; `null` quando não há o que mostrar. */
  tech: Record<Locale, TechContent> | null;
  /** Raio-x do próprio site: dado real do repositório (ADR 0012). */
  site: Site;
  /** Textos de interface da área do cliente. */
  clientUi: Record<Locale, ClientUi>;
  /** Conteúdo da área do cliente por idioma; `null` sem serviços para mostrar. */
  client: Record<Locale, ClientContent> | null;
  /** Textos de interface da área da comunidade. */
  communityUi: Record<Locale, CommunityUi>;
  /** Artigos, código aberto e canais por idioma; `null` sem artigo nem projeto. */
  community: Record<Locale, CommunityContent> | null;
}

export interface LoadOptions {
  /** Rascunhos entram só em desenvolvimento; o build de produção os exclui. */
  includeDrafts: boolean;
  /**
   * Publica uma área com os dados de exemplo (ids `exemplo-`) enquanto ela não
   * tiver conteúdo real, com a faixa "Dados de exemplo" na página. Exceção à
   * regra de que rascunho não vai ao ar, autorizada pelo autor em 2026-10-09
   * para o recrutador e a área técnica, e em 2026-10-10 para a do cliente e a
   * comunidade. Não muda `profile` nem outra área.
   */
  publishExample?: { recruiter?: boolean; tech?: boolean; client?: boolean; community?: boolean };
}

function parseFile<Schema extends z.ZodType>(
  dataDir: string,
  file: string,
  schema: Schema,
): z.infer<Schema> {
  const raw: unknown = JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(raiz)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Conteúdo inválido em ${file}:\n${issues}`);
  }
  return result.data;
}

interface Listed {
  id: string;
  status: Status;
}

/**
 * Dado de exemplo tem id com este prefixo e é sempre rascunho. Todo o resto é
 * dado real. Cada bloco de cada área usa um conjunto ou o outro, nunca os dois.
 */
const EXAMPLE_PREFIX = 'exemplo-';
const isExample = (item: { id: string }) => item.id.startsWith(EXAMPLE_PREFIX);
const examples = <Item extends Listed>(items: Item[]) => items.filter(isExample);

/** Recusa dado de exemplo publicado: ele iria ao ar sem a faixa que o identifica. */
function checkExamples(file: string, items: Listed[]): void {
  for (const item of items) {
    if (isExample(item) && item.status === 'published') {
      throw new Error(`Conteúdo inválido em ${file}:\n  dado de exemplo publicado: ${item.id}`);
    }
  }
}

/** Lê uma lista e recusa ids repetidos. */
function parseList<Schema extends z.ZodType<Listed>>(
  dataDir: string,
  file: string,
  schema: Schema,
): z.infer<Schema>[] {
  const items = parseFile(dataDir, file, z.array(schema));
  const seen = new Set<string>();
  for (const { id } of items) {
    if (seen.has(id)) throw new Error(`Conteúdo inválido em ${file}:\n  id repetido: ${id}`);
    seen.add(id);
  }
  return items;
}

/**
 * Confere as referências a skills antes de filtrar os rascunhos: o alvo tem de
 * existir, e item publicado não pode depender de skill em rascunho, que some do
 * build de produção.
 */
function checkSkillRefs(
  file: string,
  owners: { id?: string; status: Status; skills: string[] }[],
  skills: Map<string, Status>,
): void {
  for (const owner of owners) {
    for (const skill of owner.skills) {
      const status = skills.get(skill);
      const where = `Conteúdo inválido em ${file}:\n  ${owner.id ?? '(raiz)'}:`;
      if (!status) throw new Error(`${where} skill inexistente: ${skill}`);
      if (owner.id && isExample({ id: owner.id }) !== isExample({ id: skill })) {
        throw new Error(`${where} mistura dado real com dado de exemplo: ${skill}`);
      }
      if (owner.status === 'published' && status === 'draft') {
        throw new Error(`${where} item publicado usa skill em rascunho: ${skill}`);
      }
    }
  }
}

export function loadContent(
  dataDir: string,
  { includeDrafts, publishExample = {} }: LoadOptions,
): Content {
  const ui = Object.fromEntries(
    locales.map((locale) => [locale, parseFile(dataDir, `ui/${locale}.json`, uiSchema)]),
  ) as Record<Locale, Ui>;

  const home = Object.fromEntries(
    locales.map((locale) => [locale, parseFile(dataDir, `home/${locale}.json`, homeSchema)]),
  ) as Record<Locale, Home>;

  const recruiterUi = Object.fromEntries(
    locales.map((locale) => [
      locale,
      parseFile(dataDir, `recruiter/${locale}.json`, recruiterUiSchema),
    ]),
  ) as Record<Locale, RecruiterUi>;

  const rawProfile = parseFile(dataDir, 'profile.json', profileSchema);
  const contacts = parseList(dataDir, 'contacts.json', contactSchema);
  const skills = parseList(dataDir, 'skills.json', skillSchema);
  const experiences = parseList(dataDir, 'experiences.json', experienceSchema);
  const education = parseList(dataDir, 'education.json', educationSchema);
  const projects = parseList(dataDir, 'projects.json', projectSchema);

  for (const [file, items] of [
    ['contacts.json', contacts],
    ['skills.json', skills],
    ['experiences.json', experiences],
    ['education.json', education],
    ['projects.json', projects],
  ] as const) {
    checkExamples(file, items);
  }

  const skillStatus = new Map(skills.map((skill) => [skill.id, skill.status]));
  checkSkillRefs(
    'profile.json',
    [{ status: rawProfile.status, skills: rawProfile.highlightSkills }],
    skillStatus,
  );
  checkSkillRefs('experiences.json', experiences, skillStatus);
  checkSkillRefs('projects.json', projects, skillStatus);

  const profile = rawProfile.status === 'published' || includeDrafts ? rawProfile : null;
  /** Os dados reais: os publicados e, em desenvolvimento, também os rascunhos. */
  const real = <Item extends Listed>(items: Item[]) =>
    items.filter((item) => !isExample(item) && (item.status === 'published' || includeDrafts));
  // Modo de exemplo: enquanto o perfil for rascunho, a área do recrutador mostra
  // só os dados de exemplo, em desenvolvimento ou pela exceção. Com perfil
  // publicado ela mostra só os dados reais, também em desenvolvimento.
  const example =
    rawProfile.status === 'draft' && (includeDrafts || Boolean(publishExample.recruiter));
  const visible = example ? examples : real;
  const recruiterProfile = rawProfile.status === 'published' || example ? rawProfile : null;
  const sources = recruiterProfile && {
    profile: recruiterProfile,
    contacts: visible(contacts),
    skills: visible(skills),
    experiences: visible(experiences),
    education: visible(education),
    projects: visible(projects),
  };

  const techUi = Object.fromEntries(
    locales.map((locale) => [locale, parseFile(dataDir, `tech/${locale}.json`, techUiSchema)]),
  ) as Record<Locale, TechUi>;
  const site = parseFile(dataDir, 'site.json', siteSchema);

  // Área técnica: com estudo de caso real, só os dados reais. Sem nenhum, os de
  // exemplo entram em desenvolvimento ou pela exceção, com as skills de exemplo.
  const isCase = (project: { technical?: unknown }) => project.technical !== undefined;
  const hasRealCase = real(projects).some(isCase);
  const techExample = !hasRealCase && (includeDrafts || Boolean(publishExample.tech));
  const techSources =
    hasRealCase || techExample
      ? {
          projects: techExample ? examples(projects) : real(projects),
          skills: techExample ? examples(skills) : real(skills),
          example: techExample,
        }
      : null;

  // Área do cliente. Cada bloco é real quando tem item publicado e de exemplo
  // quando só há rascunho; a área existe se houver serviço para mostrar.
  const clientUi = Object.fromEntries(
    locales.map((locale) => [locale, parseFile(dataDir, `client/${locale}.json`, clientUiSchema)]),
  ) as Record<Locale, ClientUi>;
  const services = parseList(dataDir, 'services.json', serviceSchema);
  const testimonials = parseList(dataDir, 'testimonials.json', testimonialSchema);
  const terms = parseFile(dataDir, 'client.json', clientTermsSchema);
  checkExamples('services.json', services);
  checkExamples('testimonials.json', testimonials);
  const projectIds = new Set(projects.map((project) => project.id));
  for (const [file, owners] of [
    [
      'services.json',
      services.map((service) => ({ id: service.id, refs: service.relatedProjects ?? [] })),
    ],
    [
      'testimonials.json',
      testimonials.map((item) => ({ id: item.id, refs: [item.relatedProject ?? []].flat() })),
    ],
  ] as const) {
    for (const owner of owners) {
      for (const ref of owner.refs) {
        const where = `Conteúdo inválido em ${file}:\n  ${owner.id}:`;
        if (!projectIds.has(ref)) throw new Error(`${where} projeto inexistente: ${ref}`);
        if (isExample(owner) !== isExample({ id: ref })) {
          throw new Error(`${where} mistura dado real com dado de exemplo: ${ref}`);
        }
      }
    }
  }

  const drafts = includeDrafts || Boolean(publishExample.client);
  /** Os dados reais; sem nenhum, os de exemplo, se a área puder mostrá-los. */
  const pick = <Item extends Listed>(items: Item[]) => {
    const own = real(items);
    return own.length
      ? { items: own, example: false }
      : { items: drafts ? examples(items) : [], example: drafts };
  };
  const hasOutcome = (project: { outcome?: unknown }) => project.outcome !== undefined;
  const clientServices = pick(services);
  const clientCases = pick(projects.filter(hasOutcome));
  const realTestimonials = real(testimonials);
  // Depoimento fictício ao lado de serviço real seria o pior caso: os de
  // exemplo só aparecem enquanto os serviços também forem de exemplo.
  const clientTestimonials = realTestimonials.length
    ? { items: realTestimonials, example: false }
    : {
        items: clientServices.example ? examples(testimonials) : [],
        example: clientServices.example,
      };
  const termsVisible = terms.status === 'published' || drafts;
  const clientSources =
    clientServices.items.length && termsVisible
      ? {
          services: clientServices.items,
          projects: clientCases.items,
          testimonials: clientTestimonials.items,
          terms,
          // Os canais seguem os serviços: contato real não acompanha oferta fictícia.
          contacts: clientServices.example ? examples(contacts) : real(contacts),
          example: {
            services: clientServices.example,
            cases: clientCases.example,
            testimonials: clientTestimonials.example,
            terms: terms.status === 'draft',
          },
        }
      : null;

  // Área da comunidade: artigos, código aberto e canais, cada bloco com os dados
  // reais quando há algum e com os de exemplo quando não há.
  const communityUi = Object.fromEntries(
    locales.map((locale) => [
      locale,
      parseFile(dataDir, `community/${locale}.json`, communityUiSchema),
    ]),
  ) as Record<Locale, CommunityUi>;
  const articles = parseList(dataDir, 'articles.json', articleSchema);
  checkExamples('articles.json', articles);
  const communityDrafts = includeDrafts || Boolean(publishExample.community);
  const choose = <Item extends Listed>(items: Item[]) => {
    const own = real(items);
    return own.length
      ? { items: own, example: false }
      : { items: communityDrafts ? examples(items) : [], example: communityDrafts };
  };
  const communityArticles = choose(articles);
  const communityProjects = choose(projects.filter((project) => project.openSource));
  const communityChannels = choose(
    contacts.filter((contact) => contact.primaryFor?.includes('community')),
  );
  const communitySources =
    communityArticles.items.length || communityProjects.items.length
      ? {
          articles: communityArticles.items,
          projects: communityProjects.items,
          // Projeto de exemplo cita skill de exemplo; projeto real, skill real.
          skills: communityProjects.example ? examples(skills) : real(skills),
          contacts: communityChannels.items,
          example: {
            articles: communityArticles.example,
            projects: communityProjects.example,
            channels: communityChannels.example,
          },
        }
      : null;

  return {
    ui,
    home,
    profile,
    communityUi,
    community: communitySources
      ? (Object.fromEntries(
          locales.map((locale) => [locale, buildCommunity(communitySources, locale)]),
        ) as Record<Locale, CommunityContent>)
      : null,
    clientUi,
    client: clientSources
      ? (Object.fromEntries(
          locales.map((locale) => [locale, buildClient(clientSources, locale)]),
        ) as Record<Locale, ClientContent>)
      : null,
    techUi,
    site,
    tech:
      techSources && techSources.projects.some(isCase)
        ? (Object.fromEntries(
            locales.map((locale) => [locale, buildTech(techSources, locale)]),
          ) as Record<Locale, TechContent>)
        : null,
    recruiterUi,
    recruiter:
      sources &&
      (Object.fromEntries(
        locales.map((locale) => [locale, buildRecruiter(sources, locale)]),
      ) as Record<Locale, RecruiterContent>),
  };
}
