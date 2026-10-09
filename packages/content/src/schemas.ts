import { locales } from '@portfolio/contracts';
import { z } from 'zod';

const text = z.string().trim().min(1);

/** Texto traduzível. Só pt-BR é sempre obrigatório; ver `requireAllLocales`. */
export const localizedSchema = z
  .object({ 'pt-BR': text, en: z.string(), es: z.string() })
  .partial({ en: true, es: true })
  .strict();
export type Localized = z.infer<typeof localizedSchema>;

export const statusSchema = z.enum(['draft', 'published']);
export type Status = z.infer<typeof statusSchema>;

const areaTextSchema = z.object({ title: text, description: text }).strict();

/** Textos de interface de um idioma. Sem `status`: não é conteúdo sobre o autor. */
export const uiSchema = z
  .object({
    siteName: text,
    loadError: text,
    /** Nome acessível do seletor de tema; o estado vai em `aria-pressed`. */
    themeToggle: text,
    /** Nome acessível do grupo de bandeiras que troca o idioma. */
    languageSwitcher: text,
    /** Rótulo do controle que pausa a animação dos cenários, na home e nas páginas internas. */
    pauseMotion: text,
    /** Mostrado na cortina, ao voltar de uma área para a home. */
    leaving: text,
    /** Tela das páginas internas enquanto a área não tem conteúdo. */
    construction: z
      .object({
        title: text,
        text: text,
        /** Rótulo do link que volta à tela de escolha de perfil. */
        back: text,
      })
      .strict(),
    areas: z
      .object({
        home: areaTextSchema,
        recruiter: areaTextSchema,
        tech: areaTextSchema,
        client: areaTextSchema,
        community: areaTextSchema,
        'how-it-was-built': areaTextSchema,
      })
      .strict(),
  })
  .strict();
export type Ui = z.infer<typeof uiSchema>;

/** `phrase` é a fala do personagem; `description` diz, no tom do público, o que a área traz. */
const personaTextSchema = z.object({ phrase: text, description: text }).strict();

/** Textos da tela de escolha de perfil (home) em um idioma. */
export const homeSchema = z
  .object({
    title: text,
    enter: text,
    /** Desfaz a escolha do personagem. */
    back: text,
    /** Mostrado na transição de entrada em uma área. */
    entering: text,
    /**
     * Nome acessível do botão de som da home (música de fundo e efeitos); o estado vai em
     * `aria-pressed`. O campo guarda o nome antigo, de quando o botão era só da música.
     */
    music: text,
    /** Pop-up da primeira visita: idioma e imersão (música e animações). */
    intro: z
      .object({
        title: text,
        /** Rótulo da caixa de marcar. */
        immersion: text,
        /** O que a caixa liga. */
        hint: text,
        /** O mesmo, para quem pediu menos movimento ao sistema: só a música. */
        hintReduced: text,
        start: text,
      })
      .strict(),
    personas: z
      .object({
        recruiter: personaTextSchema,
        tech: personaTextSchema,
        client: personaTextSchema,
        community: personaTextSchema,
      })
      .strict(),
  })
  .strict();
export type Home = z.infer<typeof homeSchema>;

export const workModeSchema = z.enum(['remote', 'hybrid', 'onsite']);

/** Imagem de conteúdo; `alt` é obrigatório. */
export const imageSchema = z.object({ src: text, alt: localizedSchema }).strict();
export type Image = z.infer<typeof imageSchema>;

export const profileSchema = z
  .object({
    status: statusSchema,
    name: text,
    role: localizedSchema,
    tagline: localizedSchema.optional(),
    summary: localizedSchema.optional(),
    location: localizedSchema.optional(),
    availability: localizedSchema.optional(),
    /** Ficha rápida da área do recrutador. Os rótulos ficam em `recruiter/<locale>.json`. */
    workMode: workModeSchema.optional(),
    englishLevel: z.enum(['basic', 'intermediate', 'advanced', 'fluent']).optional(),
    seniority: z.enum(['junior', 'mid', 'senior', 'specialist']).optional(),
    photo: imageSchema.optional(),
    /** Caminho do currículo em PDF, por idioma. */
    cv: z.object({ 'pt-BR': text, en: text, es: text }).partial().strict().optional(),
    highlightSkills: z.array(text),
  })
  .strict()
  .superRefine(requirePublishedLocales);
export type Profile = z.infer<typeof profileSchema>;

const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id em kebab-case');
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'data no formato AAAA-MM');
const httpsUrl = z.string().regex(/^https:\/\/\S+$/, 'URL absoluta com https://');

export const audienceSchema = z.enum(['recruiter', 'tech', 'client', 'community']);
export type Audience = z.infer<typeof audienceSchema>;

export const contactSchema = z
  .object({
    id,
    status: statusSchema,
    kind: z.enum(['email', 'linkedin', 'github', 'whatsapp']),
    url: z.string().regex(/^(https:\/\/|mailto:)\S+$/, 'URL com https:// ou mailto:'),
    /** Texto visível, como o endereço. */
    display: text,
    primaryFor: z.array(audienceSchema).optional(),
  })
  .strict();
export type Contact = z.infer<typeof contactSchema>;

export const skillSchema = z
  .object({
    id,
    status: statusSchema,
    name: text,
    category: z.enum(['frontend', 'backend', 'database', 'devops', 'testing', 'design', 'other']),
    level: z.enum(['learning', 'working', 'advanced']),
    since: z.number().int().optional(),
  })
  .strict();
export type Skill = z.infer<typeof skillSchema>;

export const experienceSchema = z
  .object({
    id,
    status: statusSchema,
    company: text,
    companyUrl: httpsUrl.optional(),
    role: localizedSchema,
    start: yearMonth,
    /** `null`: emprego atual. */
    end: yearMonth.nullable(),
    location: localizedSchema.optional(),
    mode: workModeSchema.optional(),
    summary: localizedSchema,
    highlights: z.array(localizedSchema).optional(),
    skills: z.array(id),
  })
  .strict()
  .superRefine(requirePublishedLocales);
export type Experience = z.infer<typeof experienceSchema>;

export const educationSchema = z
  .object({
    id,
    status: statusSchema,
    kind: z.enum(['degree', 'course', 'certification']),
    title: localizedSchema,
    institution: text,
    start: yearMonth.optional(),
    /** `null`: em andamento. */
    end: yearMonth.nullable(),
    credentialUrl: httpsUrl.optional(),
  })
  .strict()
  .superRefine(requirePublishedLocales);
export type Education = z.infer<typeof educationSchema>;

export const projectSchema = z
  .object({
    id,
    status: statusSchema,
    slug: id,
    title: localizedSchema,
    summary: localizedSchema,
    start: yearMonth,
    end: yearMonth.optional(),
    role: localizedSchema.optional(),
    skills: z.array(id),
    links: z.object({ repo: httpsUrl, demo: httpsUrl }).partial().strict().optional(),
    openSource: z.boolean(),
    cover: imageSchema.optional(),
    gallery: z.array(imageSchema).optional(),
    /** Narrativa da área técnica. */
    technical: z
      .object({
        problem: localizedSchema,
        architecture: localizedSchema,
        tradeoffs: z.array(localizedSchema).optional(),
      })
      .strict()
      .optional(),
    /** Narrativa da área do cliente. */
    outcome: z.object({ context: localizedSchema, result: localizedSchema }).strict().optional(),
    /** Narrativa da área do recrutador: o desafio e o que saiu dele. */
    recruiter: z
      .object({ challenge: localizedSchema, result: localizedSchema })
      .strict()
      .optional(),
    featured: z.boolean().optional(),
  })
  .strict()
  .superRefine(requirePublishedLocales);
export type Project = z.infer<typeof projectSchema>;

const labels = <Key extends string>(keys: readonly Key[]) =>
  z.object(Object.fromEntries(keys.map((key) => [key, text])) as Record<Key, typeof text>).strict();

/**
 * Textos de interface da área do recrutador. Ficam fora de `ui` porque só o MFE
 * dela os usa; `ui` é importado inteiro pelos três MFEs.
 */
export const recruiterUiSchema = z
  .object({
    /** Faixa mostrada enquanto o perfil é rascunho. */
    example: labels(['title', 'text']),
    sheet: labels(['title', 'location', 'workMode', 'availability', 'english', 'seniority']),
    workModes: labels(['remote', 'hybrid', 'onsite']),
    englishLevels: labels(['basic', 'intermediate', 'advanced', 'fluent']),
    seniorities: labels(['junior', 'mid', 'senior', 'specialist']),
    summary: labels(['title']),
    stack: z
      .object({
        title: text,
        /** Opção do filtro que mostra todas as categorias. */
        all: text,
        filter: text,
        categories: labels([
          'frontend',
          'backend',
          'database',
          'devops',
          'testing',
          'design',
          'other',
        ]),
        levels: labels(['learning', 'working', 'advanced']),
      })
      .strict(),
    experience: labels(['title', 'present', 'highlights']),
    projects: labels(['title', 'role', 'challenge', 'result', 'repo', 'demo']),
    education: z
      .object({
        title: text,
        ongoing: text,
        credential: text,
        kinds: labels(['degree', 'course', 'certification']),
      })
      .strict(),
    cv: labels(['download']),
    contact: z
      .object({ title: text, kinds: labels(['email', 'linkedin', 'github', 'whatsapp']) })
      .strict(),
  })
  .strict();
export type RecruiterUi = z.infer<typeof recruiterUiSchema>;

const isLocalized = (value: unknown): value is Localized =>
  typeof value === 'object' && value !== null && 'pt-BR' in value;

/**
 * Item publicado precisa de todos os idiomas em todo texto traduzível, em
 * qualquer profundidade (campos, listas e narrativas).
 */
function requirePublishedLocales(item: { status: Status }, context: z.RefinementCtx): void {
  if (item.status !== 'published') return;
  const visit = (value: unknown, path: (string | number)[]): void => {
    if (isLocalized(value)) requireAllLocales(value, path, context);
    else if (Array.isArray(value)) value.forEach((entry, index) => visit(entry, [...path, index]));
    else if (typeof value === 'object' && value !== null) {
      for (const [key, entry] of Object.entries(value)) visit(entry, [...path, key]);
    }
  };
  visit(item, []);
}

function requireAllLocales(
  value: Localized,
  path: (string | number)[],
  context: z.RefinementCtx,
): void {
  for (const locale of locales) {
    if (!value[locale]?.trim()) {
      context.addIssue({
        code: 'custom',
        path: [...path, locale],
        message: `Item publicado sem tradução em ${locale}`,
      });
    }
  }
}
