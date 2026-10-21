# Plano: CI/CD com dois ambientes, fluxo de branches e release automática

- Status: **concluído** em 2026-10-12 (PRs #1 e #3, release `v1.0.0`)
- Origem: pedido e entrevista com o autor, `architect`
- Decisão de arquitetura: ADR 0014, com emenda ao ADR 0007

**Objetivo:** publicar `development` e `production` em endereços próprios, com entrada só por pull request verde e release automática na produção.

## Decisões do autor

| Tema      | Decisão                                                                                  |
| --------- | ---------------------------------------------------------------------------------------- |
| Branches  | A `main` é renomeada para `production` e vira a padrão; a `development` nasce dela       |
| Endereços | `development` em `develop.darioreis.dev`; `production` em `2027.darioreis.dev`           |
| Entrada   | Só por pull request com CI verde, nas duas; a `production` só recebe a `development`     |
| Versão    | SemVer pelos Conventional Commits, a partir da 1.0.0                                     |
| Extras    | Segurança, Dependabot, comentário do CI no PR, fumaça, republicação e outros navegadores |

## O que foi feito no repositório

| Parte                         | Onde                                                               |
| ----------------------------- | ------------------------------------------------------------------ |
| Verificação, deploy e release | `.github/workflows/ci.yml`                                         |
| Origem do pull request        | `.github/workflows/pr-origem.yml`                                  |
| CodeQL e dependências         | `.github/workflows/seguranca.yml`                                  |
| Firefox e WebKit, toda noite  | `.github/workflows/navegadores.yml`, `E2E_BROWSERS` no Playwright  |
| Republicar uma versão         | `.github/workflows/republicar.yml`                                 |
| Atualizações semanais         | `.github/dependabot.yml`                                           |
| Regras das branches           | `.github/rulesets/`                                                |
| Modelo de pull request        | `.github/pull_request_template.md`                                 |
| Versão e notas                | `scripts/release.mjs`                                              |
| Teste de fumaça               | `scripts/smoke.mjs`                                                |
| Fora dos buscadores           | `PRODUCTION_HOST` e a regra de `noindex` em `scripts/assemble.mjs` |
| Peso de JavaScript no PR      | `BUDGETS_SUMMARY` em `scripts/check-budgets.mjs`                   |
| Testes instáveis              | `e2e/home.spec.ts`, `e2e/transitions.spec.ts`, `retries` no CI     |

Nenhuma dependência nova.

### Os dois testes instáveis

| Teste                                           | Causa                                                                                          | Conserto                                                         |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Carrossel no celular (`home.spec.ts`)           | A posição do personagem era lida uma vez, antes de o encaixe da rolagem assentar               | Espera a posição se repetir e compara com nova tentativa         |
| Ctrl+clique entre áreas (`transitions.spec.ts`) | O clique no botão de volta podia acontecer antes de o microfrontend montar e empurrar o layout | Espera o sinal de pronto do shell (`data-ready`) antes do clique |

As causas vieram da leitura do código; o log do CI não mostrava mais que o tempo esgotado.

## Migração

Legenda: **A** é passo do autor; **G** é chamada ao GitHub feita pelo agente, a pedido do autor.

| #   | Quem | O quê                                                                                                           |
| --- | ---- | --------------------------------------------------------------------------------------------------------------- |
| 1   | A    | Criar um projeto vazio na Vercel, sem conectar Git, framework "Other"                                           |
| 2   | A    | Nesse projeto, adicionar o domínio `2027.darioreis.dev` e criar no DNS o CNAME que o painel mostrar             |
| 3   | A    | Conferir que a proteção de deploy é a mesma do projeto atual, e passar o **Project ID** do projeto novo         |
| 4   | G    | Renomear `main` para `production` e criar a `development` no mesmo commit                                       |
| 5   | G    | Criar os ambientes `development` e `production`, com `SITE_URL`, e o segredo `VERCEL_PROJECT_ID_PRODUCTION`     |
| 6   | G    | Ligar o bloqueio de segredos no push                                                                            |
| 7   | G    | Subir a branch `ci/dois-ambientes` e abrir o pull request contra a `development`: é o ensaio do CI novo         |
| 8   | G    | Com os nomes das checagens confirmados no passo 7, criar as regras de `.github/rulesets/` e a política de merge |
| 9   | G    | Merge do pull request: publica em `develop.darioreis.dev`, agora com `noindex`                                  |
| 10  | G    | Pull request de teste de outra branch contra a `production`: a checagem `origem` precisa falhar                 |
| 11  | G    | Pull request da `development` para a `production`: publica em `2027.darioreis.dev` e cria a 1.0.0               |

- Entre os passos 4 e 9, um push na `production` não roda o CI: o workflow antigo só conhece a `main`. Ninguém faz push nessa janela.
- `develop.darioreis.dev` não sai do ar em nenhum momento. O endereço novo responde 404 até o passo 11.
- Outro clone do repositório, depois do passo 4: `git branch -m main production && git fetch origin && git branch -u origin/production production && git remote set-head origin -a`.

### Execução da migração (2026-10-12)

A migração foi concluída em 2026-10-12 com os PRs #1 e #3 e a publicação da `v1.0.0`:

- **Grafo de dependências:** O workflow de segurança (`seguranca.yml`, revisão de dependências) falhou na primeira tentativa porque o grafo de dependências do GitHub estava desativado no repositório. Foi necessário ativá-lo nas configurações do GitHub para a checagem passar.
- **Armadilha do push direto (incidente no PR #1):** Após abrir o PR #1 (`ci/dois-ambientes` para `development`) e obter as checagens verdes, um agente executou `git push origin HEAD:development` para testar se a regra de proteção recusaria o push direto. Como o commit já pertencia a um pull request aberto e com todos os status checks aprovados, o GitHub aceitou o push e marcou o PR #1 como merged automaticamente, sem que o autor tivesse aprovado ou solicitado o merge. A proteção de branch do GitHub por checks obrigatórios considera o push aceitável quando o commit satisfaz as regras em um PR existente. A documentação e as skills de commit foram atualizadas para proibir expressamente qualquer push direto para branches protegidas, inclusive a título de teste.
- **Promoção para produção (PR #3):** O PR #3 promoveu a `development` para a `production`, realizou o deploy em `https://2027.darioreis.dev`, passou no teste de fumaça e gerou a release automática `v1.0.0`.

### Se algo der errado

| Desfazer            | Como                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Regras das branches | `gh api -X DELETE repos/darioreisjr/portfolio_2027/rulesets/<id>`                             |
| Renomeação          | `gh api -X POST repos/darioreisjr/portfolio_2027/branches/production/rename -f new_name=main` |
| Workflows           | Pull request de `revert`                                                                      |
| Projeto novo        | Apagar na Vercel; o projeto atual não foi alterado                                            |
| Deploy ruim         | Workflow **Republicar versão**, ou o rollback do painel da Vercel                             |

## Riscos que ficam

- Sem ninguém furando as regras, um e2e instável segura até correção urgente. O caminho é reexecutar o job e, em último caso, editar a regra a pedido do autor.
- A execução noturna em Firefox e WebKit (`navegadores.yml`) passou a rodar diariamente desde 2026-10-12 e revelou falhas reais tratadas na pendência B12 (WebKit com `:has()` e download de fontes).
- O Dependabot abre pull requests sem os segredos da Vercel: eles não têm prévia, só a verificação.
- O workflow de republicação (`republicar.yml`) segue disponível para acionamento manual em caso de necessidade de rollback ou republicação sem novo commit.
- A CLI da Vercel tem versão fixa em dois workflows e na skill `deploy-vercel`; atualizar é manual.

## Fora desta etapa

- `canonical`, sitemap e `robots.txt` (pendência B7).
- Apontar `darioreis.dev` para este site.
- Arquivo `CHANGELOG.md`: as notas das releases fazem esse papel.
- Evitar a verificação repetida no push depois do merge.
