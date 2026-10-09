import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { locales } from '@portfolio/contracts';
import { describe, expect, it } from 'vitest';
import { loadContent } from './load.js';

const dataDir = fileURLToPath(new URL('../data', import.meta.url));

type Json = Record<string, unknown>;

/** Copia os dados reais e aplica uma alteração em um arquivo JSON. */
function dataWith(file: string, change: (json: Json) => void): string {
  const copy = mkdtempSync(join(tmpdir(), 'content-'));
  cpSync(dataDir, copy, { recursive: true });
  const path = join(copy, file);
  const json = JSON.parse(readFileSync(path, 'utf8')) as Json;
  change(json);
  writeFileSync(path, JSON.stringify(json));
  return copy;
}

const allLocales = (value: string) => Object.fromEntries(locales.map((locale) => [locale, value]));

/** Perfil mínimo de teste; não depende do status do perfil real. */
const profileWith = (overrides: Json) =>
  dataWith('profile.json', (json) => {
    for (const key of Object.keys(json)) delete json[key];
    Object.assign(
      json,
      { name: 'Teste', role: allLocales('Cargo'), highlightSkills: [] },
      overrides,
    );
  });

describe('conteúdo do repositório', () => {
  it('é válido e tem textos de interface e da home nos três idiomas', () => {
    const { ui, home } = loadContent(dataDir, { includeDrafts: true });
    for (const locale of locales) {
      expect(ui[locale].construction.title).not.toBe('');
      expect(ui[locale].pauseMotion).not.toBe('');
      expect(home[locale].personas.recruiter.phrase).not.toBe('');
      expect(home[locale].personas.recruiter.description).not.toBe('');
      expect(home[locale].music).not.toBe('');
    }
  });
});

describe('rascunhos', () => {
  it('ficam fora do build de produção e entram em desenvolvimento', () => {
    const draft = profileWith({ status: 'draft' });
    expect(loadContent(draft, { includeDrafts: false }).profile).toBeNull();
    expect(loadContent(draft, { includeDrafts: true }).profile?.name).toBe('Teste');
  });

  it('não escondem item publicado', () => {
    const published = profileWith({ status: 'published' });
    expect(loadContent(published, { includeDrafts: false }).profile?.status).toBe('published');
  });
});

describe('validação', () => {
  it('recusa texto de interface com chave faltando', () => {
    const broken = dataWith('ui/es.json', (json) => delete json.siteName);
    expect(() => loadContent(broken, { includeDrafts: true })).toThrow(/ui\/es\.json/);
  });

  it('recusa chave desconhecida', () => {
    const broken = dataWith('ui/en.json', (json) => (json.extra = 'x'));
    expect(() => loadContent(broken, { includeDrafts: true })).toThrow(/ui\/en\.json/);
  });

  it('recusa texto da home com chave faltando ou personagem sem descrição', () => {
    const missing = dataWith('home/es.json', (json) => delete json.enter);
    expect(() => loadContent(missing, { includeDrafts: true })).toThrow(/home\/es\.json/);

    const noDescription = dataWith(
      'home/en.json',
      (json) => delete (json.personas as { tech: Json }).tech.description,
    );
    expect(() => loadContent(noDescription, { includeDrafts: true })).toThrow(/home\/en\.json/);
  });

  it('recusa item publicado sem todos os idiomas', () => {
    const broken = profileWith({ status: 'published', role: { 'pt-BR': 'Cargo' } });
    expect(() => loadContent(broken, { includeDrafts: true })).toThrow(/sem tradução/);
  });

  it('aceita perfil publicado sem tagline e sem summary', () => {
    const minimal = profileWith({ status: 'published' });
    expect(() => loadContent(minimal, { includeDrafts: true })).not.toThrow();
  });
});
