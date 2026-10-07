# Plano: fundo de sakura na tela de escolha de perfil

- Status: **aprovado** pelo autor em 2026-10-07 e implementado
- Origem: entrevista com o autor, `discovery-analyst` e `architect`

**Objetivo:** as quatro homes ganham um cenário de sakura desenhado em SVG e CSS, com pétalas caindo, de dia no tema claro e à noite no tema escuro, sem JavaScript novo.

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
| Astro              | Um círculo em CSS: sol enevoado de dia, lua à noite, meio encoberto pelo galho direito                                                        |
| Névoa              | `--color-scene-veil` atrás de título, legendas, link e controle de pausa                                                                      |
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

## Fora desta tarefa

Botão de tema, cenário nas outras rotas, lembrar a pausa entre visitas, som, variação por estação, cobrança de CSS no script de orçamentos.

## Pendências que ficaram

- Conferir a animação em um celular de verdade. Se engasgar, reduzir para 6 pétalas no celular.
- Conferir a pausa por `:has(:checked)` no Firefox e no Safari; o teste automático cobre só o Chromium.
- O LCP da home está a 0,2 s do limite. Medir de novo a cada arte nova de personagem.
- Tradução de "Pausar animação" em inglês, espanhol e português de Portugal entra na revisão do autor.
- Rolar além do fim da página ainda mostra a cor de superfície do `body`.
