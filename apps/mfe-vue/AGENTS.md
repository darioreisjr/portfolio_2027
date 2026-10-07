# apps/mfe-vue (Vue): área do recrutador

Resumo e stack, experiência em linha do tempo, formação e certificados, currículo em PDF.

## Convenções

- Expõe `<mfe-recrutador>` com `defineCustomElement`. Atributos: `locale`, `base-path`.
- Composition API com `<script setup>` e TypeScript estrito.
- `compilerOptions.isCustomElement` reconhece as tags do design system.
- Dados de `packages/content`: `profile`, `experiences`, `education`, `skills`, `contacts`, `ui`.
- Não empacota o design system nem o Lit.
- Roda sozinho com uma página HTML mínima própria.
- Teto de JavaScript: ver `docs/quality/budgets.md`.

## Comandos

Definidos no bootstrap. Skill de convenções: `vue-mfe`.
