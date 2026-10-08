# Plano: painel do personagem escolhido em estilo menu de RPG

- Status: **aprovado** pelo autor em 2026-10-08 e implementado
- Origem: pedido e entrevista com o autor, `discovery-analyst` e `architect`
- Muda parte de `docs/plans/home-selecao.md` (selo de tecnologia, aparência do painel)

> Mudou em 2026-10-08 (`docs/plans/home-animacoes.md`): o brilho atrás do escolhido passou a pulsar e a seta do menu a balançar; os dois param com o botão de pausa e não existem com movimento reduzido.

**Objetivo:** ao escolher um personagem na home, o painel dele mostra uma descrição breve do perfil, no tom daquele público, e as opções "Entrar" e "Voltar" com cara de menu de jogo, na cor da tecnologia da área.

## Decisões do autor

| Tema            | Decisão                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Descrição       | Texto breve dizendo para quem é a área e o que ela traz, no tom do público (RH, técnico, negócio, casual). Sem título          |
| Textos          | Propostos pela IA e aprovados pelo autor em pt-BR; en, es e pt-PT entram como proposta (B6)                                    |
| Selo "Feito em" | Sai da tela                                                                                                                    |
| Botões          | Menu de RPG: cantos cortados, borda dupla e seta de cursor                                                                     |
| Cor             | A da tecnologia de cada área, ajustada para contraste: verde (Vue), vermelho (Angular), azul (React), preto e branco (Next.js) |
| Onde a cor vai  | Fundo do "Entrar", linhas do "Voltar", barra da descrição e brilho atrás do personagem                                         |
| Celular         | Descrição entre o personagem e os botões; a tela continua sem rolagem                                                          |

## Desenho

| Ponto          | Como ficou                                                                                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conteúdo       | `personas.<área>.description` em `home/<locale>.json`, obrigatória. `madeIn` foi removida. `ui.areas.*.description` não foi reaproveitada: é a meta descrição das páginas e pesa nos MFEs |
| Descrição      | `<p class="persona-description">`, primeiro filho do painel. Caixa de fundo sólido com a barra na cor da área e dois cantos cortados; sem contorno de letra                               |
| Leitor de tela | O "Entrar", que recebe o foco, é descrito pela frase e pela descrição                                                                                                                     |
| Peso do texto  | Negrito, como o resto da home: em peso normal a home baixaria o segundo arquivo de fonte e o LCP passaria do teto                                                                         |
| Cor            | Tokens `color-area-<área>` e `color-on-area`, nos dois temas. O `<li>` leva `data-area` e o CSS define `--persona-color`. É enfeite: frase e descrição identificam o perfil               |
| Opções         | O elemento fica retangular (anel de foco e clique inteiros). Dois pseudo-elementos recortados desenham as duas linhas e o miolo; a seta é fundo do miolo e não entra no nome acessível    |
| Seta           | Aparece na opção em foco ou sob o ponteiro. Ao escolher o personagem o foco vai para o "Entrar", então ela já nasce nele, também no toque                                                 |
| Brilho         | `radial-gradient` na cor da área atrás da figura escolhida, com 45% de opacidade. Surge com transição curta, sem animação contínua                                                        |
| Tela larga     | Painel em coluna ao lado do personagem, com até 22rem de largura                                                                                                                          |
| Celular        | Descrição em cima e as duas opções lado a lado. O painel oculto continua reservando o espaço, então a figura não muda de tamanho ao escolher                                              |
| `framework`    | O campo da tabela de rotas ficou, sem uso na home: ele espelha o `mfe-map.md`                                                                                                             |
| Estilo local   | Botões e caixa ficam no `home.css`: só a home usa. Se surgir um segundo uso, vão para o CSS compartilhado pelo ADR 0006                                                                   |

## Cores

| Área                 | Tema claro | Tema escuro |
| -------------------- | ---------- | ----------- |
| Recrutador (Vue)     | `#18794e`  | `#4fc08d`   |
| Técnica (Angular)    | `#bc002d`  | `#ff8087`   |
| Cliente (React)      | `#0a6f94`  | `#61dafb`   |
| Comunidade (Next.js) | `#0c0e13`  | `#ffffff`   |
| Texto sobre a cor    | `#ffffff`  | `#0c0e13`   |

O teste de `packages/tokens` cobra, por área e por tema: texto sobre a cor com 4,5:1 e a cor contra a superfície e contra o topo e a base do céu com 3:1.

## Medido

| Medida                   | Antes         | Depois        | Limite |
| ------------------------ | ------------- | ------------- | ------ |
| JavaScript de `/`        | 146,1 kB      | 146,1 kB      | 150 kB |
| Arquivos de fonte em `/` | 1             | 1             | 2      |
| Performance de `/`       | 97            | 96 a 97       | 90     |
| LCP de `/`               | 2,59 a 2,65 s | 2,62 a 2,65 s | 2,7 s  |
| TBT de `/`               | 37 a 48 ms    | 37 a 45 ms    | 200 ms |
| CLS de `/`               | 0,001         | 0,001         | 0,1    |
| Acessibilidade           | 100           | 100           | 100    |

Verificação: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm budgets`, `pnpm test:e2e` (119 testes) e `pnpm lhci`.

## Em aberto

- Os três revisores do fluxo ainda não passaram por esta mudança.
- Conferir em aparelho de verdade, no Firefox e no Safari (B12), e com leitor de tela (B11).
- Traduções das descrições aguardam a revisão do autor (B6).
- Para o autor olhar: o brilho da comunidade no tema claro é preto e parece uma sombra; as opções lado a lado no celular; o vão entre as duas linhas da borda.

## Fora desta tarefa

Componente de botão no design system; cor da área dentro dos MFEs ou do shell; animação contínua do brilho ou seta piscando; remover `framework` de `packages/contracts`.
