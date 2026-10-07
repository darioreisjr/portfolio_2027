---
name: new-ds-component
description: Cria ou altera um componente do design system (Web Component em Lit) com tokens, story, teste e verificação de acessibilidade. Use ao adicionar ou modificar qualquer componente em packages/design-system ou token em packages/tokens.
---

# Componente do design system

Decisões: `docs/architecture/adr/0003-design-system.md`. Leia antes.

## Antes de criar

- Confira se já existe componente que resolve. Estender é melhor que duplicar.
- O componente é usado em mais de um app? Se não, talvez seja só marcação local com tokens.

## Tokens

- Três camadas: primitivos, semânticos, de componente.
- O componente usa só tokens semânticos ou os seus de componente (`--button-bg`). Nenhum valor literal, nenhum primitivo.
- Token novo entra em `packages/tokens` com valor para os temas claro e escuro.

## Componente

- Lit, TypeScript estrito, um arquivo por componente, tag com o prefixo do design system.
- API pública: propriedades e atributos para dados simples, slots para conteúdo, `CustomEvent` com `bubbles` e `composed` para saída.
- Melhoria progressiva obrigatória, porque não há renderização no servidor:
  - O conteúdo vai no light DOM, por slots, e é legível antes do upgrade.
  - Há regra `:not(:defined)` no CSS global reservando espaço e tipografia.
- Não registre a mesma tag duas vezes. O bundle do design system é carregado uma vez por documento.
- Sem dependência de framework e sem ler `packages/content`.

## Acessibilidade

- Prefira o elemento HTML nativo dentro do shadow DOM (`<button>`, `<a>`) a recriar papel com ARIA.
- Operável por teclado; foco visível com token de foco.
- Nome acessível em todo controle.
- Contraste AA nos dois temas.
- `prefers-reduced-motion` respeitado em qualquer animação.

## Entregáveis

| Item           | Conteúdo                                                     |
| -------------- | ------------------------------------------------------------ |
| Componente     | Código e tipos da tag, para JSX, Vue e Angular               |
| Story          | Estados principais, nos dois temas                           |
| Teste          | Renderização, propriedades, eventos, teclado                 |
| Acessibilidade | Verificação automática no teste e passada manual por teclado |
| Exportação     | Incluído no bundle e no índice do pacote                     |

## Verificação

Rode os testes e o Storybook do pacote e confirme o componente em um app consumidor. Peça revisão ao `design-system-guardian`.
