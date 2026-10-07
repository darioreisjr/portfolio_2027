import { describe, expect, it } from 'vitest';
import { component, primitives, semantic, semanticStatic } from './tokens.mjs';

const references = (value) =>
  [...value.matchAll(/var\(--([a-z0-9-]+)\)/g)].map((match) => match[1]);

const semanticNames = new Set([...Object.keys(semantic.light), ...Object.keys(semanticStatic)]);

describe('tokens', () => {
  it('define todo token semântico nos dois temas', () => {
    expect(Object.keys(semantic.dark).sort()).toEqual(Object.keys(semantic.light).sort());
  });

  it('faz semânticos apontarem só para primitivos existentes', () => {
    const values = [semantic.light, semantic.dark, semanticStatic].flatMap(Object.values);
    for (const value of values) {
      for (const name of references(value)) expect(primitives).toHaveProperty(name);
    }
  });

  it('faz tokens de componente apontarem só para semânticos', () => {
    for (const value of Object.values(component)) {
      const names = references(value);
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) expect(semanticNames).toContain(name);
    }
  });

  it('não repete nome entre as camadas', () => {
    const names = [primitives, semanticStatic, semantic.light, component].flatMap(Object.keys);
    expect(new Set(names).size).toBe(names.length);
  });
});
