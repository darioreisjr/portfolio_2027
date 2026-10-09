// Valida os JSON de data/ e gera os módulos que os apps importam.
// Roda depois do tsc, porque usa o validador já compilado em dist/.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../dist/load.js';

const dataDir = fileURLToPath(new URL('../data', import.meta.url));
const outDir = fileURLToPath(new URL('../dist/data', import.meta.url));
const includeDrafts = process.env.CONTENT_INCLUDE_DRAFTS === '1';

const { ui, home, profile, recruiter, recruiterUi } = loadContent(dataDir, { includeDrafts });

const modules = {
  ui: {
    value: ui,
    types: [
      "import type { Locale } from '@portfolio/contracts';",
      "import type { Ui } from '../schemas.js';",
      'export declare const ui: Readonly<Record<Locale, Ui>>;',
    ],
  },
  home: {
    value: home,
    types: [
      "import type { Locale } from '@portfolio/contracts';",
      "import type { Home } from '../schemas.js';",
      'export declare const home: Readonly<Record<Locale, Home>>;',
    ],
  },
  profile: {
    value: profile,
    types: [
      "import type { Profile } from '../schemas.js';",
      'export declare const profile: Readonly<Profile> | null;',
    ],
  },
  // Dois exports no mesmo módulo: o conteúdo da área e os textos de interface dela.
  recruiter: {
    value: recruiter,
    extra: { recruiterUi },
    types: [
      "import type { Locale } from '@portfolio/contracts';",
      "import type { RecruiterContent } from '../recruiter.js';",
      "import type { RecruiterUi } from '../schemas.js';",
      'export type { RecruiterContent, RecruiterUi };',
      'export declare const recruiter: Readonly<Record<Locale, RecruiterContent>> | null;',
      'export declare const recruiterUi: Readonly<Record<Locale, RecruiterUi>>;',
    ],
  },
};

mkdirSync(outDir, { recursive: true });
for (const [name, { value, types, extra = {} }] of Object.entries(modules)) {
  const source = Object.entries({ [name]: value, ...extra })
    .map(([key, entry]) => `export const ${key} = ${JSON.stringify(entry, null, 2)};\n`)
    .join('');
  writeFileSync(`${outDir}/${name}.js`, source);
  writeFileSync(`${outDir}/${name}.d.ts`, `${types.join('\n')}\n`);
}

console.log(`Conteúdo validado (${includeDrafts ? 'com' : 'sem'} rascunhos).`);
