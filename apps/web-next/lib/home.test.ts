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

  it('mostra a tecnologia de cada área no selo', () => {
    const badges = buildHome('pt-BR').personas.map((persona) => persona.badge);
    expect(badges).toEqual([
      'Feito em Vue',
      'Feito em Angular',
      'Feito em React',
      'Feito em Next.js',
    ]);
  });

  it('marca como mesmo app só a área servida pelo Next.js', () => {
    const sameApp = buildHome('pt-BR').personas.filter((persona) => persona.sameApp);
    expect(sameApp.map((persona) => persona.area)).toEqual(['community']);
  });

  it('usa a frase e o resumo do idioma', () => {
    const [recruiter] = buildHome('es').personas;
    expect(recruiter?.phrase).toBe('Estoy contratando');
    expect(recruiter?.summary).toContain('contratando');
  });

  it('liga para "Como foi feito" no idioma', () => {
    expect(buildHome('pt-BR').more).toEqual({ href: '/como-foi-feito/', label: 'Como foi feito' });
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
