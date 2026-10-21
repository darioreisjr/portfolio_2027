// Valida os JSON de data/ e gera os módulos que os apps importam.
// Roda depois do tsc, porque usa o validador já compilado em dist/.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { locales } from '@portfolio/contracts';
import { loadContent } from '../dist/load.js';

const dataDir = fileURLToPath(new URL('../data', import.meta.url));
const outDir = fileURLToPath(new URL('../dist/data', import.meta.url));
const includeDrafts = process.env.CONTENT_INCLUDE_DRAFTS === '1';

// As áreas abaixo vão ao ar com os dados de exemplo e a faixa que os identifica,
// até o conteúdo real chegar. Autorizado pelo autor em 2026-10-09; para uma área
// voltar à tela "em construção" em produção, troque para `false`. A do
// recrutador saiu da exceção em 2026-10-12, quando os dados reais entraram: se o
// perfil voltar a rascunho, ela não põe exemplo no ar sob o nome do autor.
const PUBLISH_EXAMPLE = { recruiter: false, tech: true, client: true, community: true };

// A home mostra nome e cargo quando recebe o perfil. Ligado em 2026-10-13, com a
// linha em negrito, para a home não baixar um segundo arquivo de fonte (issue
// 18, pendência B10). Para tirar a linha da produção, troque para `false`.
const HOME_IDENTITY = true;

const content = loadContent(dataDir, {
  includeDrafts,
  publishExample: PUBLISH_EXAMPLE,
});
const { ui, home, recruiter, recruiterUi, tech, techUi, site, client, clientUi } = content;
const profile = includeDrafts || HOME_IDENTITY ? content.profile : null;
const contacts = includeDrafts || HOME_IDENTITY ? content.contacts : [];
const { community, communityUi, howItWasBuilt, howItWasBuiltUi } = content;

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
    extra: { contacts },
    types: [
      "import type { Contact, Profile } from '../schemas.js';",
      'export type { Contact, Profile };',
      'export declare const profile: Readonly<Profile> | null;',
      'export declare const contacts: Readonly<Contact[]>;',
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
  // Área da comunidade: artigos, código aberto e canais, e os textos de interface dela.
  community: {
    value: community,
    extra: { communityUi },
    types: [
      "import type { Locale } from '@portfolio/contracts';",
      "import type { CommunityContent } from '../community.js';",
      "import type { CommunityUi } from '../schemas.js';",
      'export type { CommunityContent, CommunityUi };',
      'export declare const community: Readonly<Record<Locale, CommunityContent>> | null;',
      'export declare const communityUi: Readonly<Record<Locale, CommunityUi>>;',
    ],
  },
  'how-it-was-built': {
    exportName: 'howItWasBuilt',
    value: howItWasBuilt,
    extra: { howItWasBuiltUi },
    types: [
      "import type { Locale } from '@portfolio/contracts';",
      "import type { HowItWasBuiltContent } from '../how-it-was-built.js';",
      "import type { HowItWasBuiltUi } from '../schemas.js';",
      'export type { HowItWasBuiltContent, HowItWasBuiltUi };',
      'export declare const howItWasBuilt: Readonly<Record<Locale, HowItWasBuiltContent>>;',
      'export declare const howItWasBuiltUi: Readonly<Record<Locale, HowItWasBuiltUi>>;',
    ],
  },
  // Módulo independente com o raio-x do próprio site (ADR 0012, issue #41).
  site: {
    value: site,
    types: [
      "import type { Site } from '../schemas.js';",
      'export type { Site };',
      'export declare const site: Readonly<Site>;',
    ],
  },
};

mkdirSync(outDir, { recursive: true });
for (const [name, { value, types, extra = {}, exportName = name }] of Object.entries(modules)) {
  const source = Object.entries({ [exportName]: value, ...extra })
    .map(([key, entry]) => `export const ${key} = ${JSON.stringify(entry, null, 2)};\n`)
    .join('');
  writeFileSync(`${outDir}/${name}.js`, source);
  writeFileSync(`${outDir}/${name}.d.ts`, `${types.join('\n')}\n`);
}

// Submódulos por idioma (Issue #32): cada MFE pode importar só o idioma da página,
// reduzindo o JavaScript transferido sem custo no LCP.
const localeSubmodules = {
  recruiter: (loc) => ({
    dir: 'recruiter',
    entries: {
      recruiter: recruiter ? recruiter[loc] : null,
      recruiterUi: recruiterUi[loc],
    },
    types: [
      "import type { RecruiterContent } from '../../recruiter.js';",
      "import type { RecruiterUi } from '../../schemas.js';",
      'export type { RecruiterContent, RecruiterUi };',
      'export declare const recruiter: Readonly<RecruiterContent> | null;',
      'export declare const recruiterUi: Readonly<RecruiterUi>;',
    ],
  }),
  tech: (loc) => ({
    dir: 'tech',
    entries: {
      tech: tech ? tech[loc] : null,
      techUi: techUi[loc],
      site,
    },
    types: [
      "import type { Site, TechUi } from '../../schemas.js';",
      "import type { TechContent } from '../../tech.js';",
      'export type { Site, TechContent, TechUi };',
      'export declare const tech: Readonly<TechContent> | null;',
      'export declare const techUi: Readonly<TechUi>;',
      'export declare const site: Readonly<Site>;',
    ],
  }),
  client: (loc) => ({
    dir: 'client',
    entries: {
      client: client ? client[loc] : null,
      clientUi: clientUi[loc],
    },
    types: [
      "import type { ClientContent } from '../../client.js';",
      "import type { ClientUi } from '../../schemas.js';",
      'export type { ClientContent, ClientUi };',
      'export declare const client: Readonly<ClientContent> | null;',
      'export declare const clientUi: Readonly<ClientUi>;',
    ],
  }),
  ui: (loc) => ({
    dir: 'ui',
    entries: {
      ui: ui[loc],
    },
    types: [
      "import type { Ui } from '../../schemas.js';",
      'export type { Ui };',
      'export declare const ui: Readonly<Ui>;',
    ],
  }),
};

for (const factory of Object.values(localeSubmodules)) {
  for (const locale of locales) {
    const { dir, entries, types } = factory(locale);
    const subDir = `${outDir}/${dir}`;
    mkdirSync(subDir, { recursive: true });

    const source = Object.entries(entries)
      .map(([key, entry]) => `export const ${key} = ${JSON.stringify(entry, null, 2)};\n`)
      .join('');
    writeFileSync(`${subDir}/${locale}.js`, source);
    writeFileSync(`${subDir}/${locale}.d.ts`, `${types.join('\n')}\n`);
  }
}

console.log(`Conteúdo validado (${includeDrafts ? 'com' : 'sem'} rascunhos).`);
