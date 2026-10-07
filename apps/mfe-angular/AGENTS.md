# apps/mfe-angular (Angular): área técnica

Projetos na narrativa técnica, skills com filtro, GitHub.

## Convenções

- Expõe `<mfe-tecnico>` com `createCustomElement` de `@angular/elements`. Atributos: `locale`, `base-path`.
- Componentes standalone, signals e TypeScript estrito.
- `CUSTOM_ELEMENTS_SCHEMA` nos componentes que usam tags do design system.
- Dados de `packages/content`: `projects` (narrativa `technical`), `skills`, `contacts`, `ui`.
- Não empacota o design system nem o Lit.
- Roda sozinho com uma página HTML mínima própria.
- É o maior runtime dos três MFEs: confira o teto em `docs/quality/budgets.md` a cada dependência nova.

## Comandos

Definidos no bootstrap. Skill de convenções: `angular-mfe`.
