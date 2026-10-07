import { locales } from '@portfolio/contracts';
import { z } from 'zod';

const text = z.string().trim().min(1);

/** Texto traduzível. Só pt-BR é sempre obrigatório; ver `requireAllLocales`. */
export const localizedSchema = z
  .object({ 'pt-BR': text, en: z.string(), es: z.string(), 'pt-PT': z.string() })
  .partial({ en: true, es: true, 'pt-PT': true })
  .strict();
export type Localized = z.infer<typeof localizedSchema>;

export const statusSchema = z.enum(['draft', 'published']);
export type Status = z.infer<typeof statusSchema>;

const areaTextSchema = z.object({ title: text, description: text }).strict();

/** Textos de interface de um idioma. Sem `status`: não é conteúdo sobre o autor. */
export const uiSchema = z
  .object({
    siteName: text,
    hello: text,
    loadError: text,
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

export const profileSchema = z
  .object({
    status: statusSchema,
    name: text,
    role: localizedSchema,
    tagline: localizedSchema,
    summary: localizedSchema,
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

/** Item publicado precisa dos quatro idiomas preenchidos. */
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
