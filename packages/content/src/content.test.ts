import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { locales } from '@portfolio/contracts';
import { describe, expect, it } from 'vitest';
import { loadContent } from './load.js';

const dataDir = fileURLToPath(new URL('../data', import.meta.url));

/** Copia os dados reais e aplica uma alteração em um arquivo JSON. */
function dataWith(file: string, change: (json: Record<string, unknown>) => void): string {
  const copy = mkdtempSync(join(tmpdir(), 'content-'));
  cpSync(dataDir, copy, { recursive: true });
  const path = join(copy, file);
  const json = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  change(json);
  writeFileSync(path, JSON.stringify(json));
  return copy;
}

describe('conteúdo do repositório', () => {
  it('é válido e tem textos de interface nos quatro idiomas', () => {
    const { ui } = loadContent(dataDir, { includeDrafts: true });
    for (const locale of locales) expect(ui[locale].hello).not.toBe('');
  });

  it('deixa rascunhos fora do build de produção', () => {
    expect(loadContent(dataDir, { includeDrafts: false }).profile).toBeNull();
    expect(loadContent(dataDir, { includeDrafts: true }).profile?.status).toBe('draft');
  });
});

describe('validação', () => {
  it('recusa texto de interface com chave faltando', () => {
    const broken = dataWith('ui/es.json', (json) => delete json.hello);
    expect(() => loadContent(broken, { includeDrafts: true })).toThrow(/ui\/es\.json/);
  });

  it('recusa chave desconhecida', () => {
    const broken = dataWith('ui/en.json', (json) => (json.extra = 'x'));
    expect(() => loadContent(broken, { includeDrafts: true })).toThrow(/ui\/en\.json/);
  });

  it('recusa item publicado sem os quatro idiomas', () => {
    const broken = dataWith('profile.json', (json) => (json.status = 'published'));
    expect(() => loadContent(broken, { includeDrafts: true })).toThrow(/sem tradução/);
  });
});
