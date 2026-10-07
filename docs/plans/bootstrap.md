# Plano de bootstrap do monorepo

- Status: **aprovado** pelo autor em 2026-10-06 (Node via pnpm; `status` em profile, contacts e skills; validação das três ferramentas como última etapa)
- Data: 2026-10-06
- Origem: `discovery-analyst` (sem bloqueio de ADR) e `architect`. Versões colhidas com `npm view` nesta data; a documentação foi usada para compatibilidade e configuração.

**Objetivo:** criar e instalar o mínimo para os cinco apps subirem e se comporem, sem feature.
**Pronto quando:** os critérios da tarefa passam localmente com os mesmos comandos do workflow de CI. O CI verde no GitHub fica pendente até existir repositório remoto.

## 1. Versões exatas

| Item | Versão | Conferido em | Observação |
|---|---|---|---|
| Node | **24.21.0** (LTS) | [Node releases](https://nodejs.org/en/about/previous-releases), [Angular versions](https://angular.dev/reference/versions) | Angular 22 exige `^22.22.3 \|\| ^24.15.0`; o local 22.21.1 não serve |
| pnpm | **12.9.1** | [catalogs](https://pnpm.io/catalogs), [build settings](https://pnpm.io/settings/build) | `strictDepBuilds` é `true` por padrão: o install falha com script de build não revisado |
| TypeScript | **6.0.3** (linha única) | [Angular versions](https://angular.dev/reference/versions), [typescript-eslint](https://typescript-eslint.io/users/dependency-versions) | Angular (`>=6.0 <6.1`) e typescript-eslint (`<6.1.0`) barram a 7.0.2, que é a `latest` |
| Next.js / React | 16.4.0 / 19.3.0 | [static exports](https://nextjs.org/docs/app/guides/static-exports) | `next lint` foi removido no 16 |
| Vue / vue-tsc | 3.5.43 / 3.3.12 | [Vue web components](https://vuejs.org/guide/extras/web-components) | vue-tsc com TS 6.0.3: não verificado além do peer; provado na etapa 10 |
| Angular (core, cli, build, elements, compiler-cli) | 22.2.1 | [zoneless](https://angular.dev/guide/zoneless), [testing](https://angular.dev/guide/testing) | Zoneless é padrão desde a v21; Vitest com jsdom é o padrão do CLI |
| Vite / plugin-vue / plugin-react | 8.3.3 / 6.0.9 / 6.1.2 | [Vite build](https://vite.dev/guide/build) | Usa Rolldown |
| Lit | 3.3.3 | [Lit testing](https://lit.dev/docs/tools/testing/) | A doc pede teste em navegador real |
| Turborepo | 2.11.7 | [run](https://turborepo.dev/docs/reference/run), [GitHub Actions](https://turborepo.dev/docs/guides/ci-vendors/github-actions) | `--affected` compara com a `main` |
| Vitest / @vitest/browser-playwright | 5.0.3 | [browser mode](https://vitest.dev/guide/browser/) | `@angular/build` aceita `^5.0.0` |
| Playwright / @axe-core/playwright | 1.63.0 / 4.13.0 | [webServer](https://playwright.dev/docs/test-webserver) | |
| Storybook, web-components-vite, addon-a11y | 10.6.1 | [web-components-vite](https://storybook.js.org/docs/get-started/frameworks/web-components-vite) | |
| @lhci/cli | 0.15.1 | [configuração](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md) | |
| ESLint / typescript-eslint / Prettier | 10.12.0 / 8.71.1 / 3.9.9 | [Next ESLint](https://nextjs.org/docs/app/api-reference/config/eslint) | Plugins podem não declarar suporte ao ESLint 10 |
| eslint-plugin-vue, angular-eslint, @next/eslint-plugin-next, eslint-plugin-react-hooks | 10.11.1, 22.5.0, 16.4.0, 7.1.1 | registro npm | Peer com ESLint 10: não verificado |
| Zod | 4.6.5 | [zod](https://zod.dev/json-schema) | |
| commitlint / husky | 21.2.3 / 9.1.7 | [commitlint](https://commitlint.js.org/guides/getting-started.html) | |
| jsdom | 30.1.2 | [Angular testing](https://angular.dev/guide/testing) | Só no MFE Angular |

Ainda a colher com `npm view` antes de instalar: `rxjs`, `tslib`, `@angular/common`, `@angular/compiler`, `@angular/platform-browser`, `@types/react`, `@types/react-dom`, `@types/node`, `playwright`.

## 2. Ordem de criação

Cada etapa é um commit no padrão Conventional Commits.

| # | Etapa | Verificação |
|---|---|---|
| 0 | Ambiente: Node 24.21.0 ativo | `pnpm exec node -v` mostra v24.21.0; `pnpm -v` mostra 12.9.1 |
| 1 | Raiz: `package.json`, `pnpm-workspace.yaml` (workspaces, `catalog:`, `allowBuilds`), `turbo.json`, `.gitignore` | `pnpm install` sem erro nem aviso de peer; `pnpm exec turbo --version` |
| 2 | `packages/config`: tsconfig base, ESLint flat, Prettier | `pnpm lint`; `pnpm exec prettier --check .` |
| 3 | Commits: husky (`commit-msg`) e commitlint | A mensagem `foo` é recusada; `chore: x` passa |
| 4 | `packages/contracts`: tabela de rotas e um evento | `pnpm --filter @portfolio/contracts test typecheck build` |
| 5 | `packages/content`: schemas Zod, `ui/` em 4 idiomas, validação | `pnpm --filter @portfolio/content build test`; um teste prova que JSON inválido falha |
| 6 | `packages/tokens`: CSS em 3 camadas e tipos dos nomes | `pnpm --filter @portfolio/tokens build test` |
| 7 | `packages/design-system`: `<ds-badge>` em Lit usando token | `pnpm --filter @portfolio/design-system build test`; existe um único `dist/ds.js` |
| 8 | Storybook do design system | `pnpm --filter @portfolio/design-system build-storybook` |
| 9 | `apps/shell`: template, carregador, gerador de HTML | `pnpm --filter shell build test`; 12 `index.html` gerados |
| 10 | `apps/mfe-vue`: `<mfe-recrutador>` | `pnpm --filter mfe-vue build test typecheck`; a página isolada abre |
| 11 | `apps/mfe-react`: `<mfe-clientes>` | Idem; um teste confirma propriedade e evento em custom element sem wrapper (pendência do ADR 0003) |
| 12 | `apps/mfe-angular`: `<mfe-tecnico>` | Idem; existe `main.js`; um teste troca `locale` e vê nova renderização |
| 13 | `apps/web-next`: segmento de idioma, 3 páginas, layout | `pnpm --filter web-next build`; existem `out/index.html`, `out/como-foi-feito/index.html`, `out/en/index.html`, `out/404.html` |
| 14 | `scripts/assemble.mjs` | `pnpm build && pnpm assemble`; um teste com colisão forçada falha |
| 15 | Dev composto | `pnpm dev`; `/recrutador/`, `/tecnico/`, `/clientes/` e `/` em `localhost:5173` mostram o olá |
| 16 | `e2e/` com Playwright e axe | `pnpm test:e2e` |
| 17 | `scripts/check-budgets.mjs` e configuração do Lighthouse CI | `pnpm budgets` e `pnpm lhci`; linha de base anotada em `budgets.md` |
| 18 | `.github/workflows/ci.yml` | Rodar localmente a sequência exata do workflow, com `--frozen-lockfile` |
| 19 | Docs: comandos nos `AGENTS.md`, `packages/*/AGENTS.md`, ajustes de texto | `node scripts/ai-sync.mjs && node scripts/ai-sync.mjs --check` |

## 3. Dependências por pacote

Todas as versões via `catalog:`. Pacotes internos via `workspace:*`.

| Pacote | Dependência | Por quê |
|---|---|---|
| raiz | turbo | Orquestra tarefas com cache e `--affected` |
| raiz | typescript | Linha única de TypeScript |
| raiz | eslint, prettier | Lint e formatação rodam uma vez, na raiz |
| raiz | husky, @commitlint/cli, @commitlint/config-conventional | Cobrar Conventional Commits no commit e no CI |
| raiz | @playwright/test, @axe-core/playwright | E2E atravessando os apps, com verificação de acessibilidade |
| raiz | @lhci/cli | Cobrar `budgets.md` |
| config | typescript-eslint | Regras e parser de TypeScript |
| config | eslint-plugin-vue, angular-eslint | Sem eles o ESLint não lê `.vue` nem template Angular |
| config | @next/eslint-plugin-next, eslint-plugin-react-hooks | Regras do Next.js e de hooks |
| contracts | vitest | Teste da tabela de rotas e do evento |
| content | zod (dev) | Um schema dá validação e tipos; não entra em bundle de app |
| content | vitest | Teste da validação |
| tokens | vitest | Teste: todo token semântico tem valor nos dois temas |
| design-system | lit | Runtime dos componentes; única cópia por documento |
| design-system | vite | Build de biblioteca em um bundle ES |
| design-system | vitest, @vitest/browser-playwright, playwright | Teste em Chromium real, como a doc do Lit pede |
| design-system | storybook, @storybook/web-components-vite, @storybook/addon-a11y | Documentação e painel de acessibilidade |
| shell | vite, vitest | Build, servidor de dev com proxy, teste das funções de rota |
| mfe-vue | vue | Runtime |
| mfe-vue | vite, @vitejs/plugin-vue, vue-tsc | Build de SFC e typecheck de `.vue` |
| mfe-vue | vitest, @vitest/browser-playwright | Teste do custom element em navegador |
| mfe-react | react, react-dom | Runtime |
| mfe-react | vite, @vitejs/plugin-react, @types/react, @types/react-dom | Build de JSX e tipos |
| mfe-react | vitest, @vitest/browser-playwright | Teste do custom element em navegador |
| mfe-angular | @angular/core, common, compiler, platform-browser, elements, rxjs, tslib | Runtime mínimo e `createCustomElement` |
| mfe-angular | @angular/cli, @angular/build, @angular/compiler-cli | Builder `application` e testes |
| mfe-angular | vitest, jsdom | Runner e DOM padrão do CLI |
| web-next | next, react, react-dom | Framework |
| web-next | @types/react, @types/react-dom, @types/node, vitest | Tipos e um teste da função de parâmetros de rota |

Não entram: zone.js (zoneless), @lit/react (ADR 0003), ajv e json-schema-to-typescript (Zod cobre), Biome (não cobre template Angular), lefthook, concurrently (Turborepo cobre), size-limit (script próprio), wrangler (deploy fora), happy-dom, eslint-plugin-lit, eslint-config-next.

## 4. Riscos de conflito

| Risco | Como evitar |
|---|---|
| TypeScript 7 é a `latest` e quebra Angular e typescript-eslint | Catálogo fixa 6.0.3; `pnpm why typescript` mostra uma versão só |
| Node local abaixo do mínimo do Angular | Etapa 0 antes de tudo; `engines.node` na raiz |
| `strictDepBuilds` do pnpm 12 derruba o install (esbuild, sharp e outros com script) | Lista explícita em `allowBuilds`, revisada pelo autor no primeiro install |
| `minimumReleaseAge` pode recusar versões recentes | Padrão no pnpm 12 não verificado; se recusar, o autor decide; não desligar em silêncio |
| Três bundlers (Vite 8, o Vite interno do Angular, Turbopack) | Sem `shamefully-hoist`; cada app resolve o seu |
| Modo biblioteca do Vite não substitui `process.env.*` | `define` de `process.env.NODE_ENV` nos MFEs React e Vue; o e2e falha se sobrar referência |
| Fast Refresh do React pede preâmbulo do próprio servidor de dev | No dev composto os MFEs rodam em `build --watch`; recarga a quente só no modo isolado |
| Duas cópias de React (MFE e Next.js) | Mesma entrada de catálogo; nunca carregam no mesmo documento |
| Lit ou design system empacotado em MFE | MFEs dependem do design system só para tipos; regra de lint barra `lit` em `apps/mfe-*`; `check-budgets` falha se achar `lit` em `/_mfe/` |
| Next.js reescreve o `tsconfig.json` no build | Base compartilhada só com opções neutras |
| Plugins de ESLint sem suporte ao ESLint 10 | Conferir peers antes da etapa 2; se faltar, parar e perguntar |
| `createCustomElement` com `createApplication` e zoneless não aparecem juntos na doc | Não verificado; a etapa 12 prova com teste. Se falhar, volta ao planejamento |
| Angular emite chunks além do `main.js` | Aceito: `main.js` é módulo ES e resolve os chunks por caminho relativo |
| `--affected` com clone raso marca tudo como alterado | `fetch-depth: 0` no checkout do CI |
| Cache do Turborepo servindo conteúdo errado | `CONTENT_INCLUDE_DRAFTS` declarado em `env` da tarefa de build |

## 5. Fora desta tarefa

- Qualquer feature de área; cabeçalho e rodapé reais; troca de tema e de idioma; script inline de tema; foco e título na troca de área.
- `hreflang`, `canonical`, sitemap, `robots.txt`, Open Graph, dados `Person`; `_redirects` e `_headers`; hash nos nomes dos bundles dos MFEs e política de cache.
- Deploy, Cloudflare, domínio, preview por PR, cache remoto do Turborepo.
- Conteúdo real; tradução revisada; sub-rotas de MFE.
- Storybook publicado; testes visuais.
- CI verde no GitHub, pendente de repositório remoto.

## Decisões que o plano toma

### Lacunas

1. **Versões e pins:** versões só em `catalog:` no `pnpm-workspace.yaml`. Node e pnpm no `package.json` da raiz (`packageManager`, `engines.node`, `devEngines.runtime`).
2. **Bundlers:** Vite 8 no shell, no MFE React, no MFE Vue e no design system (modo biblioteca, formato ES). Um script do próprio shell, pós-build, gera os 12 HTML a partir da tabela de rotas e dos textos de interface.
3. **Angular:** builder `application`, `outputHashing: none` (entrada estável `main.js`), zoneless, `createApplication` com `createCustomElement`. Testes com Vitest e jsdom.
4. **Dev local:** o servidor de dev do shell, na porta 5173, é a origem única. Ele faz proxy das rotas do Next.js para a 3000 e serve `/_mfe/*` e `/_ds/*` dos `dist` em modo watch. Portas isoladas: Vue 5174, React 5175, Angular 4200, design system 5176, Storybook 6006. No modo isolado, a página de dev de cada MFE carrega design system e tokens; o ponto de entrada do MFE nunca os importa.
5. **Conteúdo:** embutido no bundle, sem busca em runtime. Zod é a fonte do schema; os tipos saem no build do pacote; os apps importam por subcaminho (`/ui`, `/profile`).
6. **Contracts:** tabela como lista tipada `{ area, owner, tag?, paths }` com 6 áreas e 4 idiomas, mais funções de consulta. Um único evento inicial, `portfolio:mfe-pronto`, emitido pelo MFE ao montar.
7. **Config:** ESLint flat e Prettier, rodando na raiz. Base de tsconfig só com opções neutras e estritas. Pacotes consumidos pelo `dist`, via `exports`.
8. **Testes:** Lit e MFEs Vue e React em navegador real (Vitest browser mode, Chromium); Angular em jsdom; shell, contracts, content e tokens em Node. Acessibilidade com axe no e2e. O e2e roda contra o `dist/` montado do build de produção.
9. **Lighthouse CI:** roda sobre `dist/`, 5 URLs em pt-BR, 3 execuções. O JavaScript por parte (shell, design system, cada MFE) é medido por `scripts/check-budgets.mjs` com gzip, e esse script é o portão.
10. **Montagem:** entra agora, em `scripts/assemble.mjs`: copia, falha em colisão, confere `404.html`. Sem `_redirects` nem `_headers`.
11. **Alcance do olá:** tabela e HTML nos quatro idiomas, com `lang`, `<title>` e descrição; e2e em pt-BR mais uma rota em inglês.
12. **CI:** em `pull_request` e em `push` na `main`; `turbo run lint typecheck test build --affected`; cache de `.turbo`; e2e e Lighthouse sempre sobre o `dist` completo. Sem deploy.
13. **Conventional Commits:** husky com commitlint no commit, e um passo no CI validando os commits do PR.
14. **Storybook:** `@storybook/web-components-vite`.
15. **`AGENTS.md` por pacote:** sim, curtos, nos cinco pacotes.
16. **`.gitignore`:** acrescentar saídas de Storybook, Playwright, Lighthouse CI, `*.tsbuildinfo` e `next-env.d.ts`.
17. **Validação das três ferramentas de IA** (`docs/ai-setup/validation.md` e `docs/ai-setup/README.md`): o architect propõe tarefa separada, logo depois do bootstrap. Isso diverge do plano original da Fase 3 e precisa de decisão do autor.

### Contradições

- **A. Dado `draft` contra build de produção:** o campo lido por todos é uma chave de `ui/<locale>.json`, que é texto de interface real e não tem `status`. O build de produção exclui `draft`; o dev inclui, por `CONTENT_INCLUDE_DRAFTS`.
- **B. Arquivos sem `status`:** acrescentar `status` a `profile.json` e aos itens de `contacts` e `skills`; `ui` fica isento. Exige editar `docs/content/schema.md`.
- **C. Shell e conteúdo:** resolvido por A; o shell lê só `ui`.
- **D. Orçamentos no bootstrap:** valem como erro desde já as notas do Lighthouse (Performance 90, Acessibilidade 100, SEO 95), LCP, TBT, CLS e os tetos de JavaScript por parte. Os itens de SEO que não são nota do Lighthouse ficam marcados em `budgets.md` como "a partir da tarefa de SEO".
- **E. Shadow DOM:** shadow DOM na raiz dos três MFEs. Atualizar a linha correspondente do ADR 0002.
- **F. `pnpm dev`:** sobe o shell e, com ele, o watch dos MFEs e do design system e o dev do Next.js.
- **G. Shell:** texto passa a ser "sem framework, escrito em TypeScript estrito, entregue como JavaScript puro".
- **H. ADRs aceitos:** renomear "Decisão recomendada" para "Decisão", sem mudar o conteúdo.
- **I. Ambiente desatualizado nos docs:** atualizar a seção de ambiente de `docs/open-questions.md`.

Outras: escopo npm `@portfolio/*`; prefixo `ds-` nos componentes; diretório `e2e/` na raiz; o layout do Next.js carrega o design system por URL (`/_ds/ds.js`), a mesma cópia em cache do shell.

## Precisa de decisão do autor

1. **Node 24.21.0:** deixar o pnpm baixar e usar essa versão só neste projeto, ou instalar o Node manualmente na máquina.
2. **Mudança de schema (B):** aprovar `status` em `profile`, `contacts` e `skills`.
3. **`allowBuilds`:** aprovar, no primeiro `pnpm install`, a lista de dependências autorizadas a rodar script de instalação.
4. **Teto estourado:** se o olá de algum app passar do teto estimado, o implementer para e pergunta.
5. **Validação das três ferramentas (item 17):** dentro do bootstrap, como no plano original, ou tarefa separada logo depois.
