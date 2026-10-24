import '@portfolio/tokens/tokens.css';
import { afterEach, describe, expect, it, vi } from 'vitest';
import './index.js';
import type { DsChatAssistant } from './ds-chat-assistant.js';

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

    expect(fetchMock).toHaveBeenCalledWith('/api/chat', expect.any(Object));

    // Aguarda o término da promise assíncrona
    await vi.waitFor(() => {
      const messages = el.shadowRoot?.querySelectorAll('.message-bubble');
      expect(messages?.length).toBe(3); // Saudação + Pergunta do usuário + Resposta da IA
      expect(messages?.[2]?.textContent).toBe('O Dario trabalha com React, Next.js e TypeScript!');
    });
  });
});
