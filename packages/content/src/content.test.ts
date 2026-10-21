import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { locales } from '@portfolio/contracts';
import { describe, expect, it } from 'vitest';
import { loadContent } from './load.js';

const dataDir = fileURLToPath(new URL('../data', import.meta.url));

type Json = Record<string, unknown>;

/** Altera um arquivo JSON de uma cópia dos dados. */
function edit(dir: string, file: string, change: (json: Json) => void): string {
  const path = join(dir, file);
  const json = JSON.parse(readFileSync(path, 'utf8')) as Json;
  change(json);
  writeFileSync(path, JSON.stringify(json));
  return dir;
}

function copyData(): string {
  const copy = mkdtempSync(join(tmpdir(), 'content-'));
  cpSync(dataDir, copy, { recursive: true });
  return copy;
}

/** Copia os dados do repositório e aplica uma alteração em um arquivo JSON. */
const dataWith = (file: string, change: (json: Json) => void) => edit(copyData(), file, change);

const allLocales = (value: string) => Object.fromEntries(locales.map((locale) => [locale, value]));

const EXAMPLE = /^exemplo-/;
const isExample = (item: { id: string }) => EXAMPLE.test(item.id);
const lists = [
  'contacts',
  'skills',
  'experiences',
  'education',
  'projects',
  'services',
  'testimonials',
  'articles',
] as const;

/**
 * Os dados do repositório só com o conjunto de exemplo e um perfil em rascunho:
 * é como uma área fica enquanto o conteúdo real dela não chega.
 */
function exampleData(): string {
  const copy = copyData();
  for (const list of lists) {
    const path = join(copy, `${list}.json`);
    const items = JSON.parse(readFileSync(path, 'utf8')) as { id: string }[];
    writeFileSync(path, JSON.stringify(items.filter(isExample)));
  }
  return edit(copy, 'profile.json', (json) => {
    for (const key of Object.keys(json)) delete json[key];
    Object.assign(json, {
      status: 'draft',
      name: 'Pessoa Exemplo',
      role: { 'pt-BR': 'Cargo de exemplo', en: 'Example role', es: 'Cargo de ejemplo' },
      highlightSkills: ['exemplo-typescript', 'exemplo-vue', 'exemplo-node'],
    });
  });
}

const raw = (file: string) =>
  JSON.parse(readFileSync(join(dataDir, `${file}.json`), 'utf8')) as (Json & { id: string })[];

/** Perfil mínimo de teste; não depende do status do perfil real. */
const profileWith = (overrides: Json) =>
  dataWith('profile.json', (json) => {
    for (const key of Object.keys(json)) delete json[key];
    Object.assign(
      json,
      { name: 'Teste', role: allLocales('Cargo'), highlightSkills: [] },
      overrides,
    );
  });

describe('conteúdo do repositório', () => {
  it('é válido e tem textos de interface e da home nos três idiomas', () => {
    const { ui, home } = loadContent(dataDir, { includeDrafts: true });
    for (const locale of locales) {
      expect(ui[locale].construction.title).not.toBe('');
      expect(ui[locale].pauseMotion).not.toBe('');
      expect(home[locale].personas.recruiter.phrase).not.toBe('');
      expect(home[locale].personas.recruiter.description).not.toBe('');
      expect(home[locale].music).not.toBe('');
    }
  });
});

describe('rascunhos', () => {
  it('ficam fora do build de produção e entram em desenvolvimento', () => {
    const draft = profileWith({ status: 'draft' });
    expect(loadContent(draft, { includeDrafts: false }).profile).toBeNull();
    expect(loadContent(draft, { includeDrafts: true }).profile?.name).toBe('Teste');
  });

  it('não escondem item publicado', () => {
    const published = profileWith({ status: 'published' });
    expect(loadContent(published, { includeDrafts: false }).profile?.status).toBe('published');
  });

  it('entrega contatos publicados em produção e inclui rascunhos em desenvolvimento', () => {
    const prod = loadContent(dataDir, { includeDrafts: false });
    const dev = loadContent(dataDir, { includeDrafts: true });
    expect(
      prod.contacts.every((c) => c.status === 'published' && !c.id.startsWith('exemplo-')),
    ).toBe(true);
    expect(prod.contacts.some((c) => c.kind === 'linkedin')).toBe(true);
    expect(prod.contacts.some((c) => c.kind === 'github')).toBe(true);
    expect(dev.contacts.length).toBeGreaterThanOrEqual(prod.contacts.length);
  });
});

describe('validação', () => {
  it('recusa texto de interface com chave faltando', () => {
    const broken = dataWith('ui/es.json', (json) => delete json.siteName);
    expect(() => loadContent(broken, { includeDrafts: true })).toThrow(/ui\/es\.json/);
  });

  it('recusa chave desconhecida', () => {
    const broken = dataWith('ui/en.json', (json) => (json.extra = 'x'));
    expect(() => loadContent(broken, { includeDrafts: true })).toThrow(/ui\/en\.json/);
  });

  it('recusa texto da home com chave faltando ou personagem sem descrição', () => {
    const missing = dataWith('home/es.json', (json) => delete json.enter);
    expect(() => loadContent(missing, { includeDrafts: true })).toThrow(/home\/es\.json/);

    const noDescription = dataWith(
      'home/en.json',
      (json) => delete (json.personas as { tech: Json }).tech.description,
    );
    expect(() => loadContent(noDescription, { includeDrafts: true })).toThrow(/home\/en\.json/);
  });

  it('recusa item publicado sem todos os idiomas', () => {
    const broken = profileWith({ status: 'published', role: { 'pt-BR': 'Cargo' } });
    expect(() => loadContent(broken, { includeDrafts: true })).toThrow(/sem tradução/);
  });

  it('aceita perfil publicado sem tagline e sem summary', () => {
    const minimal = profileWith({ status: 'published' });
    expect(() => loadContent(minimal, { includeDrafts: true })).not.toThrow();
  });
});

describe('área do recrutador', () => {
  /** Altera uma lista dos dados do repositório. */
  const listWith = (file: string, change: (items: Json[]) => void) =>
    dataWith(file, (json) => change(json as unknown as Json[]));
  const firstReal = (items: Json[]) => {
    const item = items.find((candidate) => !isExample(candidate as { id: string }));
    if (!item) throw new Error('sem dado real');
    return item;
  };
  const firstExample = (items: Json[]) => {
    const item = items.find((candidate) => isExample(candidate as { id: string }));
    if (!item) throw new Error('sem dado de exemplo');
    return item;
  };

  it('com os dados do repositório, mostra só os reais, nos três idiomas e sem faixa', () => {
    const highlight = (JSON.parse(readFileSync(join(dataDir, 'profile.json'), 'utf8')) as Json)
      .highlightSkills as string[];
    for (const includeDrafts of [false, true]) {
      const { recruiter, recruiterUi } = loadContent(dataDir, { includeDrafts });
      if (!recruiter) throw new Error('sem conteúdo');
      for (const locale of locales) {
        const content = recruiter[locale];
        expect(content.example).toBe(false);
        expect(content.experiences.length).toBeGreaterThan(0);
        expect(content.projects.every((project) => project.challenge && project.result)).toBe(true);
        // Sem arquivo não há caminho: o botão do currículo e o retrato não aparecem.
        expect(content.cv).toBeUndefined();
        expect(content.photo).toBeUndefined();
        // Nada do conjunto de exemplo, nem de passagem.
        expect(JSON.stringify(content)).not.toMatch(/exemplo-|example\.com|Exemplo/);
        expect(recruiterUi[locale].projects.ongoing).not.toBe('');
      }
      expect(recruiter.en.summary).not.toBe(recruiter['pt-BR'].summary);
      // O que está em curso vem primeiro, e as tecnologias em destaque abrem a lista.
      expect(recruiter['pt-BR'].experiences[0]?.end).toBeNull();
      expect(recruiter['pt-BR'].projects[0]?.end).toBeNull();
      expect(recruiter['pt-BR'].skills.slice(0, highlight.length).map((skill) => skill.id)).toEqual(
        highlight,
      );
    }
  });

  it('projeto com mais de um repositório entrega todos, com o rótulo no idioma', () => {
    const { recruiter } = loadContent(dataDir, { includeDrafts: false });
    const several = recruiter?.en.projects.filter((project) => project.repos);
    expect(several?.length).toBeGreaterThan(0);
    for (const project of several ?? []) {
      expect(project.repos?.length).toBeGreaterThanOrEqual(2);
      expect(project.repos?.every(({ label, url }) => label && url.startsWith('https://'))).toBe(
        true,
      );
      // O principal continua no campo de sempre, para quem só mostra um.
      expect(project.repos?.map(({ url }) => url)).toContain(project.repo);
    }
    const single = listWith('projects.json', (items) => {
      const links = firstReal(items).links as { repos?: unknown[] };
      links.repos = links.repos?.slice(0, 1) ?? [{}];
    });
    expect(() => loadContent(single, { includeDrafts: true })).toThrow(/projects\.json/);
  });

  it('sem a exceção, não tem conteúdo em produção enquanto o perfil for rascunho', () => {
    const content = loadContent(exampleData(), { includeDrafts: false });
    expect(content.recruiter).toBeNull();
    for (const locale of locales) expect(content.recruiterUi[locale].example.title).not.toBe('');
  });

  it('com a exceção, vai ao ar só como exemplo, sem levar o perfil para o resto do site', () => {
    const content = loadContent(exampleData(), {
      includeDrafts: false,
      publishExample: { recruiter: true },
    });
    // A faixa "Dados de exemplo" depende desta marca.
    for (const locale of locales) {
      expect(content.recruiter?.[locale].example).toBe(true);
      expect(content.recruiter?.[locale].experiences.length).toBeGreaterThan(0);
    }
    // A home só mostra nome e cargo com perfil publicado: continua sem eles.
    expect(content.profile).toBeNull();
  });

  it('a exceção acaba quando o perfil é publicado: exemplo não entra', () => {
    const dir = edit(exampleData(), 'profile.json', (json) => {
      Object.assign(json, { status: 'published', highlightSkills: [] });
    });
    const { recruiter } = loadContent(dir, {
      includeDrafts: false,
      publishExample: { recruiter: true },
    });
    expect(recruiter?.['pt-BR'].example).toBe(false);
    expect(recruiter?.['pt-BR'].experiences).toEqual([]);
    expect(recruiter?.['pt-BR'].skills).toEqual([]);
  });

  it('se o perfil voltar a rascunho em desenvolvimento, o recrutador usa perfil de exemplo completo', () => {
    const draft = profileWith({ status: 'draft', name: 'Dario Reis' });
    const { recruiter } = loadContent(draft, { includeDrafts: true });
    expect(recruiter?.['pt-BR'].example).toBe(true);
    expect(recruiter?.['pt-BR'].name).toBe('Pessoa Exemplo');
    expect(recruiter?.['pt-BR'].role).toBe('Cargo de exemplo');
    expect(recruiter?.['pt-BR'].experiences.length).toBeGreaterThan(0);
  });

  it('com rascunhos, entrega o conteúdo de exemplo traduzido e marcado como exemplo', () => {
    const { recruiter } = loadContent(exampleData(), { includeDrafts: true });
    if (!recruiter) throw new Error('sem conteúdo');
    for (const locale of locales) {
      const content = recruiter[locale];
      expect(content.example).toBe(true);
      expect(content.experiences.length).toBeGreaterThan(0);
      expect(content.projects.every((project) => project.challenge && project.result)).toBe(true);
    }
    expect(recruiter.en.role).not.toBe(recruiter['pt-BR'].role);
    // O emprego atual vem primeiro, e as skills chegam pelo nome.
    expect(recruiter['pt-BR'].experiences[0]?.end).toBeNull();
    expect(recruiter['pt-BR'].experiences[0]?.skills).toContain('TypeScript');
    // As tecnologias em destaque abrem a lista.
    expect(recruiter['pt-BR'].skills[0]?.name).toBe('TypeScript');
  });

  it('todo dado de exemplo é rascunho e visivelmente fictício; o real não se parece com ele', () => {
    for (const file of lists) {
      for (const item of raw(file)) {
        if (isExample(item)) {
          expect(item.status, `${file} ${item.id}`).toBe('draft');
          if (file === 'contacts') expect(String(item.url)).toContain('example.com');
        } else {
          expect(JSON.stringify(item), `${file} ${item.id}`).not.toMatch(/example\.com|Exemplo/);
        }
      }
    }
  });

  it('recusa dado de exemplo publicado e referência entre o real e o de exemplo', () => {
    const published = listWith('education.json', (items) => {
      Object.assign(firstExample(items), { status: 'published', title: allLocales('Curso') });
    });
    expect(() => loadContent(published, { includeDrafts: true })).toThrow(
      /dado de exemplo publicado/,
    );

    const mixed = listWith('experiences.json', (items) => {
      (firstExample(items) as { skills: string[] }).skills.push('react');
    });
    expect(() => loadContent(mixed, { includeDrafts: true })).toThrow(/mistura dado real/);
  });

  it('recusa referência a skill que não existe e id repetido', () => {
    const missing = listWith('experiences.json', (items) => {
      (items[0] as { skills: string[] }).skills.push('nao-existe');
    });
    expect(() => loadContent(missing, { includeDrafts: true })).toThrow(/skill inexistente/);

    const repeated = listWith('skills.json', (items) => {
      items.push({ ...(items[0] as Json) });
    });
    expect(() => loadContent(repeated, { includeDrafts: true })).toThrow(/id repetido/);
  });

  it('recusa item publicado sem tradução ou que dependa de skill em rascunho', () => {
    const untranslated = listWith('education.json', (items) => {
      Object.assign(firstReal(items), { status: 'published', title: { 'pt-BR': 'Curso' } });
    });
    expect(() => loadContent(untranslated, { includeDrafts: true })).toThrow(/sem tradução/);

    const dangling = listWith('skills.json', (items) => {
      firstReal(items).status = 'draft';
    });
    expect(() => loadContent(dangling, { includeDrafts: true })).toThrow(/skill em rascunho/);
  });

  it('rascunho real fica fora da produção e entra em desenvolvimento', () => {
    const dir = listWith('education.json', (items) => {
      firstReal(items).status = 'draft';
    });
    const count = (includeDrafts: boolean) =>
      loadContent(dir, { includeDrafts }).recruiter?.['pt-BR'].education.length ?? 0;
    expect(count(true)).toBe(count(false) + 1);
  });
});

describe('real e exemplo não se misturam', () => {
  const kinds = (ids: string[]) => new Set(ids.map((id) => EXAMPLE.test(id)));
  const ids = (items: { id: string }[] = []) => items.map((item) => item.id);

  it('em nenhuma área, em desenvolvimento ou em produção, um bloco tem os dois conjuntos', () => {
    const publishExample = { recruiter: true, tech: true, client: true, community: true };
    for (const dir of [dataDir, exampleData()]) {
      for (const includeDrafts of [false, true]) {
        const content = loadContent(dir, { includeDrafts, publishExample });
        const recruiter = content.recruiter?.['pt-BR'];
        const tech = content.tech?.['pt-BR'];
        const client = content.client?.['pt-BR'];
        const community = content.community?.['pt-BR'];
        const blocks: Record<string, string[]> = {
          // A área do recrutador é um bloco só: tudo nela segue o perfil.
          recruiter: [
            ...ids(recruiter?.skills),
            ...ids(recruiter?.experiences),
            ...ids(recruiter?.projects),
            ...ids(recruiter?.education),
            ...ids(recruiter?.contacts),
          ],
          tech: [...ids(tech?.projects), ...ids(tech?.skills)],
          // Os canais seguem os serviços.
          clientServices: [
            ...ids(client?.services),
            ...ids(client?.testimonials),
            ...ids(client?.contacts),
          ],
          clientCases: ids(client?.cases),
          communityArticles: ids(community?.articles),
          communityProjects: ids(community?.projects),
          communityChannels: ids(community?.channels),
        };
        for (const [block, list] of Object.entries(blocks)) {
          expect(kinds(list).size, `${block}, rascunhos ${String(includeDrafts)}`).toBeLessThan(2);
        }
      }
    }
  });
});

describe('área do cliente', () => {
  const listWith = (file: string, change: (items: Json[]) => void) =>
    dataWith(file, (json) => change(json as unknown as Json[]));

  it('sem a exceção, não vai ao ar enquanto os serviços forem rascunho', () => {
    expect(loadContent(dataDir, { includeDrafts: false }).client).toBeNull();
  });

  it('com a exceção, vai ao ar como exemplo, bloco por bloco, e sem valores', () => {
    const { client } = loadContent(dataDir, {
      includeDrafts: false,
      publishExample: { client: true },
    });
    if (!client) throw new Error('sem conteúdo');
    for (const locale of locales) {
      const content = client[locale];
      expect(content.example).toEqual({
        services: true,
        cases: true,
        testimonials: true,
        terms: true,
      });
      expect(content.services.length).toBeGreaterThan(0);
      expect(content.process.length).toBeGreaterThan(0);
      expect(content.cases.every((project) => project.context && project.result)).toBe(true);
      expect(content.engagement.models.map((model) => model.id)).toEqual([
        'fixed',
        'staged',
        'retainer',
      ]);
      // O canal mais direto para quem contrata vem primeiro.
      expect(content.contacts.map((contact) => contact.kind)).toEqual(['whatsapp', 'email']);
      // Contato real não acompanha oferta fictícia.
      expect(content.contacts.every(isExample)).toBe(true);
      expect(JSON.stringify(content)).not.toMatch(/R\$|US\$|€/);
    }
    // Depoimento de exemplo não se passa por elogio de verdade.
    expect(client['pt-BR'].testimonials.every((item) => item.author === 'Cliente Exemplo')).toBe(
      true,
    );
  });

  it('recusa depoimento publicado sem autorização de quem escreveu', () => {
    const unauthorized = listWith('testimonials.json', (items) => {
      Object.assign(items[0] as Json, {
        status: 'published',
        authorRole: allLocales('Cargo'),
        quote: allLocales('Fala'),
        consent: false,
      });
    });
    expect(() => loadContent(unauthorized, { includeDrafts: true })).toThrow(/sem autorização/);
  });

  it('com serviço publicado, os depoimentos de exemplo somem', () => {
    const dir = listWith('services.json', (items) => {
      Object.assign(items[0] as Json, {
        id: 'servico-real',
        status: 'published',
        title: allLocales('Serviço'),
        description: allLocales('Descrição'),
        deliverables: [],
        relatedProjects: [],
      });
    });
    const { client } = loadContent(dir, { includeDrafts: false, publishExample: { client: true } });
    expect(client?.['pt-BR'].example.services).toBe(false);
    expect(client?.['pt-BR'].services).toHaveLength(1);
    // Fictício ao lado de oferta de verdade seria o pior caso.
    expect(client?.['pt-BR'].testimonials).toEqual([]);
  });

  it('recusa referência a projeto que não existe', () => {
    const broken = listWith('services.json', (items) => {
      (items[0] as Json).relatedProjects = ['nao-existe'];
    });
    expect(() => loadContent(broken, { includeDrafts: true })).toThrow(/projeto inexistente/);
  });
});

describe('comunidade', () => {
  const listWith = (file: string, change: (items: Json[]) => void) =>
    dataWith(file, (json) => change(json as unknown as Json[]));

  it('sem a exceção, não vai ao ar enquanto artigos e projetos forem rascunho', () => {
    expect(loadContent(exampleData(), { includeDrafts: false }).community).toBeNull();
  });

  it('com a exceção e só exemplos, vai ao ar como exemplo: artigos, código aberto e canais', () => {
    const { community, site } = loadContent(exampleData(), {
      includeDrafts: false,
      publishExample: { community: true },
    });
    if (!community) throw new Error('sem conteúdo');
    for (const locale of locales) {
      const content = community[locale];
      expect(content.example).toEqual({ articles: true, projects: true, channels: true });
      // Mais recente primeiro.
      const dates = content.articles.map((article) => article.publishedAt);
      expect(dates).toEqual([...dates].sort().reverse());
      expect(content.articles.every((article) => article.readingMinutes > 0)).toBe(true);
      expect(content.projects.map((project) => project.status)).toEqual(['active', 'maintained']);
      expect(content.channels.map((channel) => channel.kind)).toEqual(['linkedin', 'github']);
    }
    expect(site.repository).toBe('https://github.com/darioreisjr/portfolio_2027');
  });

  it('com os dados do repositório, o código aberto é real e os outros blocos são de exemplo', () => {
    const { community } = loadContent(dataDir, {
      includeDrafts: false,
      publishExample: { community: true },
    });
    if (!community) throw new Error('sem conteúdo');
    for (const locale of locales) {
      const content = community[locale];
      expect(content.example).toEqual({ articles: true, projects: false, channels: true });
      expect(content.projects.length).toBeGreaterThan(0);
      expect(content.projects.some(isExample)).toBe(false);
      for (const project of content.projects) {
        expect(project.repo).toMatch(/^https:\/\/github\.com\//);
        // As tecnologias chegam pelo nome, e são as reais.
        expect(project.skills.length).toBeGreaterThan(0);
      }
      expect(content.articles.every(isExample)).toBe(true);
      expect(content.channels.every(isExample)).toBe(true);
    }
    // Sem a exceção, só o bloco real vai ao ar.
    const bare = loadContent(dataDir, { includeDrafts: false }).community?.['pt-BR'];
    expect(bare?.articles).toEqual([]);
    expect(bare?.channels).toEqual([]);
    expect(bare?.projects.length).toBeGreaterThan(0);
  });

  it('recusa projeto de código aberto sem a situação', () => {
    const broken = listWith('projects.json', (items) => {
      delete (items[0] as Json).openSourceStatus;
    });
    expect(() => loadContent(broken, { includeDrafts: true })).toThrow(/sem situação/);
  });

  it('com artigo publicado, os de exemplo saem do bloco', () => {
    const dir = listWith('articles.json', (items) => {
      Object.assign(items[0] as Json, {
        id: 'artigo-real',
        status: 'published',
        title: allLocales('Artigo'),
        summary: allLocales('Resumo'),
      });
    });
    const { community } = loadContent(dir, {
      includeDrafts: false,
      publishExample: { community: true },
    });
    expect(community?.['pt-BR'].example.articles).toBe(false);
    expect(community?.['pt-BR'].articles).toHaveLength(1);
    // Os outros blocos continuam de exemplo, cada um com a própria faixa.
    expect(community?.['pt-BR'].example.channels).toBe(true);
  });
});

describe('submódulos por idioma gerados', () => {
  it('geram dados isolados por idioma para recrutador, tech, client e ui', async () => {
    for (const locale of locales) {
      const rec = (await import(`../dist/data/recruiter/${locale}.js`)) as {
        recruiter: { name: string } | null;
        recruiterUi: { contact?: unknown };
      };
      expect(rec.recruiterUi).toBeDefined();
      expect(rec.recruiterUi.contact).toBeDefined();

      const u = (await import(`../dist/data/ui/${locale}.js`)) as {
        ui: { construction: { title: string } };
      };
      expect(u.ui.construction.title).not.toBe('');

      const t = (await import(`../dist/data/tech/${locale}.js`)) as {
        techUi: { projects: unknown };
      };
      expect(t.techUi.projects).toBeDefined();

      const c = (await import(`../dist/data/client/${locale}.js`)) as {
        clientUi: { services: unknown };
      };
      expect(c.clientUi.services).toBeDefined();
    }
  });
});
