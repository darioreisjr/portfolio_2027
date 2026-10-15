# ADR 0014: Branches, dois ambientes e release automática

- Status: **aceito** pelo autor em 2026-10-12
- Data: 2026-10-12
- Emenda: [ADR 0007](0007-deploy-vercel.md), nos gatilhos do deploy

## Contexto

O repositório tinha uma branch só, a `main`, sem proteção. Todo push nela publicava o site em `develop.darioreis.dev`, e não havia versão nem release. O autor pediu:

- uma branch `production`, a principal, com o site publicado;
- uma branch `development`, de onde saem as branches de trabalho e a única que pode mandar código para a `production`;
- release automática quando o código sobe para a produção.

O que não se reabre: o deploy só acontece depois de lint, tipos, testes, orçamentos, e2e e Lighthouse (ADR 0007), e publica o `dist/` já montado.

Limites: o plano gratuito da Vercel; dev solo, então ninguém aprova o pull request do autor; o projeto não instala dependência sem justificativa.

## Opções

Para os dois ambientes na Vercel:

| Critério                       | Dois projetos    | Um projeto, prévia com domínio | Ambientes personalizados |
| ------------------------------ | ---------------- | ------------------------------ | ------------------------ |
| Disponível no plano gratuito   | Sim              | Sim                            | Não (Pro e Enterprise)   |
| `develop.darioreis.dev` muda   | Não              | Sim, de produção para prévia   | Sim                      |
| Histórico e volta por ambiente | Próprios         | Misturados                     | Próprios                 |
| Segredo a mais no GitHub       | Um id de projeto | Nenhum                         | Nenhum                   |

Para a release:

| Critério                        | release-please         | semantic-release          | Script próprio         |
| ------------------------------- | ---------------------- | ------------------------- | ---------------------- |
| Commit de volta na produção     | Sim, por PR de release | Opcional                  | Não                    |
| Dependências novas              | Nenhuma (é uma action) | Uma árvore grande, no npm | Nenhuma                |
| Notas em português              | Não                    | Não                       | Sim                    |
| Testável como os outros scripts | Não                    | Não                       | Sim, com `node --test` |

## Decisão

**Duas branches protegidas, um projeto na Vercel por ambiente, e a versão criada por um script do repositório depois do deploy de produção.**

1. **Branches.** `production` é a branch padrão (a antiga `main`, renomeada). `development` nasce dela. Toda tarefa sai da `development` em uma branch `tipo/descricao` (`feat/…`, `fix/…`, `docs/…`) e volta por pull request.
2. **Regras, sem exceção.** As duas branches só aceitam pull request, com as checagens `verify` e `origem` verdes, sem push direto, sem force push e sem apagar. Não há aprovação obrigatória, porque o autor trabalha sozinho, e ninguém fura as regras, nem o dono. As regras ficam copiadas em `.github/rulesets/`.
3. **Só a `development` entra na `production`.** As regras do GitHub não filtram a branch de origem. O workflow `pr-origem.yml` faz isso: falha se a base é `production` e a origem não é a `development` deste repositório.
4. **Merge.** Tarefa para `development`: rebase, que preserva cada commit já validado pelo commitlint. `development` para `production`: commit de merge, que mantém os mesmos commits nas duas. Squash fica desligado. As branches não divergem: a `production` é a `development` mais os commits de merge.
5. **Ambientes.** Cada branch publica em um projeto da Vercel, com `--prod`:

   | Branch        | Endereço                        | Projeto na Vercel                                                   | Buscadores |
   | ------------- | ------------------------------- | ------------------------------------------------------------------- | ---------- |
   | `development` | `https://develop.darioreis.dev` | `portfolio-2027-dev`, o que já existia                              | Escondido  |
   | `production`  | `https://2027.darioreis.dev`    | `portfolio-2027-producao`, novo, com `VERCEL_PROJECT_ID_PRODUCTION` | Visível    |

   A prévia de pull request vai para o projeto de desenvolvimento. No GitHub, cada ambiente (`development`, `production`) é restrito à própria branch e guarda o endereço em `SITE_URL`.

6. **Fora dos buscadores.** O `vercel.json` gerado no `assemble` responde `X-Robots-Tag: noindex` em todo endereço que não seja o de produção (`PRODUCTION_HOST` em `scripts/assemble.mjs`). O `dist/` é o mesmo nos dois ambientes; quem decide é o endereço.
7. **Pipeline.** `verify` roda no pull request e de novo no push depois do merge. `deploy` depende dele, publica o `dist/` que ele verificou e roda o teste de fumaça no endereço real (`scripts/smoke.mjs`). `release` depende do `deploy` e só existe na `production`.
8. **Release.** `scripts/release.mjs` lê os commits desde a última tag `vX.Y.Z` e cria a tag e a release no GitHub, com notas em português agrupadas por tipo.

   | Commit                                                      | Versão           |
   | ----------------------------------------------------------- | ---------------- |
   | `feat`                                                      | Sobe a menor     |
   | `fix`, `perf`                                               | Sobe o remendo   |
   | `!` ou `BREAKING CHANGE:`                                   | Sobe a maior     |
   | `docs`, `test`, `chore`, `ci`, `build`, `refactor`, `style` | Não gera release |

   A primeira é a 1.0.0. A versão vive só na tag: nenhum commit volta para a branch.

9. **Volta.** O workflow manual `republicar.yml` publica de novo uma versão anterior, pela tag, no ambiente da branch de onde foi disparado.

## Consequências

- Uma tarefa passa pelo CI quatro vezes até a produção: no pull request e no push, em cada branch. O repositório é público, então o custo é tempo, não dinheiro.
- "Push" passa a ser subir a branch da tarefa e abrir o pull request. Merge e promoção para a produção continuam só a pedido do autor.
- Com o e2e como checagem obrigatória, teste instável trava merge. O CI repete o e2e até duas vezes; teste que só passa na repetição é defeito a consertar.
- Entram também, sem ser checagem obrigatória: CodeQL e revisão de dependências (`seguranca.yml`), Dependabot semanal (`.github/dependabot.yml`), e2e noturno em Firefox e WebKit (`navegadores.yml`) e o comentário do CI no pull request, com a prévia e o peso de JavaScript.
- A versão da Vercel CLI e das actions passa a ser fixa. O Dependabot atualiza as actions; a CLI é atualizada à mão.
- Os commits do Dependabot são em inglês; o commitlint não os cobra.
- Se o domínio de produção mudar, `PRODUCTION_HOST` muda junto. O teste de fumaça falha o deploy se a produção sair com `noindex` ou o desenvolvimento sem ele.
- Quando `canonical`, sitemap e `robots.txt` forem feitos (pendência B7), o endereço de produção deve sair de `scripts/` e ir para `packages/contracts`.

## Emenda de 2026-10-15

Segurança passa a ser portão do merge (issue #46, decisão do autor):

- O CodeQL roda com o conjunto `security-extended`.
- As regras da `development` e da `production` ganham a regra `code_scanning`: o merge exige o resultado do CodeQL e é recusado com alerta de gravidade alta ou crítica. Média e baixa avisam no pull request, sem travar.
- As correções automáticas de segurança do Dependabot ficam desligadas: o GitHub só as abre contra a branch padrão, a `production`, que só aceita pull request da `development`. Os alertas do Dependabot continuam ligados, e a correção segue o fluxo de qualquer tarefa (skill `seguranca`).
- O subagente `security-reviewer` entra no passo de revisão do `AGENTS.md` para mudanças em HTML gerado, scripts inline, `vercel.json`, workflows ou dependências.
- Toda versão publicável passou pelo pipeline: `republicar.yml` só publica tag cujo commit está na `production`. Bloquear a criação de tags não foi possível: em repositório de conta pessoal o GitHub não aceita o GitHub Actions como exceção de regra, e a release automática ficaria impedida. As checagens obrigatórias passam a exigir origem no GitHub Actions (`integration_id`).
- O `VERCEL_TOKEN` sai do ambiente do job de verificação e fica só no passo que publica; nenhum checkout deixa o token do GitHub em `.git/config`.
- A Vercel CLI continua por `pnpm dlx` com versão fixa: no lockfile ela traria 37 vulnerabilidades conhecidas em partes que o deploy não usa, e a revisão de dependências travaria todo pull request.

## Fontes

- [Vercel: ambientes](https://vercel.com/docs/deployments/environments)
- [Vercel: limites por plano](https://vercel.com/docs/limits)
- [Vercel: `vercel.json`, cabeçalhos com `missing`](https://vercel.com/docs/project-configuration/vercel-json)
- [GitHub: rulesets](https://docs.github.com/en/rest/repos/rules)
- [GitHub: renomear uma branch](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository/renaming-a-branch)

Não verificado: se a proteção de deploy da Vercel muda entre os dois projetos; o autor confere no painel.
