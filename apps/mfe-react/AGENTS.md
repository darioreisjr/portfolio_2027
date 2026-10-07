# apps/mfe-react (React): área do cliente

Serviços, depoimentos, projetos na narrativa de resultado, canal de orçamento.

## Convenções

- Expõe `<mfe-clientes>` por uma classe `HTMLElement` que chama `createRoot` em `connectedCallback` e `unmount` em `disconnectedCallback`. Atributos: `locale`, `base-path`.
- Componentes de função e TypeScript estrito.
- Tags do design system direto no JSX, com declaração de tipos; sem wrapper.
- Dados de `packages/content`: `services`, `testimonials`, `projects` (narrativa `outcome`), `contacts`, `ui`.
- Não empacota o design system nem o Lit.
- Roda sozinho com uma página HTML mínima própria.
- Teto de JavaScript: ver `docs/quality/budgets.md`.

## Comandos

Definidos no bootstrap. Skill de convenções: `react-mfe`.
