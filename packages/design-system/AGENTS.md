# packages/design-system

Web Components em Lit, agnósticos de framework (ADR 0003). Hoje: `<ds-badge>` e `<ds-theme-toggle>`.

## Convenções

- Prefixo `ds-`. Um arquivo por componente em `src/`, registrado em `src/index.ts` com guarda contra registro duplo.
- Só tokens semânticos e de componente; nenhum valor literal.
- Melhoria progressiva: conteúdo no light DOM (slots), legível antes do upgrade.
- Exceção (ADR 0005): controle que só funciona com JavaScript, como o `<ds-theme-toggle>`, fica oculto até o upgrade, com o espaço reservado pela regra `:not(:defined)` dos tokens.
- `<ds-theme-toggle>` é o dono da troca de tema: aplica `data-theme`, guarda a escolha e emite o evento. O nome acessível entra pelo atributo `label`; o componente não lê `packages/content`.
- Elemento sem comportamento não vira custom element (ADR 0006): o seletor de idioma é marcação mais CSS dos tokens, um `<details>` cujo `<summary>` é a bandeira do idioma em uso e cuja lista abre para cima com os outros dois. A marcação de referência é a story `ds-language-switcher`, e o teste `ds-language-switcher.test.ts` cobre a aparência.
- `assets/` guarda recursos estáticos compartilhados. As bandeiras de `assets/flags/` vão para `dist/flags/` e são publicadas em `/_ds/flags/`; as cores de cada bandeira ficam no próprio arquivo.
- `assets/areas.css` é a folha das páginas internas (ADR 0009), publicada em `/_ds/areas.css`: palco, cenários por área, mensagem "em construção", botão de volta e pausa. Só as páginas internas a carregam; a home, nunca. Ela alcança a mensagem dos MFEs por `::part()`. Regras: cor só pelos tokens (os tons do cenário saem de `color-mix()` sobre `--area-color`); todo movimento dentro de `prefers-reduced-motion: no-preference`; movimento contínuo entra na regra de pausa, que precisa de especificidade maior que a da animação; um peso de fonte só, o forte; entrada da mensagem sem opacidade. A marcação de referência é a story "Palco das páginas internas". Meça com `pnpm lhci` a cada mudança: `/comunidade/` fica perto do teto de LCP.
- Depende de `packages/contracts` para as constantes e o evento de tema.
- Comportamento usado por uma rota só não vem para cá: mora no app dono da rota e só é promovido ao design system quando outro app precisar (ADR 0008).
- O build gera um bundle único, `dist/ds.js`, com o Lit dentro. Ele é carregado uma vez por documento, pelo shell ou pelo layout do Next.js. Os MFEs usam só os tipos.
- Tag nova entra em `HTMLElementTagNameMap` (`src/index.ts`) e em `react.d.ts`.
- Sem decorators: propriedades estáticas do Lit.
- Testes rodam em Chromium real (Vitest browser mode), como a doc do Lit pede.

## Comandos

| Comando                                                  | O que faz                     |
| -------------------------------------------------------- | ----------------------------- |
| `pnpm --filter @portfolio/design-system build`           | Gera `dist/ds.js` e os tipos  |
| `pnpm --filter @portfolio/design-system test`            | Testes em navegador           |
| `pnpm --filter @portfolio/design-system storybook`       | Storybook em `localhost:6006` |
| `pnpm --filter @portfolio/design-system build-storybook` | Storybook estático            |

Skill: `new-ds-component`.
