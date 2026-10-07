// Valida os JSON de data/ e gera os módulos que os apps importam.
// Roda depois do tsc, porque usa o validador já compilado em dist/.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../dist/load.js';

const dataDir = fileURLToPath(new URL('../data', import.meta.url));
const outDir = fileURLToPath(new URL('../dist/data', import.meta.url));
const includeDrafts = process.env.CONTENT_INCLUDE_DRAFTS === '1';

const { ui, profile } = loadContent(dataDir, { includeDrafts });

const modules = {
  ui: {
    value: ui,
    types: [
      "import type { Locale } from '@portfolio/contracts';",
      "import type { Ui } from '../schemas.js';",
      'export declare const ui: Readonly<Record<Locale, Ui>>;',
    ],
  },
  profile: {
    value: profile,
    types: [
      "import type { Profile } from '../schemas.js';",
      'export declare const profile: Readonly<Profile> | null;',
    ],
  },
};

mkdirSync(outDir, { recursive: true });
for (const [name, { value, types }] of Object.entries(modules)) {
  writeFileSync(
    `${outDir}/${name}.js`,
    `export const ${name} = ${JSON.stringify(value, null, 2)};\n`,
  );
  writeFileSync(`${outDir}/${name}.d.ts`, `${types.join('\n')}\n`);
}

console.log(`Conteúdo validado (${includeDrafts ? 'com' : 'sem'} rascunhos).`);
