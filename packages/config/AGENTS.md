# packages/config

Configuração compartilhada: `tsconfig.base.json`, ESLint (flat config) e Prettier. Sem código de runtime.

## Convenções

- A base de TypeScript só tem opções neutras e estritas. O que é de um framework fica no `tsconfig` do app.
- As regras de fronteira do `AGENTS.md` da raiz que dá para cobrar por lint moram em `eslint.config.js` (função `boundaries`).
- Plugin de lint novo entra aqui, com versão no catálogo do `pnpm-workspace.yaml`.

## Comandos

Não tem scripts próprios. `pnpm lint` e `pnpm format:check` rodam na raiz.
