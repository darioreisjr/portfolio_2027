import { describe, expect, it, vi } from 'vitest';

// O perfil real pode estar em rascunho; o teste fixa um para cobrir os dois casos.
const profileMock = vi.hoisted(() => ({
  value: null as null | { name: string; role: Record<string, string> },
}));
vi.mock('@portfolio/content/profile', () => ({
  get profile() {
    return profileMock.value;
  },
}));

const { buildHome } = await import('./home');

describe('tela de escolha de perfil', () => {
  it('tem os quatro perfis, na ordem, com o caminho do idioma', () => {
    const { personas } = buildHome('en');
    expect(personas.map((persona) => [persona.area, persona.href])).toEqual([
      ['recruiter', '/en/recruiter/'],
      ['tech', '/en/tech/'],
      ['client', '/en/clients/'],
      ['community', '/en/community/'],
    ]);
  });

  it('dá a cada perfil a descrição do idioma', () => {
    const descriptions = buildHome('en').personas.map((persona) => persona.description);
    expect(descriptions).toHaveLength(4);
    expect(descriptions[0]).toMatch(/^For those evaluating a candidate\./);
    expect(new Set(descriptions).size).toBe(4);
  });

  it('cada personagem leva ao caminho da área no idioma', () => {
    // Toda área é outro documento: o link é sempre um caminho, nunca rota do Next.
    expect(buildHome('es').personas.map((persona) => persona.href)).toEqual([
      '/es/reclutador/',
      '/es/tecnico/',
      '/es/clientes/',
      '/es/comunidad/',
    ]);
  });

  it('usa a frase e os rótulos do idioma', () => {
    const { personas, enter, back } = buildHome('es');
    expect(personas[0]?.phrase).toBe('Estoy contratando');
    expect(enter).toBe('Entrar');
    expect(back).toBe('Volver');
  });

  it('dá a cada personagem uma figura com dimensões', () => {
    for (const { figure } of buildHome('pt-BR').personas) {
      expect(figure.src).toMatch(/^\/_home\/personas\/[a-z]+\.(svg|webp)$/);
      if (figure.avif) expect(figure.avif).toMatch(/\.avif$/);
      expect(figure.width).toBeGreaterThan(0);
      expect(figure.height).toBeGreaterThan(figure.width);
    }
  });

  it('omite a apresentação sem perfil e a mostra no idioma quando há', () => {
    profileMock.value = null;
    expect(buildHome('pt-BR').identity).toBeNull();

    profileMock.value = { name: 'Fulana', role: { 'pt-BR': 'Cargo', en: 'Role' } };
    expect(buildHome('en').identity).toEqual({ name: 'Fulana', role: 'Role' });
    // Sem tradução, cai para pt-BR em vez de ficar vazio.
    expect(buildHome('es').identity).toEqual({ name: 'Fulana', role: 'Cargo' });
  });
});
