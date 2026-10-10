// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- só neste teste: a folha, não o runtime do design system
import areasSheet from '@portfolio/design-system/areas.css?inline';
import { clientUi, type ClientContent } from '@portfolio/content/client';
import { onMfeReady, type MfeReadyDetail } from '@portfolio/contracts';
import tokensSheet from '@portfolio/tokens/tokens.css?inline';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App.tsx';
import './main.ts';

const roots: Root[] = [];
afterEach(() => {
  roots.splice(0).forEach((root) => root.unmount());
  document.body.replaceChildren();
  document.head.querySelectorAll('style[data-test]').forEach((style) => style.remove());
});

function mount(locale: string): Promise<{ element: HTMLElement; ready: MfeReadyDetail }> {
  return new Promise((resolve) => {
    const element = document.createElement('mfe-clientes');
    const cancel = onMfeReady((ready) => {
      cancel();
      resolve({ element, ready });
    });
    element.setAttribute('locale', locale);
    document.body.append(element);
  });
}

/** Conteúdo de teste, fictício, com um bloco real e os outros de exemplo. */
const content: ClientContent = {
  example: { services: false, cases: true, testimonials: true, terms: true },
  services: [
    { id: 's', title: 'Serviço teste', description: 'O que é', deliverables: ['Item um'] },
  ],
  process: [
    { id: 'a', title: 'Primeira', description: 'Começo' },
    { id: 'b', title: 'Segunda', description: 'Fim' },
  ],
  cases: [{ id: 'c', title: 'Caso teste', summary: 'Resumo', context: 'Antes', result: 'Depois' }],
  testimonials: [
    { id: 't', author: 'Pessoa Teste', role: 'Cargo', company: 'Empresa', quote: 'Fala' },
  ],
  engagement: {
    pricing: 'Como é orçado',
    models: [{ id: 'fixed', title: 'Fechado', description: 'Tudo combinado', timeline: 'Curto' }],
  },
  faq: [{ id: 'f', question: 'Pergunta?', answer: 'Resposta.' }],
  contacts: [
    { id: 'w', kind: 'whatsapp', url: 'https://example.com/w', display: 'zap' },
    { id: 'e', kind: 'email', url: 'mailto:teste@example.com', display: 'teste@example.com' },
  ],
};

/** Monta o `App` direto, com o conteúdo dado, em um shadow root como o do elemento. */
async function render(page: ClientContent | null): Promise<ShadowRoot> {
  const host = document.createElement('div');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const root = createRoot(shadow);
  roots.push(root);
  root.render(<App locale="pt-BR" content={page} text={clientUi['pt-BR']} />);
  await expect.poll(() => shadow.querySelector('section')).not.toBeNull();
  return shadow;
}

const texts = (scope: ParentNode, selector: string) =>
  [...scope.querySelectorAll(selector)].map((node) => node.textContent?.trim());

describe('mfe-clientes', () => {
  it('mostra a página no idioma recebido e avisa o shell', async () => {
    const { element, ready } = await mount('es');
    expect(element.shadowRoot?.textContent).toContain('¿Tienes un proyecto?');
    expect(ready).toEqual({ area: 'client', locale: 'es' });
  });

  it('desmonta ao sair do documento', async () => {
    const { element } = await mount('pt-BR');
    element.remove();
    await new Promise((resolve) => setTimeout(resolve));
    expect(element.shadowRoot?.textContent).toBe('');
  });
});

describe('página do cliente', () => {
  it('tem as oito janelas, cada uma com nome pelo próprio título', async () => {
    const shadow = await render(content);
    expect(texts(shadow, 'h2')).toEqual([
      'Tem um projeto? Eu tiro do papel.',
      'O que eu faço por você',
      'Como funciona',
      'Projetos e resultados',
      'O que dizem',
      'Investimento e prazos',
      'Perguntas frequentes',
      'Vamos começar?',
    ]);
    for (const section of shadow.querySelectorAll('section')) {
      const id = section.getAttribute('aria-labelledby');
      expect(id && shadow.querySelector(`#${id}`)?.textContent).toBeTruthy();
    }
    // O estilo é da própria página, dentro do shadow root (ADR 0010).
    expect(shadow.querySelector('style')?.textContent).toContain('.window');
  });

  it('a faixa de exemplo aparece só nos blocos cujos dados são rascunho', async () => {
    const shadow = await render(content);
    const flagged = [...shadow.querySelectorAll('.example')].map((banner) =>
      banner.closest('section')?.getAttribute('aria-labelledby'),
    );
    // Serviços são reais neste conteúdo; abertura e chamada são texto de interface.
    expect(flagged).toEqual([
      'process-title',
      'cases-title',
      'testimonials-title',
      'engagement-title',
      'faq-title',
    ]);
  });

  it('o pedido de orçamento aparece em três pontos, com links diretos', async () => {
    const shadow = await render(content);
    const groups = shadow.querySelectorAll('[role="group"][aria-label="Pedir orçamento"]');
    expect(groups).toHaveLength(3);
    for (const group of groups) {
      expect(texts(group, 'a')).toEqual([
        'Pedir orçamento pelo WhatsApp',
        'Pedir orçamento por e-mail',
      ]);
      expect(group.querySelector('a')?.getAttribute('href')).toBe('https://example.com/w');
    }
  });

  it('usa a marcação certa: etapas numeradas, citação e perguntas que abrem', async () => {
    const shadow = await render(content);
    // O número de cada etapa conta até o valor quando a janela aparece.
    await expect.poll(() => texts(shadow, 'ol.steps .level')).toEqual(['Etapa 1', 'Etapa 2']);
    const figure = shadow.querySelector('figure');
    expect(figure?.querySelector('blockquote')?.textContent).toBe('Fala');
    expect(figure?.querySelector('figcaption')?.textContent).toBe('Pessoa Teste · Cargo · Empresa');
    const question = shadow.querySelector('details');
    expect(question?.open).toBe(false);
    expect(question?.querySelector('summary')?.textContent).toBe('Pergunta?');
    expect(texts(shadow, '.case dt')).toEqual(['O cenário', 'O que mudou']);
  });

  it('some com os blocos que não têm dados, sem deixar janela vazia', async () => {
    const shadow = await render({ ...content, cases: [], testimonials: [], faq: [] });
    expect(texts(shadow, 'h2')).toEqual([
      'Tem um projeto? Eu tiro do papel.',
      'O que eu faço por você',
      'Como funciona',
      'Investimento e prazos',
      'Vamos começar?',
    ]);
  });

  it('os contínuos obedecem à pausa do documento, por propriedade customizada', async () => {
    const shadow = await render(content);
    const portal = shadow.querySelector('.portal') as Element;
    expect(getComputedStyle(portal).animationPlayState).toBe('running');
    document.body.style.setProperty('--area-motion-state', 'paused');
    expect(getComputedStyle(portal).animationPlayState).toBe('paused');
    document.body.style.removeProperty('--area-motion-state');
  });
});

// Nenhum MFE mostra mais a tela "em construção" em produção. Este teste guarda o
// contrato do ADR 0009: sem conteúdo, a mensagem sai com as `part`, e a folha
// das páginas internas a estiliza de fora do shadow DOM.
describe('sem conteúdo', () => {
  it('mostra a mensagem "em construção" que a folha das páginas internas estiliza', async () => {
    const sheet = document.createElement('style');
    sheet.dataset.test = '';
    // Os tokens entram junto: a folha mede a animação da barra com eles.
    sheet.textContent = tokensSheet + areasSheet;
    document.head.append(sheet);

    const outlet = document.createElement('div');
    outlet.className = 'area-outlet';
    document.body.append(outlet);
    const host = document.createElement('div');
    outlet.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const root = createRoot(shadow);
    roots.push(root);
    root.render(<App locale="pt-BR" content={null} />);
    await expect.poll(() => shadow.querySelector('[part="message"]')).not.toBeNull();

    expect(shadow.textContent).toContain('Fase em construção');
    expect(texts(shadow, '[part]').length).toBe(5);
    const parts = [...shadow.querySelectorAll('[part]')].map((node) => node.getAttribute('part'));
    expect(parts).toEqual(['message', 'title', 'text', 'bar', 'bar-fill']);
    // A barra anda: a animação é aplicada de fora, por `::part(bar-fill)`.
    const fill = shadow.querySelector('[part="bar-fill"]') as Element;
    expect(getComputedStyle(fill).animationName).toBe('area-bar');
  });
});

// Pendência do ADR 0003: confirmar que o React 19 dispensa o wrapper @lit/react.
describe('React com custom element, sem wrapper', () => {
  class Probe extends HTMLElement {
    data: unknown = undefined;
  }
  customElements.define('x-probe', Probe);

  it('atribui objeto por propriedade e escuta evento customizado', async () => {
    const payload = { answer: 42 };
    const heard: string[] = [];
    const container = document.createElement('div');
    document.body.append(container);

    const root = createRoot(container);
    root.render(
      // @ts-expect-error tag só deste teste, sem tipos de JSX
      <x-probe data={payload} onprobe-fired={(event: Event) => heard.push(event.type)} />,
    );
    await expect.poll(() => container.querySelector('x-probe')).not.toBeNull();

    const probe = container.querySelector<Probe>('x-probe');
    probe?.dispatchEvent(new CustomEvent('probe-fired'));

    expect(probe?.data).toBe(payload);
    expect(heard).toEqual(['probe-fired']);
    root.unmount();
  });
});
