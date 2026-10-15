import { describe, expect, it } from 'vitest';
import { scriptValue } from './inline-script.js';

describe('scriptValue', () => {
  it('escreve o mesmo que JSON.stringify quando não há caractere perigoso', () => {
    for (const value of ['portfolio:tema', 42, ['recruiter', 'tech'], { a: 1 }]) {
      expect(scriptValue(value)).toBe(JSON.stringify(value));
    }
  });

  it('escapa o que fecharia a tag de script ou abriria um comentário de HTML', () => {
    const text = '</script><script>alert(1)</script><!--';
    const literal = scriptValue(text);
    expect(literal).not.toMatch(/[<>/]/);
    // O JavaScript lê o mesmo texto de volta.
    expect(JSON.parse(literal)).toBe(text);
  });

  it('escapa os separadores de linha que quebram scripts', () => {
    const text = `a${String.fromCharCode(0x2028)}b${String.fromCharCode(0x2029)}c`;
    const literal = scriptValue(text);
    expect(literal).toBe('"a\\u2028b\\u2029c"');
    expect(JSON.parse(literal)).toBe(text);
  });

  it('recusa o que não tem forma em JSON', () => {
    expect(() => scriptValue(undefined)).toThrow(TypeError);
  });
});
