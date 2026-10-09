# Portfólio 2027: instruções para agentes

Fonte canônica de instruções para Claude Code, Codex CLI e Gemini CLI. `CLAUDE.md` e `GEMINI.md` apenas importam este arquivo. Não duplique o conteúdo dele em outro lugar.

## Visão

Portfólio pessoal de um desenvolvedor full-stack. Site estático, sem backend, com dados em JSON. Dev solo.

Quatro públicos, uma área por público, cada área em uma tecnologia:

| Área                             | Rota (pt-BR)                          | App                | Tecnologia                |
| -------------------------------- | ------------------------------------- | ------------------ | ------------------------- |
| Home, Comunidade, Como foi feito | `/`, `/comunidade`, `/como-foi-feito` | `apps/web-next`    | Next.js (export estático) |
| Recrutador                       | `/recrutador`                         | `apps/mfe-vue`     | Vue                       |
| Técnica                          | `/tecnico`                            | `apps/mfe-angular` | Angular                   |
| Cliente                          | `/clientes`                           | `apps/mfe-react`   | React                     |
| Casca das três áreas acima       |                                       | `apps/shell`       | JavaScript puro           |

Idiomas: pt-BR (padrão, sem prefixo), en e es (com prefixo e rotas traduzidas).

## Leia antes de qualquer tarefa

| Documento                      | Para quê                                     |
| ------------------------------ | -------------------------------------------- |
| `docs/product/brief.md`        | Públicos, áreas, escopo                      |
| `docs/content/schema.md`       | Modelo dos dados JSON                        |
| `docs/architecture/mfe-map.md` | Área por app, tabela de rotas por idioma     |
| `docs/architecture/adr/`       | Decisões aceitas (0001 a 0009)               |
| `docs/quality/budgets.md`      | Limites de performance, acessibilidade e SEO |
| `docs/open-questions.md`       | O que ainda não foi decidido                 |

Se um documento contradiz o código, pare e avise. Não escolha um dos dois em silêncio.

## Estrutura

```
apps/
  shell/         JavaScript puro: documento, cabeçalho, rodapé, carga do MFE da rota
  mfe-vue/       Área do recrutador
  mfe-angular/   Área técnica
  mfe-react/     Área do cliente
  web-next/      Home, comunidade, como-foi-feito
packages/
  content/        JSON, validação e tipos gerados
  tokens/         Tokens em propriedades CSS customizadas
  design-system/  Web Components em Lit
  contracts/      Eventos tipados e tabela de rotas
  config/         Configurações compartilhadas (TypeScript, lint)
e2e/              Testes Playwright que atravessam os apps
docs/             Produto, arquitetura, qualidade, setup dos agentes
scripts/          Montagem do dist, orçamentos, sincronização dos agentes
```

Cada app e cada pacote tem um `AGENTS.md` próprio com comandos e convenções.

## Comandos

Node e pnpm são fixados no `package.json`; o pnpm baixa o Node certo sozinho. Rode tudo por `pnpm`, nunca com o `node` do sistema. Versões de dependências ficam só no catálogo do `pnpm-workspace.yaml`.

| Comando                          | O que faz                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `pnpm install`                   | Instala dependências                                                                                    |
| `pnpm dev`                       | Sobe tudo composto em `http://localhost:5173` (shell, MFEs em watch, Next.js), com conteúdo em rascunho |
| `pnpm build`                     | Builda apps e pacotes, com cache do Turborepo                                                           |
| `pnpm lint`, `pnpm format:check` | ESLint e Prettier na raiz                                                                               |
| `pnpm typecheck`, `pnpm test`    | Tipos e testes de todos os pacotes                                                                      |
| `pnpm assemble`                  | Junta os builds em `dist/`, o diretório publicado                                                       |
| `pnpm preview`                   | Serve o `dist/` em `http://localhost:4173`                                                              |
| `pnpm test:e2e`                  | Playwright e axe sobre o `dist/`                                                                        |
| `pnpm budgets`                   | Cobra os tetos de JavaScript de `docs/quality/budgets.json`                                             |
| `pnpm lhci`                      | Lighthouse CI sobre o `dist/`                                                                           |
| `pnpm ai:sync`, `pnpm ai:check`  | Gera ou confere as configurações das três ferramentas                                                   |

Um pacote só: `pnpm --filter <nome> <script>`. Antes de `test:e2e`, `budgets` e `lhci`: `pnpm build && pnpm assemble`.

## Regras de fronteira

1. Um MFE nunca importa código de outro MFE nem de outro app.
2. Apps se comunicam só por eventos tipados de `packages/contracts`.
3. Dados só entram por `packages/content`. Nenhum app lê JSON por caminho relativo nem embute conteúdo sobre o autor.
4. Cor, espaçamento, tipografia e raio só por tokens semânticos ou de componente. Nenhum valor literal nos apps.
5. Elementos de interface reutilizáveis vêm de `packages/design-system`. Um app não cria componente visual que já exista lá.
6. O design system e o Lit são carregados uma vez por documento, pelo shell ou pelo layout do Next.js. MFEs não os empacotam.
7. Cada MFE expõe um custom element, carrega só na própria rota e roda sozinho em desenvolvimento.
8. Caminhos de rota vêm da tabela de rotas em `packages/contracts`. Ninguém escreve à mão o caminho de outra área.
9. Entre páginas Next.js e páginas do shell, use `<a>`, nunca o roteador de um framework.
10. Não use Module Federation nem single-spa (ADR 0002).
11. `packages/` não depende de `apps/`. `packages/tokens` e `packages/contracts` não dependem de framework.

## Fluxo de trabalho

Explorar, planejar, aprovação humana, implementar, revisar. Nenhuma ferramenta implementa sem plano aprovado.

1. **Explorar:** o `discovery-analyst` lê `docs/` e o código e aponta lacunas. Sempre antes de qualquer implementação.
2. **Planejar:** o `architect` entrega um plano em etapas pequenas, cada uma com o comando que prova que funcionou. Não edita código.
3. **Aprovação humana:** o autor aprova o plano. Sem aprovação explícita, pare.
4. **Implementar:** o `implementer` executa só o plano aprovado. Mudança de escopo volta ao passo 2.
5. **Revisar:** `integration-reviewer`, `a11y-perf-reviewer` e, se houver interface, `design-system-guardian`.

Pare e pergunte quando: um ADR não cobre a decisão, há item bloqueante em `docs/open-questions.md`, ou a tarefa pede conteúdo sobre o autor que não existe em `packages/content`.

Claude Code é a ferramenta principal. Codex e Gemini são usados para revisão e segunda opinião, com as mesmas instruções.

## Definição de pronto

- Plano aprovado seguido, sem escopo extra.
- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- Regras de fronteira respeitadas.
- Orçamentos de `docs/quality/budgets.md` respeitados; aumento de teto registrado lá com motivo.
- Interface nova: operável por teclado, foco visível, contraste AA nos dois temas, textos nos três idiomas.
- Conteúdo novo: passa na validação de `packages/content`.
- Decisão de arquitetura nova: ADR escrito (skill `write-adr`).
- Docs atualizados quando o comportamento descrito mudou.
- Commit no padrão Conventional Commits, em pt-BR e sem coautor (skill `commits`).

## Nunca

- Inventar conteúdo sobre o autor (experiências, projetos, depoimentos, números). Dado de exemplo leva `status: "draft"` e é claramente fictício.
- Instalar dependência sem justificativa de uma linha no plano.
- Escrever segredo em arquivo versionado. Segredos só por variável de ambiente; nomes em `.env.example`.
- Editar à mão arquivos gerados: `.claude/skills/`, `.claude/agents/`, `.codex/`, `.gemini/`, `.mcp.json` e os `CLAUDE.md` e `GEMINI.md` dentro de `apps/` e `packages/`.
- Pôr coautor ou assinatura de ferramenta de IA em commit (`Co-Authored-By`, "Generated with"). O `commitlint` recusa.
- Fazer push sem o autor pedir.
- Liberar script de instalação (`allowBuilds`) ou exceção de idade de pacote (`minimumReleaseAgeExclude`) sem autorização do autor.

## Setup dos agentes

| O quê      | Fonte (edite aqui)               | Gerado por `scripts/ai-sync.mjs`                           |
| ---------- | -------------------------------- | ---------------------------------------------------------- |
| Instruções | `AGENTS.md` (raiz e por app)     | `CLAUDE.md` e `GEMINI.md` por app                          |
| Skills     | `.agents/skills/<nome>/SKILL.md` | `.claude/skills/`                                          |
| Subagentes | `docs/ai-setup/agents.md`        | `.claude/agents/`, `.codex/agents/`, `.gemini/agents/`     |
| MCP        | `docs/ai-setup/mcp.json`         | `.mcp.json`, `.codex/config.toml`, `.gemini/settings.json` |

Depois de editar uma fonte, rode `node scripts/ai-sync.mjs`. Detalhes de cada ferramenta em `docs/ai-setup/capability-matrix.md`.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
