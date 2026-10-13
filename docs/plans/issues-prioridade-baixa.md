# Plano: issues de prioridade baixa

- Status: **aprovado** pelo autor em 2026-10-13 e implementado
- Origem: pedido do autor, sobre as issues com a label `prioridade: baixa`

**Objetivo:** resolver as issues de prioridade baixa que não dependem de conteúdo do autor, e deixar registrado nas outras o que falta.

## As seis issues

| Issue | O quê                                        | Destino                                                 |
| ----- | -------------------------------------------- | ------------------------------------------------------- |
| #19   | Aviso de nova aba nos links do recrutador    | Resolvida                                               |
| #18   | Nome e cargo na home                         | Resolvida                                               |
| #9    | Primeira rodada do Dependabot                | Resolvida                                               |
| #22   | Nome do projeto de desenvolvimento na Vercel | Resolvida                                               |
| #16   | Dados que faltam no recrutador               | Fora, por decisão do autor; o que falta está na issue   |
| #14   | Artigos e canais reais na comunidade         | Fora, por decisão do autor; as perguntas estão na issue |

## Decisões do autor

| Tema       | Decisão                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| Home       | A linha de nome e cargo entra em negrito, sem arquivo de fonte novo      |
| Dependabot | Merge do PR #25; fechar o #24 e não propor versão maior de `@types/node` |
| Segurança  | Correções automáticas de segurança do Dependabot continuam desligadas    |
| Entrega    | Um pull request, um commit por issue                                     |

## #19: aviso de nova aba

- Todo link que abre outra aba leva o aviso no nome acessível, entre parênteses, depois do texto visível: "Código: API (abre em nova aba)". O texto vem de `recruiter/<locale>.json`, chave `newTab`.
- Uma seta `↗` ao lado avisa quem enxerga.
- O e-mail não leva aviso nem seta: abre o programa de correio.
- **Por que não texto escondido por CSS:** a classe de "só para leitor de tela" usa valores literais, que a regra de fronteira 4 proíbe nos apps, e a página vive em shadow DOM, onde uma classe do design system não chega sem empacotá-lo (regra 6). O nome acessível começa pelo texto visível, como pede o WCAG 2.5.3.

## #18: nome e cargo na home

- `HOME_IDENTITY` passou a `true` em `packages/content/scripts/build.mjs`, e `.home-identity` deixou de pedir o peso normal.
- A linha fica acima da chamada; o nome se destaca pela cor, não pelo peso.

| Medido em 2026-10-13     | Antes         | Depois        | Teto   |
| ------------------------ | ------------- | ------------- | ------ |
| LCP de `/`               | 2,55 a 2,58 s | 2,55 a 2,58 s | 2,7 s  |
| CLS de `/`               | 0             | 0             | 0,1    |
| JavaScript de `/`        | 144,7 kB      | 144,7 kB      | 150 kB |
| Arquivos de fonte de `/` | 1             | 1             |        |

## #9: Dependabot

A primeira rodada confirmou o que estava em dúvida: o Dependabot atualiza o catálogo do `pnpm-workspace.yaml` junto do `pnpm-lock.yaml`, os commits passam no commitlint, e o CI roda sem os segredos da Vercel, pulando a prévia.

| Pull request | O quê                                    | Destino                                                                         |
| ------------ | ---------------------------------------- | ------------------------------------------------------------------------------- |
| #25          | `pnpm/action-setup` de 6.0.10 para 6.1.0 | Entrou na `development`                                                         |
| #24          | `@types/node` de 24 para 26              | Fechado: o projeto roda em Node 24; o Dependabot passa a ignorar a versão maior |

A Vercel CLI segue com versão fixa em `ci.yml`, em `republicar.yml` e na skill `deploy-vercel`. Um arquivo central não serve, porque `republicar.yml` roda o código de tags antigas. `scripts/vercel-cli.test.mjs` falha se os três divergirem.

## #22: projeto na Vercel

`portfolio-2027` virou `portfolio-2027-dev`, pela CLI. O id não mudou, então segredos e domínio seguem valendo. O deploy seguinte da `development` passou.

## Testes

- **Unitários:** aviso em todo link externo, nos três idiomas, e nenhum no e-mail; versão da Vercel CLI igual nos três lugares.
- **e2e:** nome e cargo na home nos três idiomas, em negrito e acima da chamada; os testes de fonte seguem cobrando um arquivo só.
- **Medição:** orçamentos de JavaScript e três execuções do Lighthouse.

## Pendências

- #16 e #14 aguardam o autor.
- A seta dos links é sublinhada junto com o texto; é detalhe visual, não foi tratado.
- O aviso de nova aba vale só para a área do recrutador. As outras áreas não abrem outra aba hoje.
