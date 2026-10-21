# Portfólio 2027

Portfólio pessoal de [Dario Reis](https://github.com/darioreisjr), Software Engineer. É um site estático, sem backend, com uma área para cada tipo de visitante, e cada área é feita em uma tecnologia diferente: Next.js, Vue, Angular e React, compostos em um só site.

**No ar:** <https://2027.darioreis.dev> · versões em [Releases](https://github.com/darioreisjr/portfolio_2027/releases)

## O que é

Quem chega escolhe um perfil na tela inicial, como quem escolhe um personagem em um jogo, e entra na área feita para ele. O tema visual é de anime, Japão e jogos; cada área tem cor, identidade e transição de entrada próprias.

| Área           | Para quem                            | Rota              | Tecnologia | Situação                                                            |
| -------------- | ------------------------------------ | ----------------- | ---------- | ------------------------------------------------------------------- |
| Home           | Todos: a escolha de perfil           | `/`               | Next.js    | No ar                                                               |
| Recrutador     | Quem recruta em tecnologia           | `/recrutador`     | Vue        | No ar, com os dados reais do autor                                  |
| Técnica        | Quem quer ver código e arquitetura   | `/tecnico`        | Angular    | No ar: raio-x real do site; estudos de caso de exemplo              |
| Cliente        | Quem quer contratar um projeto       | `/clientes`       | React      | No ar, com dados de exemplo                                         |
| Comunidade     | Quem veio aprender e trocar ideia    | `/comunidade`     | Next.js    | No ar: projetos de código aberto reais; artigos e canais de exemplo |
| Como foi feito | Quem quer entender o site por dentro | `/como-foi-feito` | Next.js    | No ar: arquitetura, 15 ADRs e raio-x real do repositório            |

O site existe em português do Brasil (sem prefixo), inglês (`/en`) e espanhol (`/es`), com as rotas traduzidas: `/recrutador`, `/en/recruiter`, `/es/reclutador`.

Todo bloco que ainda mostra dado fictício leva a faixa **"Dados de exemplo"**. Dado real e dado de exemplo nunca aparecem juntos no mesmo bloco.

## Como o site é montado

São cinco aplicações que viram um único site estático:

```
                    ┌──────────────────────────── dist/ ────────────────────────────┐
 apps/web-next  ──▶ │ /  /comunidade  /como-foi-feito      HTML pronto do Next.js    │
 apps/shell     ──▶ │ /recrutador  /tecnico  /clientes     HTML da casca, por idioma │
 apps/mfe-vue   ──▶ │   └─ <mfe-recrutador>                custom element (Vue)      │
 apps/mfe-angular ▶ │   └─ <mfe-tecnico>                   custom element (Angular)  │
 apps/mfe-react ──▶ │   └─ <mfe-clientes>                  custom element (React)    │
                    └────────────────────────────────────────────────────────────────┘
```

- **Composição no build, sem Module Federation nem single-spa.** Cada microfrontend é um custom element com shadow DOM. A casca (`apps/shell`, JavaScript puro) gera o HTML de cada rota e idioma e carrega só o script da área daquela rota, no idioma da página.
- **Nenhuma rota baixa dois frameworks.** Trocar de área é trocar de documento, com um `<a>` comum.
- **Conteúdo em JSON.** Tudo que o site diz sobre o autor está em `packages/content`, validado com Zod no build. Nenhum app embute conteúdo nem lê JSON por caminho relativo.
- **Design system próprio.** Web Components em Lit, carregados uma vez por documento, e tokens de cor, espaçamento e tipografia em propriedades CSS. Os apps não usam valor literal.
- **Apps só conversam por contrato.** Eventos tipados e a tabela de rotas vivem em `packages/contracts`.

As decisões estão registradas em 15 ADRs, em [`docs/architecture/adr/`](docs/architecture/adr/). A área técnica do site mostra essas decisões e os números medidos de cada rota, lidos do próprio repositório.

## Tecnologias

| Para quê           | O quê                                                |
| ------------------ | ---------------------------------------------------- |
| Monorepo           | pnpm 12 e Turborepo                                  |
| Linguagem          | TypeScript 6                                         |
| Páginas de leitura | Next.js 16 com export estático, React 19             |
| Microfrontends     | Vue 3.5 e React 19 (Vite) e Angular 22 (Angular CLI) |
| Design system      | Lit 3                                                |
| Conteúdo           | JSON validado com Zod                                |
| Animação           | CSS e `motion` (versão mini)                         |
| Testes             | Vitest, Playwright e axe                             |
| Qualidade          | ESLint, Prettier, commitlint, Lighthouse CI          |
| Publicação         | GitHub Actions e Vercel                              |

As versões exatas ficam só no catálogo do [`pnpm-workspace.yaml`](pnpm-workspace.yaml).

## Estrutura

```
apps/
  shell/          Casca em JavaScript puro: documento, cabeçalho, carga do MFE da rota
  mfe-vue/        Área do recrutador
  mfe-angular/    Área técnica
  mfe-react/      Área do cliente
  web-next/       Home, comunidade e como-foi-feito
packages/
  content/        JSON, validação e tipos gerados
  tokens/         Tokens em propriedades CSS customizadas
  design-system/  Web Components em Lit
  contracts/      Eventos tipados e tabela de rotas
  config/         Configurações compartilhadas (TypeScript, lint)
e2e/              Testes Playwright que atravessam os apps
docs/             Produto, arquitetura, qualidade e setup dos agentes
scripts/          Montagem do dist, orçamentos, raio-x do site, sincronização dos agentes
```

## Rodando na sua máquina

Você precisa do [pnpm](https://pnpm.io) 12. O Node certo (24) é baixado pelo próprio pnpm; rode tudo por `pnpm`, não pelo `node` do sistema.

```bash
git clone https://github.com/darioreisjr/portfolio_2027.git
cd portfolio_2027
pnpm install
pnpm dev
```

O site sobe em <http://localhost:5173>, com todas as áreas compostas e recarga ao salvar.

Para ver o site como ele é publicado:

```bash
pnpm build && pnpm assemble
pnpm preview        # http://localhost:4173
```

Nenhuma variável de ambiente é necessária para rodar o site. As de [`.env.example`](.env.example) servem aos agentes de IA e ao deploy.

## Comandos

| Comando                          | O que faz                                          |
| -------------------------------- | -------------------------------------------------- |
| `pnpm dev`                       | Sobe tudo composto em `http://localhost:5173`      |
| `pnpm build`                     | Builda apps e pacotes, com cache do Turborepo      |
| `pnpm assemble`                  | Junta os builds em `dist/`, o diretório publicado  |
| `pnpm preview`                   | Serve o `dist/` em `http://localhost:4173`         |
| `pnpm lint`, `pnpm format:check` | ESLint e Prettier                                  |
| `pnpm typecheck`, `pnpm test`    | Tipos e testes unitários de todos os pacotes       |
| `pnpm test:e2e`                  | Playwright e axe sobre o `dist/`                   |
| `pnpm budgets`                   | Cobra os tetos de JavaScript                       |
| `pnpm lhci`                      | Lighthouse CI sobre o `dist/`                      |
| `pnpm site:xray`                 | Regrava o raio-x do site mostrado na área técnica  |
| `pnpm ai:sync`, `pnpm ai:check`  | Gera ou confere as configurações dos agentes de IA |

Um pacote só: `pnpm --filter <nome> <script>`. Antes de `test:e2e`, `budgets` e `lhci`, rode `pnpm build && pnpm assemble`.

## Qualidade

Cada item abaixo é cobrado no CI. Se um falha, o site não é publicado.

- **Peso de JavaScript por rota:** teto de 90 kB em `/recrutador`, 135 kB em `/clientes`, 140 kB em `/tecnico` e 150 kB nas páginas Next.js (comprimido).
- **Velocidade:** LCP de até 2,5 s (2,7 s na home), medido pelo Lighthouse CI.
- **Acessibilidade:** WCAG AA. Toda página passa pelo axe nos temas claro e escuro, funciona pelo teclado e respeita o pedido de menos movimento.
- **Testes:** unitários por pacote e mais de 290 testes de ponta a ponta atravessando os apps.

Os limites e os números medidos estão em [`docs/quality/budgets.md`](docs/quality/budgets.md).

## Branches, publicação e versões

| Branch        | Para quê                                   | Publica em                      |
| ------------- | ------------------------------------------ | ------------------------------- |
| `production`  | A principal: o que está no ar              | <https://2027.darioreis.dev>    |
| `development` | Onde o trabalho se junta antes de ir ao ar | <https://develop.darioreis.dev> |

- Toda tarefa sai da `development` em uma branch própria e volta por pull request. As duas branches recusam push direto e só aceitam merge com o CI verde.
- A `production` só recebe pull request da `development`.
- O CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) roda formato, lint, tipos, testes, build, orçamentos, testes de ponta a ponta e Lighthouse. No pull request, publica uma prévia e comenta o link e o peso de JavaScript.
- Passando tudo, o merge publica o `dist/` na Vercel e confere o endereço publicado. O ambiente de desenvolvimento fica fora dos buscadores.
- O merge na `production` também cria a versão: tag, release e notas, calculadas pelos commits (`feat` sobe a menor, `fix` o remendo). Uma versão anterior pode ser republicada pelo workflow **Republicar versão**.

Também rodam, sem bloquear o merge: análise de segurança com CodeQL, revisão de dependências, atualizações semanais do Dependabot e os testes de ponta a ponta em Firefox e WebKit, toda noite.

## Conteúdo

O conteúdo fica em [`packages/content/data/`](packages/content/data/), e o modelo de cada arquivo está em [`docs/content/schema.md`](docs/content/schema.md).

- Item `published` precisa de texto nos três idiomas, ou o build falha.
- Dado de exemplo tem id começando por `exemplo-`, é sempre rascunho e é visivelmente fictício.
- O que ainda falta o autor fornecer está em [`docs/content/pendencias-do-autor.md`](docs/content/pendencias-do-autor.md).

## Documentação

| Documento                                                      | Para quê                                      |
| -------------------------------------------------------------- | --------------------------------------------- |
| [`docs/product/brief.md`](docs/product/brief.md)               | Públicos, áreas e escopo                      |
| [`docs/architecture/mfe-map.md`](docs/architecture/mfe-map.md) | Área por app e tabela de rotas por idioma     |
| [`docs/architecture/adr/`](docs/architecture/adr/)             | Decisões de arquitetura                       |
| [`docs/content/schema.md`](docs/content/schema.md)             | Modelo dos dados                              |
| [`docs/quality/budgets.md`](docs/quality/budgets.md)           | Limites de performance, acessibilidade e SEO  |
| [`docs/plans/`](docs/plans/)                                   | O plano de cada entrega, com o que foi medido |
| [`docs/open-questions.md`](docs/open-questions.md)             | O que ainda não foi decidido                  |

## Feito com agentes de IA

O projeto é desenvolvido por uma pessoa com ajuda de agentes de IA (Claude Code como principal; Codex e Gemini para revisão). As regras que eles seguem são as mesmas de qualquer colaborador e ficam em [`AGENTS.md`](AGENTS.md): explorar, planejar, aprovação do autor, implementar, revisar. Nenhum agente implementa sem plano aprovado, inventa conteúdo sobre o autor nem faz push sem pedido.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/pt-br/) em português, com o app ou pacote como escopo: `feat(mfe-vue): período e repositórios nos projetos`. O `commitlint` recusa o que foge disso.

## Créditos e licença

- A música da home é de terceiros; origem e licença em [`docs/assets-de-terceiros.md`](docs/assets-de-terceiros.md).
- O visual usa motivos de anime e jogos, sem arte, nomes ou personagens de nenhuma obra.
- O código está sob a [licença MIT](LICENSE). Ela não cobre o conteúdo sobre o autor, a foto, o currículo nem os personagens: o que fica de fora está em [`NOTICE.md`](NOTICE.md).

## Contato

Dario Reis · [LinkedIn](https://www.linkedin.com/in/darioreisjr/) · [GitHub](https://github.com/darioreisjr) · <dev.darioreis@gmail.com>
