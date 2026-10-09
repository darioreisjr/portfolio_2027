import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { locales, type Locale } from '@portfolio/contracts';
import { z } from 'zod';
import { buildRecruiter, type RecruiterContent } from './recruiter.js';
import { buildTech, type TechContent } from './tech.js';
import {
  contactSchema,
  educationSchema,
  experienceSchema,
  homeSchema,
  profileSchema,
  projectSchema,
  recruiterUiSchema,
  siteSchema,
  skillSchema,
  techUiSchema,
  uiSchema,
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
}

export interface LoadOptions {
  /** Rascunhos entram só em desenvolvimento; o build de produção os exclui. */
  includeDrafts: boolean;
  /**
   * Publica uma área com os dados de exemplo (os rascunhos) enquanto ela não
   * tiver conteúdo publicado, com a faixa "Dados de exemplo" na página. Exceção
   * à regra de que rascunho não vai ao ar, autorizada pelo autor em 2026-10-09
   * para o recrutador e para a área técnica. Não muda `profile` nem outra área.
   */
  publishExample?: { recruiter?: boolean; tech?: boolean };
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

  const skillStatus = new Map(skills.map((skill) => [skill.id, skill.status]));
  checkSkillRefs(
    'profile.json',
    [{ status: rawProfile.status, skills: rawProfile.highlightSkills }],
    skillStatus,
  );
  checkSkillRefs('experiences.json', experiences, skillStatus);
  checkSkillRefs('projects.json', projects, skillStatus);

  const profile = rawProfile.status === 'published' || includeDrafts ? rawProfile : null;
  // Modo de exemplo: sem perfil publicado, a área do recrutador mostra os
  // rascunhos, que são os dados de exemplo. Com perfil publicado ele não existe.
  const example = Boolean(publishExample.recruiter) && rawProfile.status === 'draft';
  const visible = <Item extends Listed>(items: Item[]) =>
    items.filter((item) => item.status === 'published' || includeDrafts || example);
  const recruiterProfile = example ? rawProfile : profile;
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

  // Área técnica: com estudo de caso publicado, só o que é publicado. Sem
  // nenhum, os rascunhos entram em desenvolvimento ou pela exceção de exemplo.
  const isCase = (project: { technical?: unknown }) => project.technical !== undefined;
  const published = <Item extends Listed>(items: Item[]) =>
    items.filter((item) => item.status === 'published');
  const hasPublishedCase = published(projects).some(isCase);
  const techExample = !hasPublishedCase && (includeDrafts || Boolean(publishExample.tech));
  const techSources =
    hasPublishedCase || techExample
      ? {
          projects: techExample ? projects : published(projects),
          skills: techExample ? skills : published(skills),
          example: techExample,
        }
      : null;

  return {
    ui,
    home,
    profile,
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
