# apps/mfe-vue (Vue): área do recrutador

Resumo e stack, experiência em linha do tempo, formação e certificados, currículo em PDF.

## Convenções

- Expõe `<mfe-recrutador>` com `defineCustomElement`. Atributos: `locale`, `base-path`.
- Composition API com `<script setup>` e TypeScript estrito.
- `compilerOptions.isCustomElement` reconhece as tags do design system.
- Dados de `packages/content`: `profile`, `experiences`, `education`, `skills`, `contacts`, `ui`.
- Não empacota o design system nem o Lit.
- Raiz em shadow DOM (padrão do `defineCustomElement`).
- Roda sozinho com `index.html` e `dev/main.ts`, que carregam tokens e design system no lugar do shell.
- Teto de JavaScript: ver `docs/quality/budgets.md`.

## Comandos

| Comando                           | O que faz                                |
| --------------------------------- | ---------------------------------------- |
| `pnpm --filter mfe-vue dev:solo`  | Roda isolado em `localhost:5174`         |
| `pnpm --filter mfe-vue build`     | Gera `dist/mfe.js`                       |
| `pnpm --filter mfe-vue test`      | Testes em Chromium (Vitest browser mode) |
| `pnpm --filter mfe-vue typecheck` | `vue-tsc`                                |

Skill de convenções: `vue-mfe`.
