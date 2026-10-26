import { LitElement, css, html, type TemplateResult } from 'lit';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export type InlineToken =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'italic'; content: string }
  | { type: 'code'; content: string }
  | { type: 'link'; label: string; url: string };

export type ChatBlock =
  { type: 'paragraph'; lines: InlineToken[][] } | { type: 'list'; items: InlineToken[][] };

export function isSafeUrl(url: string): boolean {
  try {
    const trimmed = url.trim();
    if (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
      return true;
    }
    const parsed = new URL(trimmed);
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

const INLINE_REGEX = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/g;

export function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  INLINE_REGEX.lastIndex = 0;

  while ((match = INLINE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined && match[2] !== undefined) {
      const url = match[2].trim();
      if (isSafeUrl(url)) {
        tokens.push({ type: 'link', label: match[1], url });
      } else {
        tokens.push({ type: 'text', content: match[1] });
      }
    } else if (match[3] !== undefined) {
      tokens.push({ type: 'bold', content: match[3] });
    } else if (match[4] !== undefined) {
      tokens.push({ type: 'code', content: match[4] });
    } else if (match[5] !== undefined) {
      tokens.push({ type: 'italic', content: match[5] });
    }
    lastIndex = INLINE_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return tokens;
}

export function parseChatBlocks(markdown: string): ChatBlock[] {
  // Normaliza itens emendados se a IA gerar em uma única linha (ex: "Canais: - **E-mail:** ... - **LinkedIn:** ...")
  const normalized = markdown
    .replace(/([^\n])\s+-\s+\*\*/g, '$1\n- **')
    .replace(/([^\n])\s+-\s+\[/g, '$1\n- [');

  const lines = normalized.split(/\r?\n/);
  const blocks: ChatBlock[] = [];
  let currentList: { type: 'list'; items: InlineToken[][] } | null = null;
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({
        type: 'paragraph',
        lines: currentParagraph.map(parseInlineTokens),
      });
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const listMatch = line.match(/^[-*]\s+(.*)$/);
    if (listMatch && listMatch[1] !== undefined) {
      flushParagraph();
      if (!currentList) {
        currentList = { type: 'list', items: [] };
      }
      currentList.items.push(parseInlineTokens(listMatch[1]));
    } else {
      flushList();
      currentParagraph.push(line);
    }
  }

  flushParagraph();
  flushList();

  return blocks;
}

export function renderInlineToken(token: InlineToken): TemplateResult {
  switch (token.type) {
    case 'bold':
      return html`<strong>${token.content}</strong>`;
    case 'italic':
      return html`<em>${token.content}</em>`;
    case 'code':
      return html`<code class="chat-inline-code">${token.content}</code>`;
    case 'link':
      return html`<a class="chat-link" href="${token.url}" target="_blank" rel="noopener noreferrer"
        >${token.label}</a
      >`;
    case 'text':
    default:
      return html`${token.content}`;
  }
}

export function renderChatMessage(content: string): TemplateResult {
  const blocks = parseChatBlocks(content);
  return html`
    ${blocks.map((block) => {
      if (block.type === 'list') {
        return html`
          <ul class="chat-list">
            ${block.items.map(
              (item) => html`<li class="chat-list-item">${item.map(renderInlineToken)}</li>`,
            )}
          </ul>
        `;
      }
      return html`
        <p class="chat-paragraph">
          ${block.lines.map(
            (line, idx) => html`${idx > 0 ? html`<br />` : ''}${line.map(renderInlineToken)}`,
          )}
        </p>
      `;
    })}
  `;
}

const UI_TEXTS = {
  'pt-BR': {
    triggerLabel: 'Abrir conversa com a Airi, assistente do Dario',
    triggerTooltip: 'Tire dúvidas comigo sobre o Dario!',
    headerTitle: 'Airi',
    headerBadge: 'Assistente IA',
    closeLabel: 'Fechar conversa com a Airi',
    inputPlaceholder: 'Pergunte à Airi sobre tecnologias, projetos...',
    inputLabel: 'Mensagem para a Airi',
    sendLabel: 'Enviar mensagem',
    loading: 'Airi está digitando...',
    initialGreeting:
      'Olá! Sou a Airi, assistente virtual e mascote oficial do Dario Reis. Posso responder qualquer dúvida sobre as tecnologias que ele domina, seus projetos, sua experiência profissional ou como entrar em contato com ele. Como posso te ajudar?',
    errorFallback:
      'Ops! Tive um probleminha para me conectar com a IA agora, mas você pode conferir todos os projetos pelo site ou falar diretamente com o Dario no WhatsApp (+55 11 96188-9886) ou LinkedIn!',
    suggestions: [
      'Quais tecnologias o Dario domina?',
      'Quais são os principais projetos?',
      'Como entrar em contato com o Dario?',
    ],
  },
  en: {
    triggerLabel: "Open chat with Airi, Dario's assistant",
    triggerTooltip: 'Ask me anything about Dario!',
    headerTitle: 'Airi',
    headerBadge: 'AI Assistant',
    closeLabel: 'Close chat with Airi',
    inputPlaceholder: 'Ask Airi about skills, projects or contacts...',
    inputLabel: 'Message for Airi',
    sendLabel: 'Send message',
    loading: 'Airi is typing...',
    initialGreeting:
      "Hello! I am Airi, Dario Reis's virtual assistant and mascot. I can answer any questions about his tech skills, projects, professional background, or how to contact him. How can I help you today?",
    errorFallback:
      'Oops! I had trouble connecting to the AI service, but you can explore all projects on the site or reach out directly to Dario via WhatsApp (+55 11 96188-9886) or LinkedIn!',
    suggestions: [
      'What technologies does Dario use?',
      'What are his main projects?',
      'How do I contact Dario?',
    ],
  },
  es: {
    triggerLabel: 'Abrir chat con Airi, asistente de Dario',
    triggerTooltip: '¡Pregúntame cualquier cosa sobre Dario!',
    headerTitle: 'Airi',
    headerBadge: 'IA Asistente',
    closeLabel: 'Cerrar chat con Airi',
    inputPlaceholder: 'Pregunta a Airi sobre tecnologías, proyectos...',
    inputLabel: 'Mensaje para Airi',
    sendLabel: 'Enviar mensaje',
    loading: 'Airi está escribiendo...',
    initialGreeting:
      '¡Hola! Soy Airi, la mascota y asistente virtual de Dario Reis. Puedo responder tus dudas sobre las tecnologías que domina, sus proyectos, su experiencia profesional o cómo contactarlo. ¿Cómo puedo ayudarte hoy?',
    errorFallback:
      '¡Ups! Tuve un problema para conectar con la IA, pero puedes explorar todos los proyectos en el sitio o contactar directamente a Dario por WhatsApp (+55 11 96188-9886) o LinkedIn.',
    suggestions: [
      '¿Qué tecnologías domina Dario?',
      '¿Cuáles son sus proyectos principales?',
      '¿Cómo contactar a Dario?',
    ],
  },
};

/**
 * Web Component do assistente conversacional temático (Issue #82, ADR 0016).
 * Fica ancorado no canto inferior esquerdo, acessível via teclado e leitor de telas.
 */
export class DsChatAssistant extends LitElement {
  static override properties = {
    locale: { type: String, reflect: true },
    open: { type: Boolean, state: true },
    messages: { state: true },
    isLoading: { state: true },
    isTyping: { state: true },
    showTooltip: { state: true },
    inputValue: { state: true },
  };

  declare locale: string;
  declare open: boolean;
  declare messages: ChatMessage[];
  declare isLoading: boolean;
  declare isTyping: boolean;
  declare showTooltip: boolean;
  declare inputValue: string;

  private typewriterTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.locale = 'pt-BR';
    this.open = false;
    this.messages = [];
    this.isLoading = false;
    this.isTyping = false;
    this.showTooltip = true;
    this.inputValue = '';
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this.handleKeyDown);

    // Carrega histórico da sessão se disponível
    try {
      const saved = sessionStorage.getItem(`portfolio:chat:${this.locale}`);
      if (saved) {
        this.messages = JSON.parse(saved);
      }
    } catch {
      // Ignora erro se storage bloqueado
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.handleKeyDown);
    this.clearTypewriter();
  }

  private clearTypewriter() {
    if (this.typewriterTimer) {
      clearTimeout(this.typewriterTimer);
      this.typewriterTimer = null;
    }
  }

  private get texts() {
    if (this.locale?.startsWith('en')) return UI_TEXTS.en;
    if (this.locale?.startsWith('es')) return UI_TEXTS.es;
    return UI_TEXTS['pt-BR'];
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.open) {
      e.preventDefault();
      this.closeChat();
      return;
    }

    if (e.key === 'Tab' && this.open) {
      this.trapFocus(e);
    }
  };

  private trapFocus(e: KeyboardEvent) {
    const focusable = this.shadowRoot?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  private toggleChat() {
    if (this.open) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  private openChat() {
    this.open = true;
    this.showTooltip = false;

    if (this.messages.length === 0) {
      this.messages = [{ role: 'model', content: this.texts.initialGreeting }];
    }

    this.updateComplete.then(() => {
      const input = this.shadowRoot?.querySelector<HTMLInputElement>('.chat-input');
      input?.focus();
      this.scrollToBottom();
    });
  }

  private closeChat() {
    this.open = false;
    this.updateComplete.then(() => {
      const trigger = this.shadowRoot?.querySelector<HTMLButtonElement>('.chat-trigger');
      trigger?.focus();
    });
  }

  private scrollToBottom() {
    const list = this.shadowRoot?.querySelector('.chat-messages');
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }

  private async typewriterAppend(fullText: string): Promise<void> {
    this.clearTypewriter();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const messageIndex = this.messages.length;
    this.messages = [...this.messages, { role: 'model', content: '' }];
    this.isTyping = true;

    if (prefersReducedMotion || !fullText) {
      const updated = [...this.messages];
      updated[messageIndex] = { role: 'model', content: fullText };
      this.messages = updated;
      this.isTyping = false;
      this.saveSession();
      this.scrollToBottom();
      return;
    }

    const total = fullText.length;
    const chunkSize = Math.max(2, Math.ceil(total / 45));
    const stepDelay = 12;

    return new Promise((resolve) => {
      let currentIdx = 0;

      const step = () => {
        currentIdx = Math.min(total, currentIdx + chunkSize);
        const chunk = fullText.slice(0, currentIdx);

        const updated = [...this.messages];
        if (updated[messageIndex]) {
          updated[messageIndex] = { role: 'model', content: chunk };
          this.messages = updated;
        }

        this.scrollToBottom();

        if (currentIdx < total) {
          this.typewriterTimer = setTimeout(step, stepDelay);
        } else {
          this.typewriterTimer = null;
          this.isTyping = false;
          this.saveSession();
          this.scrollToBottom();
          resolve();
        }
      };

      step();
    });
  }

  private async sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || this.isLoading || this.isTyping) return;

    this.clearTypewriter();
    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const nextMessages = [...this.messages, userMsg];
    this.messages = nextMessages;
    this.inputValue = '';
    this.isLoading = true;

    this.updateComplete.then(() => this.scrollToBottom());

    try {
      const res = await fetch('/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: this.messages.slice(-8),
          locale: this.locale,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const botReply = data.reply || this.texts.errorFallback;

      this.isLoading = false;
      await this.typewriterAppend(botReply);
    } catch {
      this.isLoading = false;
      await this.typewriterAppend(this.texts.errorFallback);
    } finally {
      this.isLoading = false;
      this.isTyping = false;
      this.updateComplete.then(() => this.scrollToBottom());
    }
  }

  private saveSession() {
    try {
      sessionStorage.setItem(`portfolio:chat:${this.locale}`, JSON.stringify(this.messages));
    } catch {
      // Storage indisponível
    }
  }

  private handleFormSubmit(e: Event) {
    e.preventDefault();
    this.sendMessage(this.inputValue);
  }

  private handleInputChange(e: Event) {
    this.inputValue = (e.target as HTMLInputElement).value;
  }

  static override styles = css`
    :host {
      display: block;
      position: fixed;
      inset-inline-start: var(--ds-chat-assistant-offset-inline);
      inset-block-end: var(--ds-chat-assistant-offset-block);
      z-index: 1000;
      font-family: var(--font-body);
      color: var(--color-text);
      --chat-elevation: 0 10px 30px rgba(0, 0, 0, 0.25);
    }

    /* Container flutuante */
    .assistant-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    /* Tooltip de chamada */
    .tooltip-balloon {
      position: absolute;
      inset-block-end: calc(100% + var(--space-block-sm));
      inset-inline-start: 0;
      background: var(--color-surface);
      color: var(--color-text);
      border: var(--border-width-control) solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-block-sm) var(--space-inline-md);
      font-size: var(--text-size-sm);
      line-height: var(--text-line-height);
      box-shadow: var(--chat-elevation);
      white-space: nowrap;
      pointer-events: none;
      animation: float-gentle 3s ease-in-out infinite;
    }

    .tooltip-balloon::after {
      content: '';
      position: absolute;
      inset-block-start: 100%;
      inset-inline-start: var(--space-inline-md);
      border: 6px solid transparent;
      border-block-start-color: var(--color-border);
    }

    @media (max-width: 640px) {
      .tooltip-balloon {
        display: none;
      }
    }

    @keyframes float-gentle {
      0%,
      100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-4px);
      }
    }

    /* Botão flutuante de abertura (Gatilho) */
    .chat-trigger {
      all: unset;
      display: grid;
      place-items: center;
      box-sizing: border-box;
      inline-size: var(--ds-chat-assistant-trigger-size);
      block-size: var(--ds-chat-assistant-trigger-size);
      border-radius: var(--radius-full);
      background: var(--color-surface);
      border: var(--border-width-control) solid var(--color-border);
      box-shadow: var(--chat-elevation);
      cursor: pointer;
      position: relative;
      transition:
        transform 0.2s var(--motion-ease-out),
        border-color 0.2s var(--motion-ease-out);
    }

    .chat-trigger:hover {
      transform: scale(1.05);
      border-color: var(--color-accent);
    }

    .chat-trigger:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: var(--focus-ring-offset);
    }

    .mascot-avatar-svg {
      inline-size: 34px;
      block-size: 34px;
    }

    .badge-indicator {
      position: absolute;
      inset-block-start: -2px;
      inset-inline-end: -2px;
      inline-size: 14px;
      block-size: 14px;
      border-radius: var(--radius-full);
      background: var(--color-accent);
      border: 2px solid var(--color-surface);
    }

    /* Janela de Chat */
    .chat-window {
      position: absolute;
      inset-block-end: calc(100% + var(--space-block-sm));
      inset-inline-start: 0;
      inline-size: min(380px, calc(100vw - 2rem));
      block-size: min(530px, calc(100vh - 7rem));
      background: var(--color-surface);
      border: var(--border-width-control) solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--chat-elevation);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: open-pop 0.25s var(--motion-ease-out);
    }

    @keyframes open-pop {
      from {
        opacity: 0;
        transform: scale(0.92) translateY(12px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    /* Cabeçalho do Chat */
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-block-sm) var(--space-inline-md);
      background: var(--color-surface-muted);
      border-block-end: var(--border-width-control) solid var(--color-border);
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: var(--space-inline-sm);
    }

    .header-title {
      font-size: var(--text-size-sm);
      font-weight: var(--text-weight-strong);
      margin: 0;
    }

    .header-badge {
      font-size: 0.75rem;
      padding: 2px 6px;
      background: var(--color-accent);
      color: var(--color-on-accent);
      border-radius: var(--radius-full);
      font-weight: var(--text-weight-strong);
    }

    .close-btn {
      all: unset;
      display: grid;
      place-items: center;
      inline-size: 28px;
      block-size: 28px;
      border-radius: var(--radius-full);
      cursor: pointer;
      color: var(--color-text-muted);
    }

    .close-btn:hover {
      color: var(--color-text);
      background: var(--color-surface);
    }

    .close-btn:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: var(--focus-ring-offset);
    }

    /* Lista de Mensagens */
    .chat-messages {
      flex: 1;
      padding: var(--space-block-md);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-block-sm);
      scroll-behavior: smooth;
    }

    .message-row {
      display: flex;
      flex-direction: column;
      max-inline-size: 85%;
      word-break: break-word;
    }

    .message-row.user {
      align-self: flex-end;
    }

    .message-row.model {
      align-self: flex-start;
    }

    .message-bubble {
      padding: var(--space-block-sm) var(--space-inline-md);
      border-radius: var(--radius-md);
      font-size: var(--text-size-sm);
      line-height: var(--text-line-height);
    }

    .message-bubble p.chat-paragraph {
      margin: 0 0 var(--space-block-xs) 0;
      line-height: 1.5;
    }

    .message-bubble p.chat-paragraph:last-child {
      margin-block-end: 0;
    }

    .message-bubble ul.chat-list {
      margin: var(--space-block-xs) 0;
      padding-inline-start: 1.25rem;
      list-style-type: disc;
    }

    .message-bubble ul.chat-list:last-child {
      margin-block-end: 0;
    }

    .message-bubble li.chat-list-item {
      margin-block: 2px;
      line-height: 1.5;
    }

    .message-bubble strong {
      font-weight: 700;
    }

    .message-bubble .chat-link {
      color: var(--color-accent);
      text-decoration: underline;
      text-underline-offset: 2px;
      word-break: break-word;
      font-weight: 500;
      transition: opacity 0.15s ease-in-out;
    }

    .message-row.user .chat-link {
      color: inherit;
    }

    .message-bubble .chat-link:hover {
      opacity: 0.8;
      text-decoration-thickness: 2px;
    }

    .message-bubble .chat-link:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: 2px;
      border-radius: var(--radius-sm);
    }

    .message-bubble .chat-inline-code {
      background: rgba(0, 0, 0, 0.08);
      padding: 0.1em 0.35em;
      border-radius: var(--radius-sm);
      font-family: monospace;
      font-size: 0.875em;
    }

    .message-row.user .message-bubble {
      background: var(--color-accent);
      color: var(--color-on-accent);
      border-end-end-radius: 2px;
    }

    .message-row.model .message-bubble {
      background: var(--color-surface-muted);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-start-start-radius: 2px;
    }

    /* Chips de sugestões */
    .suggestions-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-block-xs);
      margin-block-start: var(--space-block-sm);
    }

    .suggestion-chip {
      all: unset;
      display: block;
      padding: var(--space-block-xs) var(--space-inline-sm);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      cursor: pointer;
      color: var(--color-text);
      transition:
        border-color 0.15s,
        background 0.15s;
    }

    .suggestion-chip:hover {
      border-color: var(--color-accent);
      background: var(--color-surface-muted);
    }

    .suggestion-chip:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: 1px;
    }

    /* Indicador de carregamento */
    .typing-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: var(--space-block-xs) var(--space-inline-sm);
    }

    .typing-text {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      font-style: italic;
    }

    .typing-dots {
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }

    .typing-dot {
      inline-size: 5px;
      block-size: 5px;
      border-radius: var(--radius-full);
      background: var(--color-accent);
      animation: pulse-dot 1.2s infinite ease-in-out;
    }

    .typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    .typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes pulse-dot {
      0%,
      80%,
      100% {
        opacity: 0.3;
        transform: scale(0.8);
      }
      40% {
        opacity: 1;
        transform: scale(1.2);
      }
    }

    /* Formulário de envio */
    .chat-footer {
      padding: var(--space-block-sm);
      border-block-start: var(--border-width-control) solid var(--color-border);
      background: var(--color-surface-muted);
    }

    .chat-form {
      display: flex;
      gap: var(--space-inline-xs);
    }

    .chat-input {
      flex: 1;
      padding: var(--space-block-xs) var(--space-inline-sm);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text);
      font-family: inherit;
      font-size: var(--text-size-sm);
    }

    .chat-input:focus {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: var(--focus-ring-offset);
      border-color: transparent;
    }

    .send-btn {
      all: unset;
      display: grid;
      place-items: center;
      inline-size: 34px;
      block-size: 34px;
      border-radius: var(--radius-md);
      background: var(--color-accent);
      color: var(--color-on-accent);
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .send-btn:hover:not(:disabled) {
      opacity: 0.9;
    }

    .send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .send-btn:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus-ring);
      outline-offset: var(--focus-ring-offset);
    }

    /* Acessibilidade para movimento reduzido */
    @media (prefers-reduced-motion: reduce) {
      .chat-window,
      .tooltip-balloon,
      .chat-trigger,
      .typing-dot {
        animation: none !important;
        transition: none !important;
      }
    }

    :host-context(.is-paused) .chat-window,
    :host-context(.is-paused) .tooltip-balloon,
    :host-context(.is-paused) .chat-trigger,
    :host-context(.is-paused) .typing-dot {
      animation: none !important;
      transition: none !important;
    }
  `;

  override render() {
    const t = this.texts;

    return html`
      <div class="assistant-wrapper">
        ${
          !this.open && this.showTooltip
            ? html`<div class="tooltip-balloon" role="status">${t.triggerTooltip}</div>`
            : ''
        }
        ${
          this.open
            ? html`
                <div
                  class="chat-window"
                  role="dialog"
                  aria-modal="true"
                  aria-label="${t.headerTitle}"
                >
                  <div class="chat-header">
                    <div class="header-info">
                      <svg
                        class="mascot-avatar-svg"
                        viewBox="0 0 36 36"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle cx="18" cy="18" r="16" fill="var(--color-accent)" opacity="0.15" />
                        <circle
                          cx="18"
                          cy="18"
                          r="13"
                          fill="var(--color-surface)"
                          stroke="var(--color-accent)"
                          stroke-width="2"
                        />
                        <!-- Olhos brilhantes do mascote -->
                        <ellipse cx="13" cy="17" rx="2" ry="3" fill="var(--color-accent)" />
                        <circle cx="13.5" cy="16" r="0.8" fill="var(--color-surface)" />
                        <ellipse cx="23" cy="17" rx="2" ry="3" fill="var(--color-accent)" />
                        <circle cx="23.5" cy="16" r="0.8" fill="var(--color-surface)" />
                        <!-- Bochechas rosadas -->
                        <circle
                          cx="10"
                          cy="21"
                          r="1.5"
                          fill="var(--color-area-tech)"
                          opacity="0.6"
                        />
                        <circle
                          cx="26"
                          cy="21"
                          r="1.5"
                          fill="var(--color-area-tech)"
                          opacity="0.6"
                        />
                        <!-- Sorriso amigável -->
                        <path
                          d="M15 21 Q18 24 21 21"
                          stroke="var(--color-text)"
                          stroke-width="1.8"
                          stroke-linecap="round"
                          fill="none"
                        />
                        <!-- Anteninha/Faísca de IA -->
                        <path
                          d="M18 5 L18 2"
                          stroke="var(--color-accent)"
                          stroke-width="2"
                          stroke-linecap="round"
                        />
                        <circle cx="18" cy="1.5" r="1.5" fill="var(--color-accent)" />
                      </svg>
                      <h2 class="header-title">${t.headerTitle}</h2>
                      <span class="header-badge">${t.headerBadge}</span>
                    </div>
                    <button
                      class="close-btn"
                      @click="${this.closeChat}"
                      aria-label="${t.closeLabel}"
                      type="button"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>

                  <div class="chat-messages" role="log" aria-live="polite" aria-atomic="false">
                    ${this.messages.map(
                      (msg) => html`
                        <div class="message-row ${msg.role}">
                          <div class="message-bubble">${renderChatMessage(msg.content)}</div>
                        </div>
                      `,
                    )}
                    ${
                      this.messages.length === 1 && !this.isLoading && !this.isTyping
                        ? html`
                            <div class="suggestions-list" aria-label="Sugestões de perguntas">
                              ${t.suggestions.map(
                                (sug) => html`
                                  <button
                                    class="suggestion-chip"
                                    type="button"
                                    @click="${() => this.sendMessage(sug)}"
                                  >
                                    ${sug}
                                  </button>
                                `,
                              )}
                            </div>
                          `
                        : ''
                    }
                    ${
                      this.isLoading
                        ? html`
                            <div class="message-row model">
                              <div
                                class="message-bubble typing-indicator"
                                role="status"
                                aria-label="${t.loading}"
                              >
                                <span class="typing-text">${t.loading}</span>
                                <span class="typing-dots" aria-hidden="true">
                                  <span class="typing-dot"></span>
                                  <span class="typing-dot"></span>
                                  <span class="typing-dot"></span>
                                </span>
                              </div>
                            </div>
                          `
                        : ''
                    }
                  </div>

                  <div class="chat-footer">
                    <form class="chat-form" @submit="${this.handleFormSubmit}">
                      <input
                        class="chat-input"
                        type="text"
                        .value="${this.inputValue}"
                        @input="${this.handleInputChange}"
                        placeholder="${t.inputPlaceholder}"
                        aria-label="${t.inputLabel}"
                        ?disabled="${this.isLoading || this.isTyping}"
                      />
                      <button
                        class="send-btn"
                        type="submit"
                        aria-label="${t.sendLabel}"
                        ?disabled="${this.isLoading || this.isTyping || !this.inputValue.trim()}"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              `
            : ''
        }

        <button
          class="chat-trigger"
          type="button"
          @click="${this.toggleChat}"
          aria-label="${t.triggerLabel}"
          aria-expanded="${this.open}"
        >
          <svg class="mascot-avatar-svg" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <circle cx="18" cy="18" r="16" fill="var(--color-accent)" opacity="0.15" />
            <circle
              cx="18"
              cy="18"
              r="13"
              fill="var(--color-surface)"
              stroke="var(--color-accent)"
              stroke-width="2"
            />
            <!-- Olhos expressivos -->
            <ellipse cx="13" cy="17" rx="2" ry="3" fill="var(--color-accent)" />
            <circle cx="13.5" cy="16" r="0.8" fill="var(--color-surface)" />
            <ellipse cx="23" cy="17" rx="2" ry="3" fill="var(--color-accent)" />
            <circle cx="23.5" cy="16" r="0.8" fill="var(--color-surface)" />
            <!-- Bochechas rosadas -->
            <circle cx="10" cy="21" r="1.5" fill="var(--color-area-tech)" opacity="0.6" />
            <circle cx="26" cy="21" r="1.5" fill="var(--color-area-tech)" opacity="0.6" />
            <!-- Sorriso -->
            <path
              d="M15 21 Q18 24 21 21"
              stroke="var(--color-text)"
              stroke-width="1.8"
              stroke-linecap="round"
              fill="none"
            />
            <!-- Anteninha de IA -->
            <path
              d="M18 5 L18 2"
              stroke="var(--color-accent)"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle cx="18" cy="1.5" r="1.5" fill="var(--color-accent)" />
          </svg>
          <span class="badge-indicator" aria-hidden="true"></span>
        </button>
      </div>
    `;
  }
}
