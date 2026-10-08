# Plano: tela "em construção" das cinco páginas internas

- Status: **aprovado** pelo autor em 2026-10-08 e implementado. A aparência aguarda o olho do autor
- Origem: pedido e entrevista com o autor, `discovery-analyst` e `architect`
- Decisão de arquitetura: `docs/architecture/adr/0009-palco-das-paginas-internas.md`

**Objetivo:** quem escolhe um perfil na home e entra encontra uma tela de jogo avisando que a área está em construção, na cor da tecnologia daquela área, com um cenário japonês animado.

## Decisões do autor

| Tema       | Decisão                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| Páginas    | As cinco: Recrutador, Técnico, Clientes, Comunidade e Como foi feito                                    |
| Cenários   | Bambu (verde), bordo e torii (vermelho), onda e chuva (azul), tinta sumi-e e lanternas (preto e branco) |
| Mensagem   | "Fase em construção" e "Esta área ainda está sendo forjada. Volte em breve.", com barra animada         |
| Barra      | Listrada, em movimento, sem porcentagem: não existe um número real de progresso                         |
| Na tela    | Botão de volta à escolha de perfil, o personagem da área e o botão de pausar a animação                 |
| Fora       | O nome da tecnologia não aparece                                                                        |
| Como feito | "Como foi feito" não tem personagem                                                                     |

## O que cada página mostra

| Área           | Cor (token)                   | Cenário                                                         | Personagem  |
| -------------- | ----------------------------- | --------------------------------------------------------------- | ----------- |
| Recrutador     | `color-area-recruiter`        | Bambus que balançam e folhas que caem                           | `recruiter` |
| Técnico        | `color-area-tech`             | Sol, torii e folhas de bordo que caem                           | `tech`      |
| Clientes       | `color-area-client`           | Três faixas de onda e chuva                                     | `client`    |
| Comunidade     | `color-area-community`        | Sol, pinceladas que se desenham uma vez e lanternas que oscilam | `community` |
| Como foi feito | `color-area-how-it-was-built` | O mesmo da comunidade                                           | nenhum      |

As cores dos cenários saem da cor da área diluída na superfície do tema, por `color-mix()`. Não há token novo.

## Quem desenha o quê (ADR 0009)

| Peça                                            | Dono                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| Cenário, título, personagem, botão de volta     | O documento: `apps/shell/src/page.ts` ou `area-construction.tsx`     |
| Pausa, no grupo do canto                        | O documento (rodapé do shell ou layout do Next.js)                   |
| Mensagem e barra nas áreas de MFE               | O microfrontend, no próprio framework, com `part`                    |
| Mensagem e barra em Comunidade e Como foi feito | `area-construction.tsx`, com classes equivalentes                    |
| Aparência de tudo                               | `/_ds/areas.css`, fonte em `packages/design-system/assets/areas.css` |
| Arquivo e dimensões de cada personagem          | `personaFigures` de `packages/contracts`                             |
| Textos                                          | `ui.construction` e `ui.pauseMotion` de `packages/content`           |

A home não carrega a folha: o teste "a home não carrega a folha das páginas internas" cobra isso.

## Movimento

- Tudo dentro de `prefers-reduced-motion: no-preference`. Com movimento reduzido a tela fica parada e o botão de pausa some.
- O que é contínuo (cenário e barra) para com a caixa de pausa, lida por `body:has(.area-motion input:checked)`, sem JavaScript. A regra de pausa precisa ter especificidade maior que a de qualquer animação do cenário: `animation` é abreviação e devolveria o estado para "rodando".
- A entrada da mensagem usa só deslocamento, nunca opacidade: a frase é o maior elemento da página, e texto que nasce invisível só conta como pintado no quadro seguinte.
- No celular os cenários de folhas usam metade das partículas.

## O que as medições obrigaram a mudar

As três áreas do shell passaram de primeira. As duas páginas Next.js saíram acima do teto de LCP de 2,5 s e levaram quatro ajustes, todos dentro da folha ou do componente:

| Problema medido                                                                 | Ajuste                                             |
| ------------------------------------------------------------------------------- | -------------------------------------------------- |
| A frase em peso normal fazia a página baixar o segundo arquivo de fonte         | O palco inteiro usa o peso forte, como a home      |
| O `<Link>` do menu buscava as outras páginas antes da hora                      | `prefetch={false}` no menu de áreas                |
| O menu quebrava de linha quando a fonte chegava e deslocava o palco (CLS 0,105) | No celular o menu é uma grade fixa de duas colunas |
| O personagem era o maior elemento da tela estreita                              | No celular ele ocupa menos área que a frase        |
| A mensagem entrava com opacidade zero                                           | Entrada só com deslocamento                        |

## Medido (2026-10-08, `pnpm lhci`, três execuções por rota)

| Rota               | LCP           | CLS   | JavaScript |
| ------------------ | ------------- | ----- | ---------- |
| `/recrutador/`     | 1,81 s        | 0,001 | 38,8 kB    |
| `/tecnico/`        | 1,81 a 1,82 s | 0,001 | 46,7 kB    |
| `/clientes/`       | 1,96 s        | 0,001 | 86,5 kB    |
| `/como-foi-feito/` | 2,38 a 2,39 s | 0,001 | 147,6 kB   |
| `/comunidade/`     | 2,41 a 2,55 s | 0,001 | 147,6 kB   |
| `/`                | 2,58 a 2,63 s | 0     | 147,6 kB   |

`/comunidade/` passou a ser medida pelo Lighthouse CI. Ela fica perto do teto: o piso das páginas Next.js é o JavaScript do framework, o mesmo da home. A folha `areas.css` mede 5,9 kB comprimida.

## Testes

- `e2e/areas.spec.ts`: as cinco páginas nos dois temas (título, mensagem, cor da área, personagem, cenário fora da árvore de acessibilidade, axe, sem erro no console), textos por idioma, botão de volta, movimento e pausa (inclusive na barra dentro do shadow DOM), movimento reduzido, pausa pelo teclado, a home sem a folha e o celular.
- Unitários: os três MFEs (marcação com `part` e texto por idioma), o shell (palco e pausa), `packages/contracts` (`personaFigures`), `packages/content` (`ui.construction`) e `packages/tokens` (cor de área com 4,5:1 sobre a superfície).
- `e2e/home.spec.ts`: o teste sem JavaScript passou a abrir a página com movimento reduzido. Com o JavaScript desligado o Playwright não repete a checagem de elemento parado, e o clique dado durante a entrada travava de vez em quando.

## Pendências

- Conferir Firefox, Safari e um celular de verdade: animação aplicada por `::part()`, `color-mix()`, `mask` e `:has()` só foram vistos no Chromium (B12).
- Revisão do autor dos textos em en, es e pt-PT (B6).
- Um microfrontend rodando sozinho (`dev:solo`) mostra a mensagem sem estilo: a página de desenvolvimento dele não liga a folha.
