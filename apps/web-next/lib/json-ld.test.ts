import { describe, expect, it } from 'vitest';
import { buildPersonJsonLd } from './json-ld';

describe('buildPersonJsonLd', () => {
  it('gera objeto Person válido para a home em pt-BR', () => {
    const ld = buildPersonJsonLd('pt-BR');
    expect(ld).not.toBeNull();
    expect(ld?.['@context']).toBe('https://schema.org');
    expect(ld?.['@type']).toBe('Person');
    expect(ld?.name).toBe('Dario Reis');
    expect(ld?.jobTitle).toBe('Software Engineer');
    expect(ld?.url).toBe('https://2027.darioreis.dev/');
    expect(ld?.sameAs).toContain('https://www.linkedin.com/in/darioreisjr/');
    expect(ld?.sameAs).toContain('https://github.com/darioreisjr');
    expect(ld?.description).toBeDefined();
  });

  it('gera URLs canônicas certas nos outros idiomas', () => {
    const ldEn = buildPersonJsonLd('en');
    expect(ldEn?.url).toBe('https://2027.darioreis.dev/en/');

    const ldEs = buildPersonJsonLd('es');
    expect(ldEs?.url).toBe('https://2027.darioreis.dev/es/');
  });
});
