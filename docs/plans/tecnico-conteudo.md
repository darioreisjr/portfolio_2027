# Plano: página técnica, volta do recrutador e transições por área

- Status: **aprovado** pelo autor em 2026-10-09 e implementado. A aparência aguarda o olho do autor
- Origem: pedido e entrevista com o autor, pesquisa na web, `discovery-analyst` e `architect`
- Decisões de arquitetura: ADR 0011 (transições) e ADR 0012 (raio-x do site)

**Objetivo:** a página da área técnica, para quem é técnico, com identidade própria; a transição de volta do recrutador; e transições próprias de entrada e de volta na área técnica.

## O que a pesquisa indicou

- Profundidade vale mais que volume: um projeto com estudo de caso escrito pesa mais que vários demos. A estrutura mais citada é problema, abordagem (arquitetura, stack, diagrama), desafios e resultado.
- O que se avalia é critério: explicar por que um caminho foi escolhido e não outro. As fontes não trazem dado sobre trade-offs; é prática comum de quem contrata.
- Código à vista: README claro, demo funcionando, atividade e linguagens no repositório.

Fontes: [iDelsoft](https://idelsoft.com/blog/tpost/how-to-build-a-strong-developer-portfolio), [DevPlaybook](https://devplaybook.cc/blog/developer-portfolio-checklist-20-things-hiring-managers), [Design Gurus](https://www.designgurus.io/answers/detail/how-should-a-software-engineer-portfolio-look-like). São textos de carreira, não pesquisa formal.

Sobre a referência visual pedida (Dan Da Dan): as resenhas descrevem cores chapadas, perspectivas distorcidas e movimento com borrões de velocidade. A página usa motivos, não arte, nomes ou personagens da obra.

## Decisões do autor

| Tema       | Decisão                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------- |
| Blocos     | Estudos de caso, skills com filtro, raio-x deste site e terminal interativo                 |
| Identidade | Própria: nada da aparência do recrutador                                                    |
| Estilo     | "Mangá técnico" em vermelho, sobre base de interface técnica                                |
| Transições | Volta no recrutador; entrada e volta próprias na área técnica, no estilo falha de sinal     |
| Publicação | No ar com a faixa "Dados de exemplo" nos blocos fictícios; o raio-x é real e não leva faixa |
| Animação   | Biblioteca `motion`, versão mini, como no recrutador                                        |

## A página

| Bloco             | O que mostra                                                                               | Dado      |
| ----------------- | ------------------------------------------------------------------------------------------ | --------- |
| Abertura          | A quem a área se destina                                                                   | Texto     |
| Terminal          | Atalho para as seções por comando                                                          | Interface |
| Estudos de caso   | Por projeto: problema, arquitetura, trade-offs, tecnologias e links                        | Exemplo   |
| Stack             | Tecnologias com nível e medidor, filtráveis por categoria                                  | Exemplo   |
| Raio-x deste site | Áreas e tecnologia de cada uma, JavaScript medido contra o teto, Lighthouse, lista de ADRs | Real      |

### Terminal

- Comandos: `projetos`, `stack`, `raio-x`, `adr`, `ajuda` e `limpar`. O nome que se digita é traduzido; maiúsculas não importam.
- Cada comando também é um botão, que chama a mesma função.
- Os comandos de seção respondem com um resumo e um botão "Ir para a seção", que rola e põe o foco no título. Âncora não alcança elemento dentro de shadow DOM.
- A saída é uma região `role="log"`, com no máximo 40 linhas. As setas para cima e para baixo percorrem o que foi digitado.
- O terminal é só atalho: os quatro blocos são seções comuns da página, na ordem do documento.

### Identidade visual

O que é da área técnica, e só dela:

- **Quadro de mangá:** borda grossa na cor do texto e sombra chapada vermelha.
- **Selo:** rótulo monoespaçado em negativo, levemente girado, numerando as seções.
- **Meio-tom e linhas de velocidade** na abertura, por `radial-gradient` e `repeating-conic-gradient` com máscara.
- **Falha de sinal** no título: duas cópias recortadas em faixas que tremem em rajadas curtas.
- **Terminal em negativo**, com varredura de tela.
- **Teclas:** botões monoespaçados com sombra chapada, que afundam ao apertar.
- **Fonte monoespaçada do sistema** em código, dados e rótulos (`--font-code`), sem arquivo de fonte.

Não reaproveitado do recrutador: o xadrez, o risco de lâmina, a ficha e o corte em diagonal.

### Movimento

- **Motion:** entrada dos blocos ao rolar, cascata dos itens, realce na troca do filtro e na saída do terminal. Tudo com fim.
- **CSS:** a falha de sinal e a varredura, contínuas, com `animation-play-state: var(--area-motion-state, running)`.
- O estado inicial oculto é posto por script: se a biblioteca falhar, ou sem `IntersectionObserver`, o conteúdo fica visível. A abertura e o terminal nunca nascem ocultos.

## Estrutura no Angular

- `tech-area.component.ts`: a raiz, em shadow DOM, com todo o CSS (`tech-page.css`). Sem conteúdo, mostra a tela "em construção".
- `tech-page.component.ts`: a página, sem estilo nem encapsulamento próprios. O CSS da raiz vive no shadow root e a alcança.
- `reveal.ts`: as entradas com a Motion, com as guardas de movimento.
- Sem `@angular/forms`: campo nativo com signals.
- A página não é eliminada do bundle quando não há conteúdo: o teto é folgado, e o `define` do Angular é fixo no `angular.json`.

## Transições (ADR 0011)

| Momento         | Recrutador                       | Técnico                                            |
| --------------- | -------------------------------- | -------------------------------------------------- |
| Entrar, na home | Corte em diagonal, som de lâmina | Faixas vermelhas aos trancos, notas de confirmação |
| Chegar na área  | O corte se abre                  | As faixas correm para lados opostos                |
| Voltar, na área | O corte fecha, com "Voltando..." | As faixas fecham, com "Voltando..."                |
| Chegar na home  | O corte se abre                  | As faixas se abrem                                 |

Não passa por elas quem pediu movimento reduzido, quem pausou as animações, o Ctrl+clique e a navegação sem JavaScript.

## Raio-x (ADR 0012)

`packages/content/data/site.json`, gravado por `node scripts/site-xray.mjs` depois de `pnpm build && pnpm assemble && pnpm lhci`. O `pnpm test` roda `--check`, que acusa ADR novo ou teto alterado sem atualizar o arquivo.

## Medido (2026-10-09)

| Item                      | Antes         | Depois        | Teto   |
| ------------------------- | ------------- | ------------- | ------ |
| JavaScript de `/`         | 148,3 kB      | 148,3 kB      | 150 kB |
| Arquivos de script de `/` | 9             | 9             | 9      |
| LCP de `/`                | 2,57 a 2,64 s | 2,55 a 2,58 s | 2,7 s  |
| Shell                     | 0,9 kB        | 1,3 kB        | 10 kB  |
| Microfrontend Angular     | 37,7 kB       | 59,8 kB       | 110 kB |
| Rota `/tecnico`           | 46,7 kB       | 68,8 kB       | 140 kB |
| LCP de `/tecnico`         | 1,66 s        | 1,81 a 1,96 s | 2,5 s  |
| CLS de `/tecnico`         | 0,001         | 0,033         | 0,1    |
| Rota `/recrutador`        | 51,8 kB       | 52,1 kB       | 90 kB  |

`/comunidade/`, que não mudou, mediu 2,535 s em uma das quatro rodadas do Lighthouse e de 2,38 a 2,46 s nas outras. É a página que já vivia no limite de 2,5 s.

## Testes

- **Unitários do Angular** (`tech-area.component.spec.ts`): idioma, estilo da raiz alcançando a página, faixa de exemplo só no bloco fictício, estudo de caso, filtro, terminal por botão e por texto, foco no título da seção, custom element.
- **e2e da página** (`e2e/tech.spec.ts`): axe nos dois temas, conteúdo sem o terminal, raio-x, os três fluxos do terminal, filtro, entrada ao rolar e deslocamento de layout, pausa, movimento reduzido, fontes e celular.
- **e2e das transições** (`e2e/transitions.spec.ts`): as duas áreas, ida e volta, com teclado, movimento reduzido, pausa, Ctrl+clique, volta pelo navegador, marca velha ou de outra área, sem JavaScript e com a pausa lembrada da home.
- **Raio-x:** `scripts/site-xray.mjs --check` no `pnpm test`.

## Pendências

- Conteúdo real: estudos de caso e tecnologias (`docs/content/pendencias-do-autor.md`).
- Revisão dos textos em en e es (B6).
- Firefox, Safari e celular de verdade: `mask` com gradiente, `content` com texto alternativo e animação em `steps()` só foram vistos no Chromium (B12). Leitor de tela no terminal (B11).
- `/comunidade/` no limite do LCP.
- Clientes e Comunidade não têm transição nem página.
