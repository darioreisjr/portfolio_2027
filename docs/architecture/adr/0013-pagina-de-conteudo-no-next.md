# ADR 0013: Página de conteúdo em rota do Next.js

- Status: **aceito** pelo autor em 2026-10-10
- Data: 2026-10-10

## Contexto

A área da comunidade é a quarta a ganhar página de conteúdo e a primeira que não é microfrontend: é uma página do Next.js, na mesma rota única `[[...slug]]` da home. Os ADRs 0010 e 0011 decidiram o palco e as transições pensando no shell e nos microfrontends. Aqui o cenário é outro.

- O Next.js junta em um só o CSS de todas as páginas da rota: um `import` de CSS cairia na home (ADR 0009).
- O JavaScript também é compartilhado: um Client Component da comunidade entraria no pacote que a home baixa, e a home está perto do teto de 150 kB.
- A página media de 2,46 a 2,55 s de LCP, no limite do teto de 2,5 s, ainda sem conteúdo.
- O botão de volta precisa de comportamento para a transição (ADR 0011), e uma página do Next.js não carrega o script do shell.

O que não se reabre: o documento é dono do palco (ADR 0009); comportamento de uma rota mora no app da rota (ADR 0008); um mecanismo de transição, com a aparência por área (ADR 0011).

## Opções

Para a folha de estilo da página:

| Critério                   | `import` no componente | Em `packages/design-system` (`/_ds/`) | Em `apps/web-next/public/_home/` |
| -------------------------- | ---------------------- | ------------------------------------- | -------------------------------- |
| Cai na home                | Sim                    | Não                                   | Não                              |
| Dono                       | O app                  | O design system                       | O app                            |
| Mudança no build ou no dev | Nenhuma                | Lista de publicação e proxy           | Nenhuma                          |

Para o comportamento do botão de volta:

| Critério                         | Client Component  | Script inline na página  |
| -------------------------------- | ----------------- | ------------------------ |
| Peso na home                     | Sim, pacote comum | Nenhum                   |
| Risco de arquivo de script novo  | Sim               | Não                      |
| Conta no orçamento de JavaScript | Sim               | Não ("peso escondido")   |
| CSP futura (pendência B14)       | Sem efeito        | Mais um trecho a liberar |

## Decisão

**A página de conteúdo de uma rota do Next.js é um Server Component sem JavaScript próprio, com folha de estilo servida de `public/`, e o comportamento mínimo de que precisar vai em script inline só naquela página.**

1. **Folha de estilo.** `apps/web-next/public/_home/community.css`, ligada por `<link rel="stylesheet" precedence>` no componente da página. É do app, porque a rota é só dele; a home não a carrega.
2. **Palco próprio.** A página não usa o palco das páginas internas nem carrega `/_ds/areas.css`: uma folha externa só, para não somar requisição bloqueante em uma página no limite de LCP. Por isso ela traz a própria cópia do botão de pausa do grupo do canto. É a terceira cópia dessa aparência (home, páginas internas, comunidade); o item 5 do ADR 0009 previa unificar no terceiro uso, mas unificar custaria a folha a mais. A duplicação é aceita.
3. **Sem JavaScript no pacote.** Toda a página é Server Component. As animações são CSS: contínuas, paradas pela caixa de pausa com `body:has(...)`, e entradas por rolagem sob `@supports`, com o estado de base igual ao final.
4. **Script inline.** O clique no botão de volta, para a transição, é um trecho inline no `<head>`, junto ao do tema e ao da chegada, só no documento da comunidade (`lib/community-leave.ts`). É a segunda exceção ao ADR 0008, depois do item 4 do ADR 0011, pelo mesmo motivo: o que só uma página usa não deve pesar no pacote de todas.
5. **Quando não há conteúdo.** `buildCommunityPage` devolve `null` e a rota mostra a tela "em construção" de antes, sem os scripts da transição.
6. **Vitrine do design system.** É uma seção desta página, com dados reais: os componentes de verdade e amostras que leem os tokens do tema em uso. Os nomes vêm de `tokenNames`; o valor não é impresso, é o que o navegador resolve.
7. **Toda área é outro documento.** Com a comunidade em `AREA_TRANSITIONS`, o "Entrar" de todo personagem passa a ser `<a>`. Não sobra navegação do Next.js a partir da home.

## Consequências

- O JavaScript das páginas Next.js cai de 148,4 para 144,7 kB e a home passa de nove para oito arquivos de script: o roteador de links saiu.
- A música da home para ao entrar na comunidade, como já parava nas outras áreas. A cobertura de teste "sair da home pela navegação do Next.js" deixa de existir, porque o caminho deixou de existir.
- A folha em `public/` não passa pelo minificador nem pelo lint de CSS do build: conferir à mão que só usa tokens.
- O trecho inline não aparece no orçamento de JavaScript. Mede cerca de 0,5 kB.
- `animation-timeline`, `clip-path` animado e `mask` só foram conferidos no Chromium (pendência B12).
- Só "Como foi feito" continua na tela "em construção".

## Fontes

- Documentação do Next.js que acompanha a versão instalada, sobre folhas de estilo com `precedence` e arquivos de `public/`.
- [MDN: `animation-timeline`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline)

Não verificado: o suporte atual do Firefox e do Safari a animação por rolagem.
