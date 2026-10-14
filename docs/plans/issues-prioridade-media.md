# Plano: issues de prioridade média

- Status: **aprovado** pelo autor em 2026-10-14 e implementado
- Origem: pedido do autor, sobre as issues com a label `prioridade: média`

**Objetivo:** resolver as issues de prioridade média que não dependem de conteúdo do autor, e transformar em issues o que a revisão encontrou.

## As dez issues

| Issue                   | O quê                                   | Destino                                                   |
| ----------------------- | --------------------------------------- | --------------------------------------------------------- |
| #5                      | Modelos de issue                        | Resolvida                                                 |
| #7                      | E2e em Firefox e WebKit                 | Resolvida                                                 |
| #8                      | Ensaiar a republicação                  | Resolvida                                                 |
| #20                     | Os três revisores                       | Resolvida: corrigido o pequeno, 11 issues novas (#31–#41) |
| #11                     | Página "Como foi feito"                 | Próxima entrega, com entrevista própria                   |
| #12, #13, #15, #17, #21 | Conteúdo, arquivos e aparelhos do autor | Aguardam o autor                                          |

## Decisões do autor

| Tema         | Decisão                                                                                |
| ------------ | -------------------------------------------------------------------------------------- |
| Escopo       | #5, #7, #8 e #20 agora; #11 em seguida                                                 |
| Revisores    | O que for pequeno é corrigido; o resto vira issue, mostrada antes de abrir             |
| Republicação | Na produção, republicar a versão no ar (v1.1.0); no desenvolvimento, voltar de verdade |
| Instáveis    | Achar a causa e consertar                                                              |

## #8: republicação

Ensaiada nos dois ambientes; o passo a passo e os tempos estão na skill `deploy-vercel`. Uma melhoria saiu do ensaio: versão sem tag existente era recusada pelo checkout com uma mensagem do git; agora o primeiro passo diz que a versão não existe.

## #7: os três testes instáveis

| Teste                               | Causa                                                                                                                                                      | Conserto                                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Pop-up pelo teclado, WebKit         | **Defeito do site.** O diálogo abre sozinho, sem foco anterior para devolver; ao fechar, o WebKit às vezes deixava o foco no botão do diálogo já invisível | `lib/intro.ts` tira o foco de dentro do diálogo ao fechar                                                  |
| Ctrl+clique entre áreas, Chromium   | Abrir a aba é do navegador e depende de a janela estar em primeiro plano, o que testes em paralelo disputam                                                | O teste confere o que é do site: o clique com tecla modificadora não é interceptado, sem cortina nem marca |
| Nota ao chegar pelo teclado, WebKit | Não encontrada: o log mostra só o tempo esgotado, e a execução não guardava traces quando tudo passava                                                     | O workflow passa a guardar relatório e traces sempre, e aceita filtro e repetições no disparo manual       |

O terceiro fica sem causa conhecida. Se voltar, o trace da tentativa que falhou estará no artefato da execução.

## #20: a revisão

O resultado completo está na issue #20. Corrigido nesta rodada:

- **Cache dos microfrontends.** Os scripts têm nome fixo (`mfe.js`, `main.js`) e eram servidos como imutáveis por um ano: quem já tinha visitado ficaria com o código antigo depois de cada deploy. Passaram a revalidar como o HTML.
- **CI.** Roda `site-xray --check`, que o `pnpm test` já rodava e o CI pulava.
- **Fronteiras.** A regra do lint cobre também `lib/` e `scripts/`; a marca da transição da comunidade vem de `entryMarkPrefix`, no contrato.
- **Fumaça.** Confere também os scripts das páginas.
- **Acessibilidade.** Foco não encoberto nas áreas com conteúdo; caixa do pop-up sem leitura dupla; "Ir para a seção" com descrição; idioma dos artigos marcado.
- **Design system.** Primitivo trocado pelo semântico; token novo `--text-line-height-tight`; máscaras e ponto do carrossel por token.
- **Docs.** Nove trechos desatualizados ou contraditórios.

## #5: modelos de issue

Três formulários em `.github/ISSUE_TEMPLATE/` (tarefa, defeito, conteúdo do autor) e `config.yml` sem issue em branco. O modelo de pull request ganhou a linha `Closes #`, e o `AGENTS.md` diz que toda tarefa tem issue. Os modelos só aparecem no GitHub depois da promoção para a `production`, a branch padrão.

## Medido em 2026-10-14

| Rota              | LCP (três execuções) | Acessibilidade |
| ----------------- | -------------------- | -------------- |
| `/`               | 2,56 a 2,57 s        | 100            |
| `/recrutador`     | 1,81 a 1,96 s        | 100            |
| `/tecnico`        | 1,81 a 1,96 s        | 100            |
| `/clientes`       | 2,11 s               | 100            |
| `/comunidade`     | 2,47 a 2,48 s        | 100            |
| `/como-foi-feito` | 2,38 a 2,40 s        | 100            |

JavaScript sem mudança em nenhuma rota.
