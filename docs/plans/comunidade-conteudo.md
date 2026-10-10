# Plano: página da área da comunidade e transição "explosão de aura"

- Status: **aprovado** pelo autor em 2026-10-10 e implementado. A aparência aguarda o olho do autor
- Origem: pedido e entrevista com o autor, pesquisa na web, `discovery-analyst` e `architect`
- Decisão de arquitetura: ADR 0013. Emenda os ADRs 0009 (terceira cópia do botão de pausa) e 0011 (quarta área com transição, movimento próprio)

**Objetivo:** a página para quem veio aprender e trocar ideia, com artigos, código aberto, a vitrine do design system e como participar, em identidade própria e com uma transição diferente das outras três.

## O que a pesquisa indicou

- **Artigos:** os recentes, com data, assunto e tempo de leitura, e o link para onde foram publicados. Título que promete algo concreto pesa mais que anúncio vago.
- **Código aberto:** lista curta, cada projeto com uma linha de descrição, a situação e o link do repositório.
- **Participar não é só código:** corrigir texto, traduzir, relatar problema e sugerir também contam, e vale dizer por onde começar.
- **Acompanhar:** onde seguir e, se houver, feed ou newsletter.
- Sobre tempo de leitura, assuntos e séries as fontes não trouxeram dado; a página segue a prática comum.

Fontes: [Jesse Squires](https://www.jessesquires.com/blog/2016/01/14/new-weekly-brief/), [1Password Developer](https://www.1password.dev/community.md), [guia de escrita da Sentry](https://skills.sh/getsentry/skills/blog-writing-guide). São exemplos de sites e um guia interno de uma empresa, não pesquisa formal.

## Decisões do autor

| Tema       | Decisão                                                                        |
| ---------- | ------------------------------------------------------------------------------ |
| Blocos     | Artigos, código aberto, vitrine do design system, como acompanhar e participar |
| Referência | Dragon Ball Z, só por motivos visuais: sem arte, nomes ou personagens          |
| Cor        | A da área, preto e branco                                                      |
| Transição  | Explosão de aura, na entrada e na volta                                        |
| Animação   | Só CSS, sem biblioteca e sem pesar na home                                     |
| Publicação | No ar com a faixa "Dados de exemplo" nos blocos fictícios                      |
| Velocidade | Autorizado ir até 2,7 s de LCP se não coubesse em 2,5 s. Não foi preciso       |

## A página

| Bloco                       | O que mostra                                                                             | Dado            |
| --------------------------- | ---------------------------------------------------------------------------------------- | --------------- |
| Abertura                    | A quem a área se destina                                                                 | Texto           |
| 1. Artigos                  | Título com link, resumo, data, idioma do texto, assuntos e o medidor de tempo de leitura | Exemplo         |
| 2. Código aberto            | O repositório deste site e os projetos, em cápsulas, com a situação                      | Real e exemplo  |
| 3. Vitrine do design system | O selo funcionando, o botão de tema, as cores e a tipografia                             | Real            |
| 4. Acompanhar e participar  | Canais, o que é bem-vindo e o caminho para "Como foi feito"                              | Exemplo e texto |

- O repositório deste site é o único link real: vem do `package.json` da raiz, pelo raio-x do site (ADR 0012), e fica fora da faixa de exemplo.
- A vitrine não repete o botão de tema: aponta para o do canto. As amostras de cor leem os tokens do tema em uso, então trocar o tema muda todas.
- Sem filtro de artigos: com poucos itens não ajuda.

### Identidade: "energia", em preto e branco

- **Aura** pulsando atrás do título, e **linhas de velocidade** saindo de baixo.
- **Título inclinado**, em bloco invertido, como quem vem em velocidade.
- **Medidor de poder:** o tempo de leitura de cada artigo, em barra e em número. A barra é a fração do artigo mais longo.
- **Esferas** numerando as quatro seções, decorativas.
- **Cápsulas:** cada projeto em duas metades, a de cima invertida, com a situação no selo do design system.

Não reaproveitado: o xadrez, a lâmina e a ficha do recrutador; os quadros, selos, meio-tom, falha de sinal, terminal e fonte de código em tudo da área técnica; a janela, a borda luminosa e o portal do cliente; o cenário das páginas internas; a biblioteca de animação.

### Movimento, só em CSS

| Onde               | O que acontece                                           |
| ------------------ | -------------------------------------------------------- |
| Abertura           | A aura pulsa e as linhas de velocidade tremem, sem parar |
| Seções             | Sobem e aparecem conforme a página rola                  |
| Medidor de leitura | A barra carrega quando o artigo chega à tela             |
| Cápsulas           | Crescem ao entrar e levantam ao apontar ou focar         |

- As contínuas param com a caixa de pausa do canto.
- As entradas por rolagem ficam sob `@supports`, com o estado de base igual ao final: onde o navegador não as tem, tudo aparece completo.
- Com movimento reduzido nada se mexe e o botão de pausa some.
- O título e a frase da abertura nunca nascem ocultos.

## Estrutura (ADR 0013)

- `app/_components/community-page.tsx`: Server Component, sem JavaScript próprio.
- `lib/community.ts`: monta o modelo, com a data no idioma, a fração do medidor e os tokens da vitrine.
- `public/_home/community.css`: a folha da página, ligada por `<link precedence>`. A home não a carrega, e a página não carrega a das páginas internas.
- `lib/community-leave.ts`: o script inline do botão de volta.
- Sem conteúdo, a rota mostra a tela "em construção" de antes.

## Conteúdo

`@portfolio/content/community` entrega `community` (por idioma, ou `null`) e `communityUi`.

| Arquivo                   | O que é                                                                  |
| ------------------------- | ------------------------------------------------------------------------ |
| `articles.json`           | Artigos: título, resumo, data, assuntos, link, idioma e `readingMinutes` |
| `projects.json`           | `openSource` e a situação, `openSourceStatus`                            |
| `contacts.json`           | `primaryFor: ["community"]` nos canais de acompanhamento                 |
| `community/<locale>.json` | Textos de interface, inclusive a lista do que é bem-vindo                |
| `site.json`               | `repository`, o endereço real do repositório                             |

Os dois projetos de exemplo passaram a contar como código aberto, para aparecer aqui; não foram criados projetos novos, que apareceriam também nas outras áreas.

## Transição (ADR 0011)

- Na home, ao clicar em "Entrar": um disco na cor da área cresce do centro até cobrir a tela, com anéis de onda de choque atrás, e o aviso "Entrando...".
- Na chegada, o disco cresce mais um pouco e se desfaz.
- Na volta, o mesmo, com "Voltando...".
- É a primeira cortina que não desliza: o disco cresce por `clip-path` e some por opacidade. Os keyframes são próprios, e os das outras três áreas não mudaram.
- O "Entrar" de todo personagem passou a ser `<a>`: toda área é outro documento.

## Medido (2026-10-10)

| Item                           | Antes         | Depois        | Teto   |
| ------------------------------ | ------------- | ------------- | ------ |
| JavaScript das páginas Next.js | 148,4 kB      | 144,7 kB      | 150 kB |
| Arquivos de script de `/`      | 9             | 8             |        |
| LCP de `/comunidade`           | 2,46 a 2,55 s | 2,47 s        | 2,5 s  |
| CLS de `/comunidade`           | 0,001         | 0,001         | 0,1    |
| LCP de `/`                     | 2,57 s        | 2,43 a 2,64 s | 2,7 s  |

- O JavaScript caiu porque o roteador de links do Next.js saiu da home.
- A primeira medição com conteúdo deu de 2,53 a 2,54 s. O que resolveu foi carregar o personagem pequeno da abertura depois, com prioridade baixa: ele disputava a carga inicial com o texto, que é o maior elemento da tela.
- A exceção de 2,7 s não foi usada.

## Testes

- **Unitários** (`lib/community.test.ts`): o modelo nos três idiomas, o medidor, as datas, os tokens da vitrine e o script do botão de volta.
- **Conteúdo** (`packages/content`): artigos, situação obrigatória em projeto de código aberto, exemplos visivelmente fictícios.
- **e2e da página** (`e2e/community.spec.ts`): axe nos dois temas, artigos e medidor, repositório real fora da faixa, vitrine acompanhando o tema, participação, idiomas, a folha própria, pausa, movimento reduzido, deslocamento de layout, fontes e celular.
- **e2e das transições:** a quarta área entrou na matriz, com as cortinas dela; "sem transição" passou a ser a volta de "Como foi feito".
- **Som:** o teste das notas do "Entrar" segura só o temporizador da transição, para ler as notas ainda na home.

## Pendências

- Conteúdo real: `docs/content/pendencias-do-autor.md`.
- Revisão dos textos em en e es (B6).
- Firefox, Safari e celular de verdade: animação por rolagem, `clip-path` animado e `mask` só foram vistos no Chromium (B12). Leitor de tela (B11).
- "Como foi feito" segue "em construção" e sem transição.
- Fora desta etapa: filtro de artigos, artigo completo dentro do site, feed.
