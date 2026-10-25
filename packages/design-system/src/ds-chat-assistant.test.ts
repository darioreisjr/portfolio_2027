import '@portfolio/tokens/tokens.css';
import { afterEach, describe, expect, it, vi } from 'vitest';
import './index.js';
import { isSafeUrl, parseInlineTokens, type DsChatAssistant } from './ds-chat-assistant.js';

async function mount(locale: string = 'pt-BR'): Promise<DsChatAssistant> {
  const el = document.createElement('ds-chat-assistant') as DsChatAssistant;
  el.setAttribute('locale', locale);
  document.body.append(el);
  await el.updateComplete;
  return el;
}

afterEach(() => {
  document.body.replaceChildren();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('ds-chat-assistant', () => {
  it('registra o custom element e inicia fechado', async () => {
    const el = await mount();
    expect(customElements.get('ds-chat-assistant')).toBeDefined();

    const trigger = el.shadowRoot?.querySelector<HTMLButtonElement>('.chat-trigger');
    expect(trigger).not.toBeNull();
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');

    const dialog = el.shadowRoot?.querySelector('.chat-window');
    expect(dialog).toBeNull();
  });

  it('abre o chat ao clicar no gatilho e exibe saudação e sugestões', async () => {
    const el = await mount();
    const trigger = el.shadowRoot?.querySelector<HTMLButtonElement>('.chat-trigger');
    trigger?.click();
    await el.updateComplete;

    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    const dialog = el.shadowRoot?.querySelector('.chat-window');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('role')).toBe('dialog');

    // Primeira mensagem do mascote
    const bubble = el.shadowRoot?.querySelector('.message-row.model .message-bubble');
    expect(bubble?.textContent).toContain('Sou o mascote guia do Dario Reis');

    // Chips de sugestão inicial
    const chips = el.shadowRoot?.querySelectorAll('.suggestion-chip');
    expect(chips?.length).toBeGreaterThan(0);
  });

  it('fecha o chat ao clicar no botão fechar ou pressionar Escape', async () => {
    const el = await mount();
    const trigger = el.shadowRoot?.querySelector<HTMLButtonElement>('.chat-trigger');
    trigger?.click();
    await el.updateComplete;

    const closeBtn = el.shadowRoot?.querySelector<HTMLButtonElement>('.close-btn');
    closeBtn?.click();
    await el.updateComplete;

    expect(el.shadowRoot?.querySelector('.chat-window')).toBeNull();

    // Reabre e testa tecla Escape
    trigger?.click();
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('.chat-window')).not.toBeNull();

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('.chat-window')).toBeNull();
  });

  it('adapta os textos para inglês quando locale é "en"', async () => {
    const el = await mount('en');
    const trigger = el.shadowRoot?.querySelector<HTMLButtonElement>('.chat-trigger');
    expect(trigger?.getAttribute('aria-label')).toBe('Open Dario Reis virtual assistant');

    trigger?.click();
    await el.updateComplete;

    const title = el.shadowRoot?.querySelector('.header-title');
    expect(title?.textContent).toBe("Dario's Guide");

    const bubble = el.shadowRoot?.querySelector('.message-row.model .message-bubble');
    expect(bubble?.textContent).toContain("Dario Reis's mascot guide");
  });

  it('envia mensagem e exibe a resposta recebida', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'O Dario trabalha com React, Next.js e TypeScript!' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const el = await mount();
    el.shadowRoot?.querySelector<HTMLButtonElement>('.chat-trigger')?.click();
    await el.updateComplete;

    const input = el.shadowRoot?.querySelector<HTMLInputElement>('.chat-input');
    expect(input).not.toBeNull();
    if (input) {
      input.value = 'Quais tecnologias?';
      input.dispatchEvent(new Event('input'));
    }
    await el.updateComplete;

    const form = el.shadowRoot?.querySelector<HTMLFormElement>('.chat-form');
    expect(form).not.toBeNull();
    form?.dispatchEvent(new Event('submit', { cancelable: true }));
    await el.updateComplete;

    expect(fetchMock).toHaveBeenCalledWith('/api/chat/', expect.any(Object));

    // Aguarda o término da promise assíncrona
    await vi.waitFor(() => {
      const messages = el.shadowRoot?.querySelectorAll('.message-bubble');
      expect(messages?.length).toBe(3); // Saudação + Pergunta do usuário + Resposta da IA
      expect(messages?.[2]?.textContent?.trim()).toBe(
        'O Dario trabalha com React, Next.js e TypeScript!',
      );
    });
  });

  it('renderiza links em markdown como links clicáveis e seguros', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reply:
          'Fale comigo no [LinkedIn](https://www.linkedin.com/in/darioreisjr/) ou [E-mail](mailto:dev.darioreis@gmail.com)!',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const el = await mount();
    el.shadowRoot?.querySelector<HTMLButtonElement>('.chat-trigger')?.click();
    await el.updateComplete;

    const input = el.shadowRoot?.querySelector<HTMLInputElement>('.chat-input');
    if (input) {
      input.value = 'Contato?';
      input.dispatchEvent(new Event('input'));
    }
    await el.updateComplete;

    el.shadowRoot
      ?.querySelector<HTMLFormElement>('.chat-form')
      ?.dispatchEvent(new Event('submit', { cancelable: true }));
    await el.updateComplete;

    await vi.waitFor(() => {
      const links = el.shadowRoot?.querySelectorAll('.message-row.model .chat-link');
      expect(links?.length).toBe(2);
      expect(links?.[0]?.getAttribute('href')).toBe('https://www.linkedin.com/in/darioreisjr/');
      expect(links?.[0]?.getAttribute('target')).toBe('_blank');
      expect(links?.[0]?.getAttribute('rel')).toBe('noopener noreferrer');
      expect(links?.[0]?.textContent).toBe('LinkedIn');
      expect(links?.[1]?.getAttribute('href')).toBe('mailto:dev.darioreis@gmail.com');
      expect(links?.[1]?.textContent).toBe('E-mail');
    });
  });

  it('renderiza tópicos de lista e negrito organizadamente', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reply:
          'Aqui estão os canais:\n- **GitHub:** [Perfil](https://github.com/darioreisjr)\n- **WhatsApp:** [Conversar](https://wa.me/5511961889886)',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const el = await mount();
    el.shadowRoot?.querySelector<HTMLButtonElement>('.chat-trigger')?.click();
    await el.updateComplete;

    const input = el.shadowRoot?.querySelector<HTMLInputElement>('.chat-input');
    if (input) {
      input.value = 'Canais';
      input.dispatchEvent(new Event('input'));
    }
    await el.updateComplete;

    el.shadowRoot
      ?.querySelector<HTMLFormElement>('.chat-form')
      ?.dispatchEvent(new Event('submit', { cancelable: true }));
    await el.updateComplete;

    await vi.waitFor(() => {
      const list = el.shadowRoot?.querySelector('.message-row.model .chat-list');
      expect(list).not.toBeNull();
      const items = list?.querySelectorAll('.chat-list-item');
      expect(items?.length).toBe(2);
      const bolds = list?.querySelectorAll('strong');
      expect(bolds?.length).toBe(2);
      expect(bolds?.[0]?.textContent).toBe('GitHub:');
    });
  });

  it('descarta esquemas inseguros de URL (como javascript:)', () => {
    expect(isSafeUrl('https://example.com')).toBe(true);
    expect(isSafeUrl('http://example.com')).toBe(true);
    expect(isSafeUrl('mailto:test@example.com')).toBe(true);
    expect(isSafeUrl('tel:+5511999999999')).toBe(true);
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:text/html,bad')).toBe(false);

    const tokens = parseInlineTokens('[Clique](javascript:alert(1))');
    expect(tokens[0]?.type).toBe('text');
    if (tokens[0]?.type === 'text') {
      expect(tokens[0].content).toBe('Clique');
    }
  });
});
