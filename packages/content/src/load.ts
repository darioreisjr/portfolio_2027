import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { locales, type Locale } from '@portfolio/contracts';
import type { z } from 'zod';
import { profileSchema, uiSchema, type Profile, type Ui } from './schemas.js';

export interface Content {
  ui: Record<Locale, Ui>;
  /** `null` quando não há perfil publicado e os rascunhos estão fora. */
  profile: Profile | null;
}

export interface LoadOptions {
  /** Rascunhos entram só em desenvolvimento; o build de produção os exclui. */
  includeDrafts: boolean;
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

export function loadContent(dataDir: string, { includeDrafts }: LoadOptions): Content {
  const ui = Object.fromEntries(
    locales.map((locale) => [locale, parseFile(dataDir, `ui/${locale}.json`, uiSchema)]),
  ) as Record<Locale, Ui>;

  const profile = parseFile(dataDir, 'profile.json', profileSchema);

  return {
    ui,
    profile: profile.status === 'published' || includeDrafts ? profile : null,
  };
}
