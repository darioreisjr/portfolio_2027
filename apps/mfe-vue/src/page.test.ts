import type { RecruiterContent } from '@portfolio/content/recruiter';
import { onMfeReady } from '@portfolio/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Conteúdo de teste, fictício: a página só existe com conteúdo, e o do
// repositório é rascunho (fica fora do build de produção).
const content = vi.hoisted(() => {
  const base: RecruiterContent = {
    example: true,
    name: 'Pessoa Teste',
    role: 'Cargo de teste',
    tagline: 'Frase de teste',
    summary: 'Resumo de teste',
    location: 'Cidade Teste',
    availability: 'Disponível em teste',
    workMode: 'hybrid',
    englishLevel: 'advanced',
    seniority: 'senior',
    skills: [
      { id: 'a', name: 'Linguagem A', category: 'frontend', level: 'advanced' },
      { id: 'b', name: 'Banco B', category: 'database', level: 'learning' },
    ],
    experiences: [
      {
        id: 'atual',
        company: 'Empresa Teste',
        companyUrl: 'https://example.com',
        role: 'Função atual',
        start: '2024-03',
        end: null,
        mode: 'remote',
        summary: 'O que faz',
        highlights: ['Destaque um', 'Destaque dois'],
        skills: ['Linguagem A'],
      },
    ],
    projects: [
      {
        id: 'p',
        title: 'Projeto Teste',
        summary: 'Sobre o projeto',
        role: 'Meu papel',
        challenge: 'O desafio',
        result: 'O resultado',
        skills: ['Banco B'],
        repo: 'https://example.com/repo',
      },
    ],
    education: [
      {
        id: 'curso',
        kind: 'certification',
        title: 'Certificado Teste',
        institution: 'Escola Teste',
        end: '2023-08',
        credentialUrl: 'https://example.com/c',
      },
    ],
    contacts: [
      { id: 'mail', kind: 'email', url: 'mailto:teste@example.com', display: 'teste@example.com' },
    ],
  };
  return { 'pt-BR': base, en: { ...base, role: 'Test role' }, es: base };
});

vi.mock('@portfolio/content/recruiter', async (original) => ({
  ...(await original<typeof import('@portfolio/content/recruiter')>()),
  recruiter: content,
}));

await import('./main.ts');

afterEach(() => {
  document.body.replaceChildren();
  delete content['pt-BR'].cv;
  delete content['pt-BR'].photo;
});

function mount(locale = 'pt-BR'): Promise<ShadowRoot> {
  return new Promise((resolve) => {
    const element = document.createElement('mfe-recrutador');
    const cancel = onMfeReady(() => {
      cancel();
      if (!element.shadowRoot) throw new Error('sem shadow root');
      resolve(element.shadowRoot);
    });
    element.setAttribute('locale', locale);
    document.body.append(element);
  });
}

const texts = (root: ParentNode, selector: string) =>
  [...root.querySelectorAll(selector)].map((node) => node.textContent?.trim());
const press = (root: ParentNode, label: string) => {
  const button = [...root.querySelectorAll('button')].find(
    (candidate) => candidate.textContent?.trim() === label,
  );
  if (!button) throw new Error(`sem botão ${label}`);
  button.click();
  return button;
};
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('página do recrutador', () => {
  it('mostra a página no lugar da tela "em construção", com os blocos na ordem', async () => {
    const root = await mount();
    expect(root.querySelector('[part="message"]')).toBeNull();
    expect(texts(root, 'h2')).toEqual([
      'Pessoa Teste',
      'Resumo',
      'Stack',
      'Experiência',
      'Projetos em destaque',
      'Formação e certificados',
    ]);
    // Toda seção tem nome, pelo título dela.
    for (const section of root.querySelectorAll('section')) {
      const id = section.getAttribute('aria-labelledby');
      expect(id && root.querySelector(`#${id}`)?.textContent?.trim()).toBeTruthy();
    }
  });

  it('avisa que os dados são de exemplo enquanto o perfil é rascunho', async () => {
    expect((await mount()).querySelector('.example')?.textContent).toContain('Dados de exemplo');
    content['pt-BR'].example = false;
    expect((await mount()).querySelector('.example')).toBeNull();
    content['pt-BR'].example = true;
  });

  it('a ficha rápida traduz as enumerações e só lista o que foi preenchido', async () => {
    const root = await mount();
    expect(texts(root, '.stat dt')).toEqual([
      'Localização',
      'Modelo de trabalho',
      'Disponibilidade',
      'Inglês',
      'Senioridade',
    ]);
    expect(texts(root, '.stat dd')).toEqual([
      'Cidade Teste',
      'Híbrido',
      'Disponível em teste',
      'Avançado',
      'Sênior',
    ]);
    const english = await mount('en');
    expect(english.querySelector('.role')?.textContent).toBe('Test role');
    expect(texts(english, '.stat dd')).toContain('Hybrid');
  });

  it('o botão do currículo e o retrato só existem com arquivo', async () => {
    const without = await mount();
    expect(without.querySelector('.cv')).toBeNull();
    expect(without.querySelector('.portrait')).toBeNull();

    content['pt-BR'].cv = '/cv/teste.pdf';
    content['pt-BR'].photo = { src: '/foto.webp', alt: 'Foto de teste' };
    const withFiles = await mount();
    const cv = withFiles.querySelector<HTMLAnchorElement>('.cv a');
    expect(cv?.getAttribute('href')).toBe('/cv/teste.pdf');
    expect(cv?.hasAttribute('download')).toBe(true);
    expect(withFiles.querySelector('.portrait')?.getAttribute('alt')).toBe('Foto de teste');
  });

  it('o contato fica em uma barra que acompanha a rolagem', async () => {
    const root = await mount();
    const bar = root.querySelector('nav.contact-bar');
    expect(bar?.getAttribute('aria-label')).toBe('Contato');
    expect(getComputedStyle(bar as Element).position).toBe('sticky');
    expect(bar?.querySelector('a')?.getAttribute('href')).toBe('mailto:teste@example.com');
  });

  it('o filtro da stack mostra uma categoria por vez e diz qual está ativa', async () => {
    const root = await mount();
    expect(texts(root, '.skill-name')).toEqual(['Linguagem A', 'Banco B']);
    // Só as categorias que têm tecnologia viram opção.
    expect(texts(root, '.filters[aria-label="Filtrar por categoria"] button')).toEqual([
      'Todas',
      'Front-end',
      'Banco de dados',
    ]);

    const database = press(root, 'Banco de dados');
    await settle();
    expect(texts(root, '.skill-name')).toEqual(['Banco B']);
    expect(database.getAttribute('aria-pressed')).toBe('true');
    expect(texts(root, '.skill-level')).toEqual(['Aprendendo']);

    press(root, 'Todas');
    await settle();
    expect(texts(root, '.skill-name')).toHaveLength(2);
  });

  it('cada projeto alterna entre papel, desafio e resultado', async () => {
    const root = await mount();
    const panel = () => root.querySelector('.facet-text')?.textContent;
    expect(panel()).toBe('Meu papel');
    const challenge = press(root, 'Desafio');
    await settle();
    expect(panel()).toBe('O desafio');
    expect(challenge.getAttribute('aria-pressed')).toBe('true');
    press(root, 'Resultado');
    await settle();
    expect(panel()).toBe('O resultado');
    // A troca é anunciada a leitores de tela.
    expect(root.querySelector('.facet-text')?.getAttribute('aria-live')).toBe('polite');
  });

  it('a experiência mostra o período no idioma, com os destaques recolhidos', async () => {
    const root = await mount();
    expect(root.querySelector('.when')?.textContent).toMatch(/mar\. de 2024 – Atual/);
    const details = root.querySelector('details');
    expect(details?.open).toBe(false);
    expect(details?.querySelector('summary')?.textContent).toBe('Destaques');
    expect(texts(details as Element, 'li')).toEqual(['Destaque um', 'Destaque dois']);
    expect((await mount('en')).querySelector('.when')?.textContent).toMatch(/Mar 2024 – Present/);
  });

  it('o xadrez obedece à pausa do documento, que chega por propriedade customizada', async () => {
    const root = await mount();
    const checker = root.querySelector('.checker') as Element;
    expect(getComputedStyle(checker).animationPlayState).toBe('running');
    document.body.style.setProperty('--area-motion-state', 'paused');
    expect(getComputedStyle(checker).animationPlayState).toBe('paused');
    document.body.style.removeProperty('--area-motion-state');
  });

  it('os controles têm alvo de toque inteiro e foco visível', async () => {
    document.documentElement.style.setProperty('--size-control', '2.75rem');
    const root = await mount();
    for (const control of root.querySelectorAll<HTMLElement>('button, summary, .contact-bar a')) {
      expect(
        control.getBoundingClientRect().height,
        control.textContent ?? '',
      ).toBeGreaterThanOrEqual(44);
    }
    document.documentElement.style.removeProperty('--size-control');
  });
});
