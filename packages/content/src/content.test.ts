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

describe('área do recrutador', () => {
  /** Altera uma lista dos dados reais. */
  const listWith = (file: string, change: (items: Json[]) => void) =>
    dataWith(file, (json) => change(json as unknown as Json[]));

  it('sem a exceção, não tem conteúdo em produção enquanto o perfil for rascunho', () => {
    const content = loadContent(dataDir, { includeDrafts: false });
    expect(content.recruiter).toBeNull();
    for (const locale of locales) expect(content.recruiterUi[locale].example.title).not.toBe('');
  });

  it('com a exceção, vai ao ar só como exemplo, sem levar o perfil para o resto do site', () => {
    const content = loadContent(dataDir, { includeDrafts: false, publishRecruiterExample: true });
    // A faixa "Dados de exemplo" depende desta marca.
    for (const locale of locales) {
      expect(content.recruiter?.[locale].example).toBe(true);
      expect(content.recruiter?.[locale].experiences.length).toBeGreaterThan(0);
    }
    // A home só mostra nome e cargo com perfil publicado: continua sem eles.
    expect(content.profile).toBeNull();
  });

  it('a exceção acaba quando o perfil é publicado: rascunho volta a ficar de fora', () => {
    const dir = dataWith('profile.json', (json) => {
      Object.assign(json, { status: 'published', highlightSkills: [] });
    });
    const { recruiter } = loadContent(dir, { includeDrafts: false, publishRecruiterExample: true });
    expect(recruiter?.['pt-BR'].example).toBe(false);
    expect(recruiter?.['pt-BR'].experiences).toEqual([]);
    expect(recruiter?.['pt-BR'].skills).toEqual([]);
  });

  it('com rascunhos, entrega o conteúdo de exemplo traduzido e marcado como exemplo', () => {
    const { recruiter } = loadContent(dataDir, { includeDrafts: true });
    if (!recruiter) throw new Error('sem conteúdo');
    for (const locale of locales) {
      const content = recruiter[locale];
      expect(content.example).toBe(true);
      expect(content.experiences.length).toBeGreaterThan(0);
      expect(content.projects.every((project) => project.challenge && project.result)).toBe(true);
      // Sem arquivo de currículo não há caminho: o botão não aparece.
      expect(content.cv).toBeUndefined();
    }
    expect(recruiter.en.role).not.toBe(recruiter['pt-BR'].role);
    // O emprego atual vem primeiro, e as skills chegam pelo nome.
    expect(recruiter['pt-BR'].experiences[0]?.end).toBeNull();
    expect(recruiter['pt-BR'].experiences[0]?.skills).toContain('TypeScript');
    // As tecnologias em destaque abrem a lista.
    expect(recruiter['pt-BR'].skills[0]?.name).toBe('TypeScript');
  });

  it('todo dado de exemplo é rascunho e visivelmente fictício', () => {
    const raw = (file: string) => JSON.parse(readFileSync(join(dataDir, file), 'utf8')) as Json[];
    for (const file of ['contacts', 'skills', 'experiences', 'education', 'projects']) {
      for (const item of raw(`${file}.json`)) {
        expect(item.status, `${file} ${String(item.id)}`).toBe('draft');
        expect(String(item.id), file).toMatch(/^exemplo-/);
      }
    }
    for (const contact of raw('contacts.json'))
      expect(String(contact.url)).toContain('example.com');
  });

  it('recusa referência a skill que não existe e id repetido', () => {
    const missing = listWith('experiences.json', (items) => {
      (items[0] as { skills: string[] }).skills.push('nao-existe');
    });
    expect(() => loadContent(missing, { includeDrafts: true })).toThrow(/skill inexistente/);

    const repeated = listWith('skills.json', (items) => {
      items.push({ ...(items[0] as Json) });
    });
    expect(() => loadContent(repeated, { includeDrafts: true })).toThrow(/id repetido/);
  });

  it('recusa item publicado sem tradução ou que dependa de skill em rascunho', () => {
    const untranslated = listWith('education.json', (items) => {
      Object.assign(items[0] as Json, { status: 'published', title: { 'pt-BR': 'Curso' } });
    });
    expect(() => loadContent(untranslated, { includeDrafts: true })).toThrow(/sem tradução/);

    const dangling = listWith('experiences.json', (items) => {
      (items[0] as Json).status = 'published';
    });
    expect(() => loadContent(dangling, { includeDrafts: true })).toThrow(/skill em rascunho/);
  });

  it('em produção, lista só os itens publicados de um perfil publicado', () => {
    const dir = listWith('skills.json', (items) => {
      (items[0] as Json).status = 'published';
    });
    const profilePath = join(dir, 'profile.json');
    const profile = JSON.parse(readFileSync(profilePath, 'utf8')) as Json;
    writeFileSync(
      profilePath,
      JSON.stringify({ ...profile, status: 'published', highlightSkills: ['exemplo-typescript'] }),
    );
    const { recruiter } = loadContent(dir, { includeDrafts: false });
    expect(recruiter?.['pt-BR'].example).toBe(false);
    expect(recruiter?.['pt-BR'].skills.map((skill) => skill.name)).toEqual(['TypeScript']);
    expect(recruiter?.['pt-BR'].experiences).toEqual([]);
  });
});
