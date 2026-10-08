# ADR 0009: Folha de estilo e palco das páginas internas

- Status: **aceito** pelo autor em 2026-10-08
- Data: 2026-10-08

## Contexto

As cinco páginas internas (recrutador, técnica, cliente, comunidade e como foi feito) passam a mostrar a mesma tela de "em construção": cenário animado na cor da área, personagem, mensagem, botão de volta e pausa. Elas têm dois donos de documento (o shell e o Next.js) e três delas hospedam um microfrontend em shadow DOM.

Três limites apertam a decisão:

- A home não pode ganhar peso: está a 2,4 kB do teto de JavaScript e a menos de 0,15 s do teto de LCP. O `tokens.css` e o `ds.js` são carregados por ela.
- O Next.js junta em um só o CSS de todas as páginas da rota única `[[...slug]]`: um `import` de CSS em um componente das páginas internas cairia também na home (conferido no `out/` gerado).
- Estilo do documento não entra em shadow DOM; só propriedades herdadas e `::part()`.

O que não se reabre: Web Components como contrato entre apps (ADR 0002), design system carregado uma vez por documento (ADR 0003), elemento sem comportamento como marcação mais CSS (ADR 0006) e comportamento de uma rota no app da rota (ADR 0008).

## Opções

| Critério                        | Tudo em cada MFE e no Next.js | Componente Lit no design system | Palco do documento, conteúdo do MFE por `::part` |
| ------------------------------- | ----------------------------- | ------------------------------- | ------------------------------------------------ |
| Peso na home                    | Nenhum                        | Cresce o `ds.js`                | Nenhum                                           |
| Implementações da aparência     | Quatro                        | Uma                             | Uma                                              |
| Personagem no HTML inicial      | Não nas áreas de MFE          | Depende do upgrade              | Sim                                              |
| Cada área na própria tecnologia | Sim                           | Não: o Lit desenha tudo         | Sim: o MFE desenha a mensagem                    |
| JavaScript novo                 | Em cada bundle                | No `ds.js`, em todas as rotas   | Só a marcação da mensagem em cada MFE            |

## Decisão

**O dono do documento desenha o palco; o microfrontend desenha o conteúdo e expõe `part`; a aparência dos dois fica em uma folha de estilo que só as páginas internas carregam.**

1. A aparência usada só pelas páginas internas mora em `/_ds/areas.css`, com a fonte em `packages/design-system/assets/areas.css`. O shell a liga com `<link>`. No Next.js ela entra por `<link rel="stylesheet" precedence>` no componente das páginas internas; importá-la como módulo de CSS é proibido, porque iria para a home.
2. O dono do documento (shell ou Next.js) escreve o palco no HTML inicial: cenário decorativo, título, personagem, botão de volta e, no grupo do canto, a pausa.
3. O microfrontend renderiza a mensagem no próprio framework, em shadow DOM, e marca os elementos com `part`. A folha os estiliza com `::part()`. O microfrontend não define aparência própria para o que a folha cobre. Nas páginas Next.js o mesmo bloco é um Server Component com classes equivalentes.
4. A arte dos personagens continua em `/_home/personas/` e passa a ser lida também pelo shell. A tabela com caminhos e dimensões vai para `packages/contracts`. É uma exceção ao item 5 do ADR 0006, que manda recurso compartilhado para `/_ds/`: mover os arquivos mudaria a URL da imagem do LCP da home sem ganho.
5. O botão de cantos cortados e o botão de pausa ficam duplicados entre `home.css` e `areas.css`, com os mesmos tokens e medidas. Unificar exigiria a home carregar a folha. A duplicação acaba quando a home puder carregá-la ou surgir um terceiro uso.
6. As cores dos cenários derivam dos tokens de cor de área por `color-mix()`, dentro da folha. Não há token novo, e o `tokens.css` não muda.

## Consequências

- As páginas internas fazem uma requisição de CSS a mais, que bloqueia a renderização delas, não a da home.
- Todo movimento da folha fica em `prefers-reduced-motion: no-preference`, e o que é contínuo para com a caixa de pausa, lida por `body:has(...)`, sem JavaScript.
- Um microfrontend rodando sozinho, fora do shell, mostra a mensagem sem estilo se a página de desenvolvimento não ligar a folha.
- `ds-badge` deixa de ter uso em produção; continua no design system.
- As páginas Next.js ficam perto do teto de LCP (medido: 2,38 a 2,55 s, teto de 2,5 s). Para caber, o palco usa um peso de fonte só, a mensagem entra sem opacidade e, na tela estreita, o personagem é menor que a frase. Ver `docs/plans/areas-em-construcao.md`.
- Animação aplicada por `::part()`, `color-mix()`, `mask` e `:has()` só foram conferidos no Chromium (pendência B12).

## Fontes

- [MDN: `::part()`](https://developer.mozilla.org/en-US/docs/Web/CSS/::part)
- [Next.js: CSS e folhas externas](https://nextjs.org/docs/app/getting-started/css), conferido na documentação que acompanha o Next.js 16.3.8 instalado.

Não verificado: o resultado atual, por navegador, dos testes da plataforma para animação em `::part()`.
