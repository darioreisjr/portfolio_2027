# Plano: Assistente Mascote com IA (Gemini API) no Portfólio (Issue #82)

## Contexto e Objetivo

Criar uma experiência conversacional interativa no portfólio de Dario Reis com um assistente virtual temático em formato de mascote (posicionado no canto inferior esquerdo), munido com o conteúdo real do desenvolvedor e powered pelo Google Gemini Flash (via Serverless Function na Vercel), sem banco de dados e sem expor credenciais no cliente.

Decisão de arquitetura: [ADR 0016](file:///e:/Testes/novo-portfolio-2027/docs/architecture/adr/0016-assistente-ia-gemini.md).

---

## Escopo

- [x] Registro da decisão de arquitetura no ADR 0016 (`proposto`).
- Adicionar SDK `@google/genai` no catálogo do monorepo (`pnpm-workspace.yaml`).
- Criar Serverless Function `/api/chat` protegendo `GEMINI_API_KEY`, injetando dados de `packages/content` e aplicando _guardrails_ estritos (apenas assuntos profissionais do autor).
- Criar o Web Component `<ds-chat-assistant>` em Lit em `packages/design-system` com botão flutuante, balão inicial, janela de chat acessível (teclado e leitor de tela) e suporte a temas claro/escuro.
- Integrar o componente na casca do `apps/shell` e no layout de `apps/web-next`.
- Testes unitários, testes E2E do Playwright e conferência dos orçamentos de JavaScript (`pnpm budgets`).

**Fora de escopo:**

- Banco de dados ou armazenamento persistente de mensagens.
- Respostas sobre tópicos externos não relacionados ao trabalho do autor.

---

## Etapas de Execução

### Etapa 1: Aprovação do ADR 0016 pelo autor

- **Ação:** O autor aprova formalmente o [ADR 0016](file:///e:/Testes/novo-portfolio-2027/docs/architecture/adr/0016-assistente-ia-gemini.md), alterando o status para `**aceito** pelo autor em 2026-10-24`.
- **Comando de prova:** `git diff docs/architecture/adr/0016-assistente-ia-gemini.md`

### Etapa 2: Criação da branch de trabalho

- **Ação:** Criar a branch `feat/assistente-ia-gemini` a partir da `development` atualizada.
- **Comando de prova:** `git branch --show-current`

### Etapa 3: Instalação de dependências do Gemini

- **Ação:** Adicionar `@google/genai` ao catálogo do `pnpm-workspace.yaml` e executar `pnpm install`.
- **Comando de prova:** `pnpm list @google/genai`

### Etapa 4: Implementação da Serverless Function `/api/chat`

- **Ação:**
  - Criar `api/chat.ts` estruturado para execução na Vercel.
  - Carregar os dados de `packages/content` (perfil, habilidades, experiências, projetos, formação, contatos).
  - Montar o _System Prompt_ com a persona do mascote guia, regras de tom e bloqueios de escopo (_guardrails_).
  - Chamar o modelo Gemini Flash (`gemini-2.5-flash` ou `gemini-2.0-flash`) com chave de ambiente `process.env.GEMINI_API_KEY`.
  - Tratamento de erro elegante caso a chave não esteja configurada ou ocorra falha de rede.
- **Comando de prova:** Teste unitário da função de chat validando a montagem do prompt e o retorno da resposta.

### Etapa 5: Desenvolvimento do Web Component `<ds-chat-assistant>`

- **Ação:**
  - Criar `packages/design-system/src/ds-chat-assistant.ts`.
  - Botão de abertura com avatar do mascote e tooltip de boas-vindas no canto inferior esquerdo.
  - Janela de conversa com histórico na sessão, rolagem automática, botões de sugestões rápidas de perguntas e formulário de envio.
  - Acessibilidade: navegação por teclado (`Tab`, `Esc` para fechar, foco retido na janela aberta), atributos ARIA (`aria-live="polite"` para novas respostas, labels nos botões) e contraste AA em ambos os temas.
  - Respeito à preferência de movimento reduzido (`prefers-reduced-motion`) e ao botão de pausa global.
- **Comando de prova:** `pnpm --filter @portfolio/design-system test`

### Etapa 6: Integração no Shell e no Next.js

- **Ação:**
  - Adicionar `<ds-chat-assistant>` no template do `apps/shell` e no layout de `apps/web-next`.
  - Garantir que o componente receba o idioma atual da página (`locale`).
- **Comando de prova:** `pnpm build && pnpm assemble`

### Etapa 7: Validação e Testes E2E

- **Ação:**
  - Criar teste Playwright em `e2e/chat-assistant.spec.ts` verificando renderização, abertura pelo teclado, envio de mensagem simulada/mock e fechamento com `Esc`.
  - Rodar suíte completa: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm budgets && pnpm test:e2e`.
- **Comando de prova:** `pnpm test:e2e`

### Etapa 8: Revisão, Commit e Abertura de Pull Request

- **Ação:**
  - Revisão de segurança e conferência do `README.md`.
  - Commit no padrão Conventional Commits: `feat(design-system): adiciona assistente mascote com ia gemini`.
  - Push da branch e abertura do PR contra a `development` citando `Closes #82`.
- **Comando de prova:** `gh pr view`
