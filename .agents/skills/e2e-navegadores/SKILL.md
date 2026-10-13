---
name: e2e-navegadores
description: Como investigar e corrigir falhas do e2e em Firefox e WebKit (workflow "Outros navegadores") e como escrever testes que valem nos três motores. Use quando a execução noturna falhar, ao receber um link de run do workflow `navegadores.yml`, ao rodar o e2e fora do Chromium ou ao escrever teste que envolva áudio, fontes, foco, `:has()` ou página sem JavaScript.
---

# E2E em Firefox e WebKit

O portão do merge roda o e2e só no Chromium. `.github/workflows/navegadores.yml` roda os mesmos testes em Firefox e WebKit toda noite, sobre a `production`, sem bloquear nada (ADR 0014). Uma falha ali é um destes três casos, e o primeiro passo é dizer qual:

| Caso                | Sinal                                                                    | O que fazer                                       |
| ------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| Defeito do site     | O comportamento difere para quem usa o navegador de verdade              | Corrigir o site; é `fix`, e entra nas notas       |
| Teste preso a motor | A asserção mede um detalhe que só o Chromium tem                         | Corrigir o teste para medir o que importa         |
| Ambiente            | Só falha no executor (sem placa de som) ou só na máquina local (Windows) | Ajustar o workflow, ou anotar e não mexer no site |

## Ler uma execução

```bash
gh run view <id> --log-failed > falhas.log      # o log inteiro das falhas
gh run download <id> -n relatorio-navegadores   # relatório HTML e traces
```

Agrupe pelas mensagens de erro antes de abrir qualquer teste: dezenas de falhas costumam ter três ou quatro causas. Cada teste aparece até três vezes no log (o CI repete duas).

## Reproduzir

```bash
pnpm exec playwright install firefox webkit      # uma vez
pnpm build && pnpm assemble
E2E_BROWSERS=all pnpm exec playwright test --project=firefox --project=webkit e2e/<arquivo>.spec.ts
```

Sem `E2E_BROWSERS=all` os dois projetos não existem. Rode poucos arquivos por vez: com tudo em paralelo a máquina local estoura o tempo de testes que no CI passam.

Para achar a causa, um script à parte que abre a página nos três motores e imprime o estilo computado ou os pedidos de rede resolve mais que reler o teste.

Para provar a correção no ambiente de verdade, dispare o workflow na branch da tarefa, depois do push:

```bash
gh workflow run "Outros navegadores" --ref <branch>
```

## O que já se sabe

Diferenças reais entre motores, encontradas em 2026-10-13:

- **`:has()` com `:is()` dentro.** O WebKit não refaz o estilo dos irmãos com `:has(.x:is(:hover, :focus-visible))`. Escreva em lista: `:has(.x:hover, .x:focus-visible)`.
- **Fonte para texto que não se vê.** Firefox e WebKit baixam o arquivo da fonte para espaço em branco e para texto alternativo de imagem; o Chromium não. Onde a página só pode baixar um peso, declare o peso no `body`, não só no bloco de conteúdo.
- **Áudio que falhou.** Depois de um `play()` em arquivo que não carrega, Firefox e WebKit deixam `paused` em `false`. "Está tocando" se mede pelo tempo andando.
- **Imagem pedida duas vezes.** O WebKit repete o pedido de uma mesma imagem. Compare conjuntos, não listas.

Do ambiente de teste:

- **Sem JavaScript, no Firefox.** O `storageState` da configuração grava no `localStorage` rodando um script; com `javaScriptEnabled: false` o Firefox trava ao criar o contexto. Use `NO_JS` de `e2e/support/no-js.ts`.
- **Sem placa de som, no CI.** O Firefox deixa o `AudioContext` suspenso sem saída de áudio. O workflow sobe um PulseAudio com saída nula antes dos testes.
- **WebKit no Windows.** Não tem `AudioContext`, não passa o áudio pela interceptação de rede do Playwright e o Tab não foca links. Os testes de som e de teclado falham só na máquina local; no CI (Linux) passam. Não corrija o site por causa deles.

## Ao escrever um teste novo

- Meça o que o visitante percebe, não o que o Chromium faz por baixo.
- Posição, estilo e pedidos de rede se conferem com `expect.poll`, nunca com uma leitura só.
- Ouvinte que entra depois da montagem (ponteiro, rolagem): repita o gesto dentro do `poll`.
- Achou diferença nova entre motores: acrescente à lista acima, no mesmo pull request.

## Depois de corrigir

- Defeito do site que não tinha issue: abra uma, com o navegador e o trecho de CSS ou JS.
- Atualize a pendência B12 em `docs/open-questions.md` com o que passou a ser conferido por máquina.
