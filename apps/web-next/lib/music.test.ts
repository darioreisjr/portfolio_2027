import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MUSIC_SRC } from './music';

describe('faixa de fundo da home', () => {
  const file = fileURLToPath(new URL(`../public${MUSIC_SRC}`, import.meta.url));

  it('existe no caminho que o botão toca e cabe no teto de áudio', () => {
    // docs/quality/budgets.md: um arquivo, de até 2,5 MB.
    expect(statSync(file).size).toBeLessThanOrEqual(2.5 * 1024 * 1024);
  });

  it('leva a versão no nome, que é o que permite o cache de um ano', () => {
    expect(MUSIC_SRC).toMatch(/^\/_home\/audio\/[a-z-]+\.v\d+\.mp3$/);
  });
});
