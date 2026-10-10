// Valida os JSON de data/ e gera os módulos que os apps importam.
// Roda depois do tsc, porque usa o validador já compilado em dist/.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../dist/load.js';

const dataDir = fileURLToPath(new URL('../data', import.meta.url));
const outDir = fileURLToPath(new URL('../dist/data', import.meta.url));
const includeDrafts = process.env.CONTENT_INCLUDE_DRAFTS === '1';

// As áreas abaixo vão ao ar com os dados de exemplo e a faixa que os identifica,
// até o conteúdo real chegar. Autorizado pelo autor em 2026-10-09; para uma área
// voltar à tela "em construção" em produção, troque para `false`.
const PUBLISH_EXAMPLE = { recruiter: true, tech: true, client: true };

const content = loadContent(dataDir, {
  includeDrafts,
  publishExample: PUBLISH_EXAMPLE,
});
const { ui, home, profile, recruiter, recruiterUi, tech, techUi, site, client, clientUi } = content;

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
  // Área técnica: projetos e tecnologias, os textos de interface e o raio-x do site.
  tech: {
    value: tech,
    extra: { techUi, site },
    types: [
      "import type { Locale } from '@portfolio/contracts';",
      "import type { Site, TechUi } from '../schemas.js';",
      "import type { TechContent } from '../tech.js';",
      'export type { Site, TechContent, TechUi };',
      'export declare const tech: Readonly<Record<Locale, TechContent>> | null;',
      'export declare const techUi: Readonly<Record<Locale, TechUi>>;',
      'export declare const site: Readonly<Site>;',
    ],
  },
  // Área do cliente: o conteúdo por idioma e os textos de interface dela.
  client: {
    value: client,
    extra: { clientUi },
    types: [
      "import type { Locale } from '@portfolio/contracts';",
      "import type { ClientContent } from '../client.js';",
      "import type { ClientUi } from '../schemas.js';",
      'export type { ClientContent, ClientUi };',
      'export declare const client: Readonly<Record<Locale, ClientContent>> | null;',
      'export declare const clientUi: Readonly<Record<Locale, ClientUi>>;',
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
