# packages/design-system

Web Components em Lit, agnósticos de framework (ADR 0003). Hoje: `<ds-badge>`.

## Convenções

- Prefixo `ds-`. Um arquivo por componente em `src/`, registrado em `src/index.ts` com guarda contra registro duplo.
- Só tokens semânticos e de componente; nenhum valor literal.
- Melhoria progressiva: conteúdo no light DOM (slots), legível antes do upgrade.
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
