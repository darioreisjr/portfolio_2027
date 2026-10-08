# apps/mfe-vue (Vue): área do recrutador

Resumo e stack, experiência em linha do tempo, formação e certificados, currículo em PDF.

## Convenções

- Expõe `<mfe-recrutador>` com `defineCustomElement`. Atributos: `locale`, `base-path`.
- Composition API com `<script setup>` e TypeScript estrito.
- `compilerOptions.isCustomElement` reconhece as tags do design system.
- Dados de `packages/content`: `profile`, `experiences`, `education`, `skills`, `contacts`, `ui`.
- Enquanto a área não tem conteúdo, o elemento mostra a mensagem "em construção" de `ui.construction`: uma `section` com `part="message"`, o título (`title`), a frase (`text`) e a barra (`bar`, `bar-fill`). O MFE não tem estilo próprio para ela: a folha `/_ds/areas.css` do documento a estiliza por `::part()` (ADR 0009). Rodando sozinho, a mensagem aparece sem estilo.
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
