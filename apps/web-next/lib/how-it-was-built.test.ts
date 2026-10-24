import { ENTRY_STORAGE_KEY, locales } from '@portfolio/contracts';
import { describe, expect, it } from 'vitest';
import { buildHowItWasBuiltPage } from './how-it-was-built';
import { HOW_IT_WAS_BUILT_LEAVE_SCRIPT } from './how-it-was-built-leave';

describe('página "como foi feito"', () => {
  it('monta o modelo nos três idiomas com dados reais', () => {
    for (const locale of locales) {
      const model = buildHowItWasBuiltPage(locale);
      if (!model) throw new Error('sem conteúdo');
      expect(model.content.repository).toBe('https://github.com/darioreisjr/portfolio_2027');
      expect(model.content.architecture.apps).toHaveLength(5);
      expect(model.content.adrs.items).toHaveLength(16);
      expect(model.content.metrics.areas).toHaveLength(6);
      expect(model.title).not.toBe('');
      expect(model.back).not.toBe('');
      expect(model.leaving).not.toBe('');
    }
    expect(buildHowItWasBuiltPage('pt-BR')?.homeHref).toBe('/');
    expect(buildHowItWasBuiltPage('en')?.homeHref).toBe('/en/');
    expect(buildHowItWasBuiltPage('es')?.homeHref).toBe('/es/');
  });

  it('as 16 ADRs contêm categorias válidas e status nos três idiomas', () => {
    const pt = buildHowItWasBuiltPage('pt-BR');
    const en = buildHowItWasBuiltPage('en');
    const es = buildHowItWasBuiltPage('es');

    expect(pt?.content.adrs.items[15]?.statusLabel).toBe('Aceito');
    expect(en?.content.adrs.items[15]?.statusLabel).toBe('Accepted');
    expect(es?.content.adrs.items[15]?.statusLabel).toBe('Aceptado');

    for (const item of pt?.content.adrs.items ?? []) {
      expect(item.category).toMatch(/composition|designSystem|navigation|governance/);
    }
  });
});

describe('script do botão de volta de "como foi feito"', () => {
  it('grava a marca de how-it-was-built e tem sintaxe válida', () => {
    expect(HOW_IT_WAS_BUILT_LEAVE_SCRIPT).toContain(JSON.stringify(ENTRY_STORAGE_KEY));
    expect(HOW_IT_WAS_BUILT_LEAVE_SCRIPT).toContain('"how-it-was-built:"+Date.now()');
    expect(HOW_IT_WAS_BUILT_LEAVE_SCRIPT).not.toContain('<');
    expect(() => new Function(HOW_IT_WAS_BUILT_LEAVE_SCRIPT)).not.toThrow();
  });
});
