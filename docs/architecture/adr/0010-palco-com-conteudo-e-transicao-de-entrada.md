# ADR 0010: Palco de uma área com conteúdo e transição de entrada

- Status: **aceito** pelo autor em 2026-10-09
- Data: 2026-10-09

## Contexto

A área do recrutador é a primeira a ganhar página de conteúdo. O ADR 0009 só decidiu a tela "em construção": uma caixa centrada, com a mensagem do microfrontend estilizada de fora por `::part()`. Faltava decidir três coisas.

- Quem desenha o quê quando a área tem conteúdo, e como o documento fica sabendo disso.
- Como a pausa das animações e o movimento reduzido alcançam o que o microfrontend anima dentro do shadow DOM.
- Como fazer uma transição que começa na home (Next.js) e termina na área (shell), dois documentos diferentes ligados por um link comum (regra de fronteira 9).

Limites que apertam a decisão: a home está a menos de 2 kB do teto de JavaScript e em nove arquivos de script; o conteúdo real ainda não existe, e os dados de exemplo são rascunho, fora do build de produção.

O que não se reabre: Web Components como contrato entre apps (ADR 0002), comportamento de uma rota no app da rota (ADR 0008), o documento como dono do palco (ADR 0009).

## Opções

Para o shell saber que a área tem conteúdo:

| Critério                 | Evento novo do MFE | Atributo no elemento do MFE | Marca no HTML, na geração |
| ------------------------ | ------------------ | --------------------------- | ------------------------- |
| JavaScript novo          | No shell e no MFE  | No MFE, mais `:has()`       | Nenhum                    |
| Troca de layout na carga | Sim, depois do MFE | Sim, depois do MFE          | Não                       |
| Fonte da verdade         | O MFE              | O MFE                       | `packages/content`        |

Para a transição entre os dois documentos:

| Critério                  | View Transitions entre documentos | Só a chegada, no shell | Saída na home e chegada no shell |
| ------------------------- | --------------------------------- | ---------------------- | -------------------------------- |
| Mostra "Entrando..."      | Não                               | Não                    | Sim                              |
| Alcance                   | Todas as navegações               | Só a área              | Só o "Entrar" da área            |
| Suporte entre navegadores | Não confirmado no Firefox         | Geral                  | Geral                            |
| Histórico                 | O autor já tinha recusado         |                        |                                  |

## Decisão

**O documento continua dono do palco; o microfrontend desenha o conteúdo com estilo próprio; o que os dois precisam combinar passa por marcas no HTML e por propriedades CSS, sem evento novo.**

1. **Palco.** Com conteúdo, o shell continua desenhando cenário, título, personagem, botão de volta e pausa. O microfrontend desenha o conteúdo, com `<style>` no próprio shadow root. `::part()` fica só para a tela "em construção". O personagem é a imagem do shell; o microfrontend não o repete, e só mostra um retrato quando o perfil tiver foto.
2. **Como o shell sabe.** Na geração do documento: `renderPage` recebe `content` e escreve `data-content` no `main`. O gerador e o servidor de desenvolvimento perguntam a `@portfolio/content/recruiter`. O arranjo de página rolável fica em `shell.css`, não em `areas.css`, que as páginas Next.js também carregam.
3. **Sem conteúdo, nada muda.** `recruiter` é `null` quando não há perfil visível. O microfrontend mostra a tela "em construção" de antes, e uma constante de build (`__HAS_CONTENT__`) tira a página e a biblioteca de animação do bundle de produção.
4. **Pausa e movimento reduzido.** A folha das páginas internas define `--area-motion-state: paused` no palco quando a caixa de pausa está marcada. Propriedade customizada atravessa o shadow DOM: o microfrontend usa `animation-play-state: var(--area-motion-state, running)` nas animações contínuas e lê a mesma propriedade antes de animar por script. O movimento reduzido é tratado por `@media` dentro do próprio microfrontend.
5. **Transição de entrada.** Dividida entre os dois documentos, ligados por uma marca em `sessionStorage`, `portfolio:entrada`, definida em `packages/contracts` (dois apps a usam; ADR 0008, item 4).
   - **Saída, na home:** no clique em "Entrar" da área, a home grava a marca com a hora, mostra uma cortina e navega depois de 0,45 s. É comportamento da home e mora em `persona-list.tsx`.
   - **Chegada, no shell:** um script inline no `<head>`, junto ao do tema, consome a marca e, se ela tiver menos de 5 s, liga `data-arrival` no `<html>` antes da primeira pintura. A cortina se abre em CSS.
   - **Quem não passa por ela:** movimento reduzido, animações pausadas, clique com tecla modificadora e navegação sem JavaScript. Nesses casos o link abre na hora, como qualquer link.
   - O som do corte toca na home, dentro do gesto, com o som ligado.
6. **Emenda a `docs/plans/home-animacoes.md`.** Lá ficou registrado que "a página não espera" o clarão do clique. Para o "Entrar" de uma área com transição, a página espera 0,45 s, por pedido do autor em 2026-10-09.

## Consequências

- O HTML de `/recrutador` muda quando o conteúdo é publicado: ganha `data-content`. Até lá, produção é idêntica à de antes.
- Todo documento do shell leva mais um trecho de script inline (pendência B14, sobre CSP). A cortina de chegada usa hoje a cor da área do recrutador; outra área que ganhar a transição precisa da cor dela.
- A página com conteúdo não é coberta pelo e2e nem pelo Lighthouse do CI, que rodam sobre o build de produção. A cobertura vem dos testes unitários do microfrontend, com conteúdo de teste, e de uma checagem local sobre um build com rascunhos (`pnpm test:e2e:drafts`). Quando houver conteúdo publicado, essa checagem vira e2e normal.
- A área passa a baixar o peso normal da fonte (dois arquivos, dentro do limite).
- Animação por script (Motion) não é parada por `animation-play-state`: por isso as animações contínuas ficam em CSS, e o script só faz entradas, que têm fim.
- `:has()`, `clip-path` animado e `conic-gradient` só foram conferidos no Chromium (pendência B12).

## Emenda de 2026-10-09

No mesmo dia o autor decidiu publicar a página com os dados de exemplo e a faixa "Dados de exemplo", até o conteúdo real chegar. O item 3 continua descrevendo o que acontece sem conteúdo, mas esse não é mais o estado de produção: `/recrutador` já vai ao ar com `data-content`. A cobertura passou para o e2e e o Lighthouse do CI (`e2e/recruiter.spec.ts`); a checagem local com rascunhos, citada nas consequências, deixou de existir. Medido: LCP de 1,81 s e CLS de 0,033.

Em 2026-10-10 a área do cliente passou a seguir esta decisão, e a exceção que publica dados de exemplo passou a valer também para ela (`docs/plans/clientes-conteudo.md`). Para o React, o estilo próprio do item 1 é um `<style>` renderizado pela página dentro do shadow root.

O item 5 (transição de entrada) foi substituído pelo ADR 0011, que dá a volta e uma cortina por área.

## Fontes

- [MDN: herança de propriedades customizadas e shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
- [MDN: `sessionStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
- Registro npm, consultado em 2026-10-09: `motion` 14.0.0 e `motion-v` 2.6.0.

Não verificado: o suporte atual do Firefox a View Transitions entre documentos, motivo declarado para descartar essa opção.
