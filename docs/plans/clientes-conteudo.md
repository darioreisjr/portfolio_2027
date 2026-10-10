# Plano: página da área do cliente e transição de onda

- Status: **aprovado** pelo autor em 2026-10-10 e implementado. A aparência aguarda o olho do autor
- Origem: pedido e entrevista com o autor, pesquisa na web, `discovery-analyst` e `architect`
- Emenda os ADRs 0010 (exceção de exemplo) e 0011 (terceira área com transição). Sem ADR novo

**Objetivo:** a página para quem procura alguém para fazer um projeto, em linguagem de resultado, com identidade própria e uma transição de entrada e de volta diferente das outras duas áreas.

## O que a pesquisa indicou

- **Confiança antes de técnica:** quem contrata não duvida que o freelancer saiba programar; teme sumiço, atraso e entrega quebrada. O que acalma é processo, prazo e saber como acompanhar.
- **Resultado, não ferramenta:** falar do problema do cliente e do que muda depois, sem jargão. Casos com resultado valem mais que lista de tecnologias.
- **Depoimentos** são mais fortes quando citam um resultado específico.
- **Contato sempre à mão:** a chamada em mais de um ponto, não só no fim.
- Sobre serviços, processo, preço e perguntas frequentes as fontes não trouxeram dado; a página segue a prática comum.

Fontes: [Skydo](https://www.skydo.com/blog/freelance-web-developer-portfolio), [Jobbers](https://www.jobbers.io/?p=128034), [Lilach Bullock](https://www.lilachbullock.com/portfolio-for-freelance/), [DEV Community](https://dev.to/evan_landrum_26e39f9f34fd/being-a-good-developer-doesnt-make-you-a-hireable-freelancer-heres-the-actual-gap-54c7), [Capital Numbers](https://www.capitalnumbers.com/blog/six-major-risks-you-will-face-when-hiring-a-freelance-developer). São guias de freelancers e de quem contrata, não pesquisa formal.

## Decisões do autor

| Tema        | Decisão                                                                      |
| ----------- | ---------------------------------------------------------------------------- |
| Referência  | Solo Leveling, só por motivos visuais: sem arte, nomes, falas ou personagens |
| Identidade  | Própria: nada do recrutador nem da área técnica                              |
| Transição   | Onda azul que cobre a tela, na entrada e na volta                            |
| Preço       | Como é orçado, formas de contratar e prazos típicos, sem valores             |
| Depoimentos | Exemplos óbvios ("Cliente Exemplo"), com a faixa de exemplo                  |
| Publicação  | No ar com a faixa "Dados de exemplo" em cada bloco fictício                  |
| Animação    | Mais rica que nas outras áreas, com a biblioteca `motion` na versão mini     |
| Tetos       | Microfrontend React de 80 para 105 kB; rota `/clientes` de 110 para 135 kB   |

## A página

| Janela                | O que mostra                                                           | Dado    |
| --------------------- | ---------------------------------------------------------------------- | ------- |
| Abertura              | O problema do cliente e os botões de orçamento                         | Texto   |
| O que eu faço         | Serviços, com o que está incluído, e os botões de orçamento            | Exemplo |
| Como funciona         | Etapas numeradas, da conversa inicial ao suporte                       | Exemplo |
| Projetos e resultados | Por projeto: o cenário e o que mudou                                   | Exemplo |
| O que dizem           | Depoimentos                                                            | Exemplo |
| Investimento e prazos | Como é orçado e as formas de contratar, com o prazo típico de cada uma | Exemplo |
| Perguntas frequentes  | Prazo, ajustes, propriedade, manutenção e pagamento                    | Exemplo |
| Chamada final         | Convite e os botões de orçamento                                       | Texto   |

- Os botões de orçamento aparecem em três pontos, com o WhatsApp primeiro. São links diretos: âncora não atravessa o shadow DOM.
- Janela sem dado some inteira; não fica painel vazio.
- Nenhum texto leva número inventado: nada de taxa de satisfação nem de quantidade de clientes.

### Identidade: "janela do Sistema"

- **Painel** com borda fina na cor da área, brilho em volta e marcas nos quatro cantos.
- **Cabeçalho de notificação** em fonte de código, entre colchetes: "Missões disponíveis", "Progresso da missão".
- **Grade de pontos** e um **portal** girando na abertura.
- **Etapas como níveis**, com um fio que se enche conforme a página rola.
- O texto é sempre da cor de texto do tema; o azul fica em borda, rótulo e botão.

Não reaproveitado: o xadrez, a lâmina e a ficha do recrutador; o quadro de sombra chapada, os selos, o meio-tom, a falha de sinal e o terminal da área técnica.

### Movimento

| Onde                | O que acontece                                                     | Como                              |
| ------------------- | ------------------------------------------------------------------ | --------------------------------- |
| Toda janela         | Abre de cima para baixo com uma varredura de luz; itens em cascata | Motion e CSS                      |
| Abertura            | O portal gira; o botão principal pulsa                             | CSS contínuo                      |
| Serviços            | O cartão inclina seguindo o ponteiro                               | Variáveis CSS escritas por script |
| Como funciona       | O fio enche ao rolar; o número da etapa conta até o valor          | CSS por rolagem e script          |
| Projetos            | Cenário e resultado entram de lados opostos                        | Motion                            |
| Formas de contratar | Brilho na borda ao apontar ou focar                                | CSS                               |
| Perguntas           | A resposta abre com a altura animada                               | CSS                               |
| Chamada final       | Ondas ao fundo                                                     | CSS contínuo                      |

- O que é contínuo usa `animation-play-state: var(--area-motion-state, running)` e para com a pausa do documento.
- O estado inicial oculto é posto por script. Sem `IntersectionObserver`, com movimento reduzido ou com a pausa marcada, tudo fica visível e parado.
- O fio por rolagem e a altura animada das perguntas ficam sob `@supports`: onde o navegador não os tem, o conteúdo aparece completo, sem a animação.
- A abertura nunca nasce oculta.

## Estrutura no React

- `App.tsx` recebe o conteúdo por propriedade, com o do pacote como padrão; `null` mostra a tela "em construção".
- `client/ClientPage.tsx`: a página, com `SystemWindow` e `QuoteLinks`. Sem estado do React: um efeito liga as animações, que escrevem direto no DOM, e as perguntas são `<details>`.
- `client/client-page.css`: importado com `?inline` e posto em um `<style>` dentro do shadow root (ADR 0010, item 1).
- `client/motion.ts`: a Motion, a inclinação e a contagem.
- A página não é eliminada do bundle quando não há conteúdo.

## Conteúdo

`@portfolio/content/client` entrega `client` (por idioma, ou `null`) e `clientUi`.

| Arquivo                | O que é                                                          | `status`   |
| ---------------------- | ---------------------------------------------------------------- | ---------- |
| `services.json`        | Serviços: título, descrição, o que está incluído                 | por item   |
| `testimonials.json`    | Depoimentos, com `consent`                                       | por item   |
| `client.json`          | Etapas, forma de orçar, formas de contratar com prazo, perguntas | do arquivo |
| `projects.json`        | A narrativa `outcome` de cada projeto                            | por item   |
| `contacts.json`        | `primaryFor: ["client"]` nos canais de orçamento                 | por item   |
| `client/<locale>.json` | Textos de interface: abertura, cabeçalhos, rótulos, chamada      | não tem    |

- Cada bloco é real quando tem item publicado e de exemplo quando só há rascunho; `example` diz isso por bloco.
- A área existe se houver serviço para mostrar.
- `consent` é obrigatório `true` só em depoimento publicado. Os de exemplo levam `false`. A regra do brief, "depoimento só entra com autorização", continua valendo para o que é real.
- Depoimento de exemplo some assim que os serviços forem reais: fictício ao lado de oferta de verdade seria o pior caso.

## Transição (ADR 0011)

Dentro do molde das outras duas: dois pseudo-elementos com o fundo da área, movidos por `translate`.

- O corpo d'água sobe de baixo, com a crista em arcos, feita por máscara de `radial-gradient` repetido.
- Uma faixa de espuma, mais clara, vem atrás, meio arco adiante.
- Na chegada, a onda recua para baixo.
- A entrada usa as notas de confirmação da home; a volta não tem som.

## Medido (2026-10-10)

| Item                      | Antes         | Depois        | Teto             |
| ------------------------- | ------------- | ------------- | ---------------- |
| Microfrontend React       | 77,7 kB       | 91,6 kB       | 105 kB (era 80)  |
| Rota `/clientes`          | 86,7 kB       | 100,7 kB      | 135 kB (era 110) |
| LCP de `/clientes`        | 1,81 a 1,96 s | 1,96 a 2,11 s | 2,5 s            |
| CLS de `/clientes`        | 0,001         | 0,033         | 0,1              |
| JavaScript de `/`         | 148,3 kB      | 148,4 kB      | 150 kB           |
| Arquivos de script de `/` | 9             | 9             | 9                |
| LCP de `/`                | 2,55 a 2,58 s | 2,57 s        | 2,7 s            |

A página pesou menos que a estimativa de 102 kB. `/comunidade/`, sem mudança, mediu de 2,46 a 2,55 s: continua no limite de 2,5 s.

## Testes

- **Unitários do React** (`mfe.test.tsx`): as oito janelas, a faixa só nos blocos de exemplo, os três pontos de orçamento, a marcação (etapas, citação, perguntas), blocos sem dado, pausa por propriedade customizada.
- **Sentinela do ADR 0009:** com conteúdo nulo, a mensagem "em construção" com as cinco `part`, estilizada de fora pela folha das páginas internas. Nenhum microfrontend a mostra mais em produção, então este teste é a única cobertura do contrato.
- **e2e da página** (`e2e/client.spec.ts`): axe nos dois temas, blocos, ausência de valores, faixas, orçamento, perguntas pelo teclado, entrada ao rolar e deslocamento de layout, inclinação do cartão, pausa, movimento reduzido, fontes e celular.
- **e2e das transições:** a terceira área entrou na matriz; "sem transição" passou a usar a comunidade.

## Pendências

- Conteúdo real: `docs/content/pendencias-do-autor.md`.
- Revisão dos textos em en e es (B6).
- Firefox, Safari e celular de verdade: `mask`, animação por rolagem, `::details-content` e inclinação com `perspective` só foram vistos no Chromium (B12). Leitor de tela nas janelas e nas perguntas (B11).
- Formulário de orçamento continua adiado.
- Comunidade e Como foi feito seguem "em construção" e sem transição.
