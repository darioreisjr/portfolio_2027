# apps/mfe-angular (Angular): área técnica

Projetos na narrativa técnica, skills com filtro, GitHub.

## Convenções

- Expõe `<mfe-tecnico>` com `createCustomElement` de `@angular/elements`. Atributos: `locale`, `base-path`.
- Componentes standalone, signals e TypeScript estrito.
- `CUSTOM_ELEMENTS_SCHEMA` nos componentes que usam tags do design system.
- Dados de `packages/content`: `projects` (narrativa `technical`), `skills`, `contacts`, `ui`.
- Não empacota o design system nem o Lit.
- Sem zone.js: estado em signals. Raiz em shadow DOM (`ViewEncapsulation.ShadowDom`).
- `outputHashing: none`: o shell carrega sempre `main.js`.
- Roda sozinho pela configuração `solo` do `angular.json` (`dev/index.html` e `dev/main.ts`).
- É o maior runtime dos três MFEs: confira o teto em `docs/quality/budgets.md` a cada dependência nova.

## Comandos

| Comando                               | O que faz                                      |
| ------------------------------------- | ---------------------------------------------- |
| `pnpm --filter mfe-angular dev:solo`  | Roda isolado em `localhost:4200`               |
| `pnpm --filter mfe-angular build`     | Gera `dist/browser/main.js`                    |
| `pnpm --filter mfe-angular test`      | Testes com Vitest e jsdom, pelo CLI do Angular |
| `pnpm --filter mfe-angular typecheck` | `ngc`, com templates estritos                  |

Skill de convenções: `angular-mfe`.
