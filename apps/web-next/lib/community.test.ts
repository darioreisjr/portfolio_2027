import { ENTRY_STORAGE_KEY, locales } from '@portfolio/contracts';
import { describe, expect, it } from 'vitest';
import { buildCommunityPage } from './community';
import { COMMUNITY_LEAVE_SCRIPT } from './community-leave';

describe('página da comunidade', () => {
  it('monta o modelo nos três idiomas, com o repositório real do site', () => {
    for (const locale of locales) {
      const model = buildCommunityPage(locale);
      if (!model) throw new Error('sem conteúdo');
      expect(model.repository).toBe('https://github.com/darioreisjr/portfolio_2027');
      expect(model.articles.length).toBeGreaterThan(0);
      expect(model.text.join.items.length).toBeGreaterThan(0);
    }
    expect(buildCommunityPage('en')?.homeHref).toBe('/en/');
    expect(buildCommunityPage('es')?.builtHref).toBe('/es/como-se-hizo/');
  });

  it('o medidor de leitura é a fração do artigo mais longo, que enche a barra', () => {
    const model = buildCommunityPage('pt-BR');
    const minutes = model?.articles.map((article) => article.readingMinutes) ?? [];
    const longest = Math.max(...minutes);
    expect(model?.articles.map((article) => article.power)).toEqual(
      minutes.map((value) => Math.round((value / longest) * 100)),
    );
    expect(Math.max(...(model?.articles.map((article) => article.power) ?? []))).toBe(100);
    expect(model?.totalMinutes).toBe(minutes.reduce((sum, value) => sum + value, 0));
  });

  it('escreve a data e o idioma de cada artigo no idioma da página', () => {
    expect(buildCommunityPage('pt-BR')?.articles[0]?.date).toBe('12 de setembro de 2026');
    expect(buildCommunityPage('en')?.articles[0]?.date).toBe('September 12, 2026');
    // O nome do idioma do texto não se traduz: cada um aparece no próprio idioma.
    expect(buildCommunityPage('en')?.articles.at(-1)?.language).toBe('English');
  });

  it('a vitrine lista os tokens de verdade, pelo nome', () => {
    const model = buildCommunityPage('pt-BR');
    expect(model?.areaColors).toEqual([
      'color-area-recruiter',
      'color-area-tech',
      'color-area-client',
      'color-area-community',
    ]);
    expect(model?.baseColors).toContain('color-surface');
    expect(model?.typeSizes).toContain('text-size-title');
  });
});

describe('script do botão de volta da comunidade', () => {
  it('grava a marca da comunidade e pode ir dentro de um <script>', () => {
    expect(COMMUNITY_LEAVE_SCRIPT).toContain(JSON.stringify(ENTRY_STORAGE_KEY));
    expect(COMMUNITY_LEAVE_SCRIPT).toContain('"community:"+Date.now()');
    expect(COMMUNITY_LEAVE_SCRIPT).not.toContain('<');
    // Sintaxe válida: o navegador o executa como está.
    expect(() => new Function(COMMUNITY_LEAVE_SCRIPT)).not.toThrow();
  });
});
