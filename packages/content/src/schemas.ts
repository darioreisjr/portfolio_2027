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
    /**
     * Nome acessível do botão de som da home (música de fundo e efeitos); o estado vai em
     * `aria-pressed`. O campo guarda o nome antigo, de quando o botão era só da música.
     */
    music: text,
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

export const profileSchema = z
  .object({
    status: statusSchema,
    name: text,
    role: localizedSchema,
    tagline: localizedSchema.optional(),
    summary: localizedSchema.optional(),
    location: localizedSchema.optional(),
    availability: localizedSchema.optional(),
    highlightSkills: z.array(text),
  })
  .strict()
  .superRefine((profile, context) => {
    if (profile.status !== 'published') return;
    for (const field of ['role', 'tagline', 'summary', 'location', 'availability'] as const) {
      const value = profile[field];
      if (value) requireAllLocales(value, [field], context);
    }
  });
export type Profile = z.infer<typeof profileSchema>;

/** Item publicado precisa de todos os idiomas preenchidos. */
function requireAllLocales(value: Localized, path: string[], context: z.RefinementCtx): void {
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
