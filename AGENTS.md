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

Idiomas: pt-BR (padrão, sem prefixo), en, es, pt-PT (com prefixo e rotas traduzidas).

## Leia antes de qualquer tarefa

| Documento                      | Para quê                                     |
| ------------------------------ | -------------------------------------------- |
| `docs/product/brief.md`        | Públicos, áreas, escopo                      |
| `docs/content/schema.md`       | Modelo dos dados JSON                        |
| `docs/architecture/mfe-map.md` | Área por app, tabela de rotas por idioma     |
| `docs/architecture/adr/`       | Decisões aceitas (0001 a 0004)               |
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
docs/             Produto, arquitetura, qualidade, setup dos agentes
scripts/          Automação do repositório
```

Cada app tem um `AGENTS.md` próprio com comandos e convenções do framework.

## Comandos

O monorepo ainda não foi criado. Os comandos abaixo passam a valer depois do bootstrap; até lá só o primeiro existe.

| Comando                                    | O que faz                                          |
| ------------------------------------------ | -------------------------------------------------- |
| `node scripts/ai-sync.mjs`                 | Gera as configurações nativas das três ferramentas |
| `node scripts/ai-sync.mjs --check`         | Falha se algo gerado estiver fora de sincronia     |
| `pnpm install`                             | Instala dependências                               |
| `pnpm dev`                                 | Sobe o shell e os apps                             |
| `pnpm build`                               | Builda o que mudou                                 |
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | Verificações                                       |
| `pnpm test:e2e`                            | Playwright atravessando os MFEs                    |

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
- Interface nova: operável por teclado, foco visível, contraste AA nos dois temas, textos nos quatro idiomas.
- Conteúdo novo: passa na validação de `packages/content`.
- Decisão de arquitetura nova: ADR escrito (skill `write-adr`).
- Docs atualizados quando o comportamento descrito mudou.
- Commit no padrão Conventional Commits.

## Nunca

- Inventar conteúdo sobre o autor (experiências, projetos, depoimentos, números). Dado de exemplo leva `status: "draft"` e é claramente fictício.
- Instalar dependência sem justificativa de uma linha no plano.
- Escrever segredo em arquivo versionado. Segredos só por variável de ambiente; nomes em `.env.example`.
- Editar à mão arquivos gerados: `.claude/skills/`, `.claude/agents/`, `.codex/`, `.gemini/`, `.mcp.json` e os `CLAUDE.md` e `GEMINI.md` dentro de `apps/` e `packages/`.

## Setup dos agentes

| O quê      | Fonte (edite aqui)               | Gerado por `scripts/ai-sync.mjs`                           |
| ---------- | -------------------------------- | ---------------------------------------------------------- |
| Instruções | `AGENTS.md` (raiz e por app)     | `CLAUDE.md` e `GEMINI.md` por app                          |
| Skills     | `.agents/skills/<nome>/SKILL.md` | `.claude/skills/`                                          |
| Subagentes | `docs/ai-setup/agents.md`        | `.claude/agents/`, `.codex/agents/`, `.gemini/agents/`     |
| MCP        | `docs/ai-setup/mcp.json`         | `.mcp.json`, `.codex/config.toml`, `.gemini/settings.json` |

Depois de editar uma fonte, rode `node scripts/ai-sync.mjs`. Detalhes de cada ferramenta em `docs/ai-setup/capability-matrix.md`.
