import type { Locale } from '@portfolio/contracts';
import type {
  Contact,
  Education,
  Experience,
  Localized,
  Profile,
  Project,
  Skill,
} from './schemas.js';

/** Uma tecnologia, já resolvida a partir do id. */
export interface RecruiterSkill {
  id: string;
  name: string;
  category: Skill['category'];
  level: Skill['level'];
}

/**
 * Tudo que a área do recrutador mostra em um idioma, já filtrado e traduzido:
 * o MFE recebe só o que usa, sem ids soltos nem os outros idiomas de cada texto.
 */
export interface RecruiterContent {
  /** O perfil ainda é rascunho: a página avisa que os dados são de exemplo. */
  example: boolean;
  name: string;
  role: string;
  tagline?: string;
  summary?: string;
  location?: string;
  availability?: string;
  workMode?: NonNullable<Profile['workMode']>;
  englishLevel?: NonNullable<Profile['englishLevel']>;
  seniority?: NonNullable<Profile['seniority']>;
  photo?: { src: string; alt: string };
  /** Caminho do currículo em PDF neste idioma. */
  cv?: string;
  skills: RecruiterSkill[];
  experiences: {
    id: string;
    company: string;
    companyUrl?: string;
    role: string;
    start: string;
    end: string | null;
    location?: string;
    mode?: NonNullable<Experience['mode']>;
    summary: string;
    highlights: string[];
    skills: string[];
  }[];
  projects: {
    id: string;
    title: string;
    summary: string;
    role?: string;
    challenge: string;
    result: string;
    skills: string[];
    repo?: string;
    demo?: string;
  }[];
  education: {
    id: string;
    kind: Education['kind'];
    title: string;
    institution: string;
    start?: string;
    end: string | null;
    credentialUrl?: string;
  }[];
  contacts: { id: string; kind: Contact['kind']; url: string; display: string }[];
}

export interface RecruiterSources {
  profile: Profile;
  contacts: Contact[];
  skills: Skill[];
  experiences: Experience[];
  education: Education[];
  projects: Project[];
}

/** Mais recente primeiro; o que ainda está em curso (`end: null`) vem antes. */
const byRecency = <Item extends { start?: string; end?: string | null }>(a: Item, b: Item) =>
  (b.end ?? '9999-99').localeCompare(a.end ?? '9999-99') ||
  (b.start ?? '').localeCompare(a.start ?? '');

/** Remove chaves sem valor, para o JSON gerado não levar `undefined`. */
const compact = <Value extends object>(value: Value): Value =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Value;

export function buildRecruiter(sources: RecruiterSources, locale: Locale): RecruiterContent {
  const { profile, contacts, skills, experiences, education, projects } = sources;
  // Rascunho pode ter só pt-BR; publicado tem os três, e a validação garante.
  const t = (value: Localized): string => value[locale] || value['pt-BR'];
  const maybe = (value: Localized | undefined) => (value ? t(value) : undefined);
  const skillName = new Map(skills.map((skill) => [skill.id, skill.name]));
  const names = (ids: string[]) => ids.flatMap((id) => skillName.get(id) ?? []);
  // As tecnologias em destaque abrem a lista, na ordem que o perfil deu.
  const rank = (skill: Skill) => {
    const index = profile.highlightSkills.indexOf(skill.id);
    return index === -1 ? profile.highlightSkills.length : index;
  };

  return compact({
    example: profile.status === 'draft',
    name: profile.name,
    role: t(profile.role),
    tagline: maybe(profile.tagline),
    summary: maybe(profile.summary),
    location: maybe(profile.location),
    availability: maybe(profile.availability),
    workMode: profile.workMode,
    englishLevel: profile.englishLevel,
    seniority: profile.seniority,
    photo: profile.photo && { src: profile.photo.src, alt: t(profile.photo.alt) },
    cv: profile.cv?.[locale],
    skills: [...skills]
      .sort((a, b) => rank(a) - rank(b))
      .map(({ id, name, category, level }) => ({ id, name, category, level })),
    experiences: [...experiences].sort(byRecency).map((experience) =>
      compact({
        id: experience.id,
        company: experience.company,
        companyUrl: experience.companyUrl,
        role: t(experience.role),
        start: experience.start,
        end: experience.end,
        location: maybe(experience.location),
        mode: experience.mode,
        summary: t(experience.summary),
        highlights: (experience.highlights ?? []).map(t),
        skills: names(experience.skills),
      }),
    ),
    // Só os projetos contados para o recrutador (com desafio e resultado).
    projects: [...projects].sort(byRecency).flatMap((project) =>
      project.recruiter
        ? compact({
            id: project.id,
            title: t(project.title),
            summary: t(project.summary),
            role: maybe(project.role),
            challenge: t(project.recruiter.challenge),
            result: t(project.recruiter.result),
            skills: names(project.skills),
            repo: project.links?.repo,
            demo: project.links?.demo,
          })
        : [],
    ),
    education: [...education].sort(byRecency).map((item) =>
      compact({
        id: item.id,
        kind: item.kind,
        title: t(item.title),
        institution: item.institution,
        start: item.start,
        end: item.end,
        credentialUrl: item.credentialUrl,
      }),
    ),
    contacts: contacts.map(({ id, kind, url, display }) => ({ id, kind, url, display })),
  });
}
