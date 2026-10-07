---
name: vue-mfe
description: Convenções do microfrontend Vue (área do recrutador, apps/mfe-vue). Use ao criar, alterar ou revisar código em apps/mfe-vue.
---

# MFE Vue: área do recrutador

Contexto: `apps/mfe-vue/AGENTS.md` e `docs/architecture/adr/0002-composition.md`.

## Como é exposto

- `defineCustomElement` registra `<mfe-recrutador>`.
- Atributos de entrada: `locale` e `base-path`.
- O ponto de entrada só registra o elemento. Não monta nada sozinho.
- A página de desenvolvimento isolado importa o mesmo ponto de entrada e coloca a tag no HTML.

## Código

- Composition API com `<script setup lang="ts">`. TypeScript estrito.
- Estado local com `ref` e `computed`. Sem biblioteca de estado global enquanto a área não precisar.
- Navegação interna da área é do Vue; para outra área, `<a>` com caminho da tabela de rotas.

## Estilos e design system

- `defineCustomElement` coloca os estilos no shadow root. Os tokens atravessam o shadow DOM; use-os direto.
- Só tokens semânticos e de componente. Nenhum valor literal.
- Tags do design system direto no template. O plugin do Vue precisa de `compilerOptions.isCustomElement` reconhecendo o prefixo do design system.
- Para passar objeto ou array a um componente do design system, use `.prop`.
- Não importe o runtime do design system nem o Lit; o shell já carregou.

## Dados e comunicação

- Dados só de `packages/content`: `profile`, `experiences`, `education`, `skills`, `contacts`, `ui`.
- Textos de interface vêm de `ui/<locale>` conforme o atributo `locale`.
- Comunicação com o shell só por eventos de `packages/contracts`.

## Limites

- Teto de JavaScript da rota em `docs/quality/budgets.md`. A doc do Vue cita cerca de 16 kB de base para custom elements.
- Dependência nova só com justificativa no plano aprovado.

## Verificação

Lint, typecheck, testes do app, a área rodando isolada e dentro do shell.
