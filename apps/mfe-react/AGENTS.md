# apps/mfe-react (React): área do cliente

Serviços, depoimentos, projetos na narrativa de resultado, canal de orçamento.

## Convenções

- Expõe `<mfe-clientes>` por uma classe `HTMLElement` que chama `createRoot` em `connectedCallback` e `unmount` em `disconnectedCallback`. Atributos: `locale`, `base-path`.
- Componentes de função e TypeScript estrito.
- Tags do design system direto no JSX, com declaração de tipos; sem wrapper.
- Dados de `packages/content`: `services`, `testimonials`, `projects` (narrativa `outcome`), `contacts`, `ui`.
- Não empacota o design system nem o Lit.
- Raiz em shadow DOM (`attachShadow` na classe do elemento).
- Roda sozinho com `index.html` e `dev/main.ts`, que carregam tokens e design system no lugar do shell.
- Teto de JavaScript: ver `docs/quality/budgets.md`.

## Comandos

| Comando                             | O que faz                                |
| ----------------------------------- | ---------------------------------------- |
| `pnpm --filter mfe-react dev:solo`  | Roda isolado em `localhost:5175`         |
| `pnpm --filter mfe-react build`     | Gera `dist/mfe.js`                       |
| `pnpm --filter mfe-react test`      | Testes em Chromium (Vitest browser mode) |
| `pnpm --filter mfe-react typecheck` | Checagem de tipos                        |

Skill de convenções: `react-mfe`.
