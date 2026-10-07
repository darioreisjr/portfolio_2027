# Plano: fundo de sakura na tela de escolha de perfil

- Status: **aprovado** pelo autor em 2026-10-07 e implementado
- Origem: entrevista com o autor, `discovery-analyst` e `architect`

**Objetivo:** as quatro homes ganham um cenário de sakura desenhado em SVG e CSS, com pétalas caindo, de dia no tema claro e à noite no tema escuro, sem JavaScript novo.

> Mudou em 2026-10-07 (`docs/plans/home-idioma-fonte.md`): a névoa atrás do texto deu lugar a um contorno na letra, e a caixa "Pausar animação" virou um botão de ícone no canto inferior direito, ainda sem JavaScript.

## Decisões do autor

| Tema         | Decisão                                                                       |
| ------------ | ----------------------------------------------------------------------------- |
| Onde         | Só na home                                                                    |
| Cenário      | Céu em degradê, galhos floridos entrando pelos cantos de cima, pétalas caindo |
| Tema escuro  | Sakura à noite: céu índigo, lua, pétalas claras. O fundo deixa de ser preto   |
| Arte         | Desenhada em código (SVG e CSS), sem imagem                                   |
| Pétalas      | Moderadas: 20 em tela larga, 10 no celular                                    |
| Legibilidade | Névoa atrás dos blocos de texto                                               |

## Desenho

| Ponto              | Como ficou                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Estilo             | Flor de cinco pétalas com o entalhe na ponta; galho anguloso que afina, sem folhas; composição assimétrica com o centro livre; cores chapadas |
| Estrutura          | `sakura-scene.tsx`, Server Component, decorativo (`aria-hidden`), atrás do conteúdo e sem receber cliques                                     |
| Cores              | Tokens `--color-scene-*` em `packages/tokens`, com valor nos dois temas. O tema escuro não tem código próprio na tela                         |
| Pétalas            | Tabela fixa de 20 em `lib/sakura.ts`, sem sorteio. Cada uma leva só números no `style`: posição, tamanho, opacidade, ritmo                    |
| Animação           | Um `@keyframes` por pétala (queda, balanço e giro juntos) e um balanço leve dos galhos. Só `translate` e `rotate`                             |
| Astro              | Sol enevoado de dia, lua à noite, meio encoberto pelo galho direito (ver a segunda rodada, abaixo)                                            |
| Névoa              | `--color-scene-veil` atrás de título, frases, link e controle de pausa                                                                        |
| Pausa              | Caixa de seleção "Pausar animação" no fim da tela; o CSS lê o estado com `:has(:checked)`                                                     |
| Movimento reduzido | Pétalas paradas no ar, galhos imóveis, controle de pausa escondido                                                                            |
| Celular            | Metade das pétalas e galhos proporcionalmente maiores                                                                                         |

## Como a legibilidade é garantida

O axe não mede contraste de texto sobre degradê, galho ou pétala. Dois testes cobrem isso:

- `packages/tokens/src/tokens.test.js` calcula o contraste dos dois tons de texto sobre o céu e sobre a névoa com cada cor do cenário atrás, nos dois temas. Mínimo de 4,5.
- `e2e/home.spec.ts` captura a tela com o texto transparente e mede o pior pixel atrás de cada bloco de texto, em tela larga e no celular, nos dois temas.

## Medido

| Medida                   | Antes       | Depois   | Limite             |
| ------------------------ | ----------- | -------- | ------------------ |
| JavaScript de `/`        | 144,7 kB    | 144,7 kB | 150 kB             |
| CSS do Next.js           | não medido  | 3,1 kB   | 20 kB              |
| CSS dos tokens           | não medido  | 1,4 kB   | (dentro dos 20 kB) |
| HTML de `/`              | não medido  | 5,9 kB   | sem teto           |
| Performance (Lighthouse) | 99          | 98 a 99  | 90                 |
| LCP                      | 2,2 s       | 2,3 s    | 2,5 s              |
| TBT                      | 38 a 150 ms | 45 ms    | 200 ms             |
| CLS                      | 0           | 0        | 0,1                |
| Acessibilidade e SEO     | 100         | 100      | 100 e 95           |

## Segunda rodada: mais movimento e tela sem rolagem

Aprovada pelo autor em 2026-10-07, depois de ver a primeira versão. O plano foi escrito pela sessão principal, porque os subagentes de descoberta e de planejamento estavam indisponíveis.

| Ponto                      | Como ficou                                                                                                                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Galhos                     | Vento em ciclo de 10 s: balanço visível e uma rajada aos dois terços, em que o galho verga cerca de 6 graus. Os dois galhos têm ritmos diferentes                                                        |
| Flores                     | Cada flor treme por conta própria, com atraso crescente da base para a ponta. Por isso o galho passou a ser desenhado direto no SVG, e não por `<use>`                                                   |
| Sol e lua                  | Dois astros no mesmo lugar. O token `--scene-daylight` vale 1 de dia e 0 à noite; registrado como número em `home.css`, ele desliza na troca de tema, e o sol desce enquanto a lua sobe, em cerca de 1 s |
| Halo                       | Um brilho em volta do astro cresce e diminui devagar                                                                                                                                                     |
| Deriva                     | O lugar do astro se desloca em arco ao longo de um minuto e volta                                                                                                                                        |
| Névoa                      | Três faixas arredondadas e empilhadas, como nas gravuras, cruzam o alto do céu na frente do astro. Duas no celular                                                                                       |
| Pausa e movimento reduzido | Valem para tudo isso. Com movimento reduzido a troca de sol e lua é instantânea e a névoa fica parada, espalhada pelo céu                                                                                |
| Tela sem rolagem           | Com 40rem de altura ou mais, a home tem exatamente a altura da janela: os textos ocupam o que precisam e os personagens ficam com o que sobra, até 20rem. Abaixo disso a tela volta a rolar              |

Continua sem JavaScript novo. Testes em `e2e/home-motion.spec.ts`: a página não rola em seis tamanhos de janela e dois idiomas, tudo se move, tudo pausa, e o sol e a lua trocam com o tema.

## Fora desta tarefa

Botão de tema, cenário nas outras rotas, lembrar a pausa entre visitas, som, variação por estação, cobrança de CSS no script de orçamentos.

## Pendências que ficaram

- Conferir a animação em um celular de verdade. Se engasgar, reduzir para 6 pétalas no celular.
- Conferir a pausa por `:has(:checked)` no Firefox e no Safari; o teste automático cobre só o Chromium.
- O LCP da home está a 0,2 s do limite. Medir de novo a cada arte nova de personagem.
- Tradução de "Pausar animação" em inglês, espanhol e português de Portugal entra na revisão do autor.
- Rolar além do fim da página ainda mostra a cor de superfície do `body`.
