# packages/tokens

Tokens de design em propriedades CSS customizadas, em três camadas (ADR 0003).

## Convenções

- Fonte: `src/tokens.mjs`. O arquivo `dist/tokens.css` é gerado; não edite.
- Primitivos só aparecem aqui. Apps e componentes usam semânticos e de componente.
- Token semântico de cor tem valor nos temas claro e escuro; o teste cobra isso.
- Token de componente aponta só para semânticos.
- Componente novo do design system ganha aqui a regra `:not(:defined)` que reserva o espaço dele antes do upgrade (em `scripts/build.mjs`).
- Sem dependência de framework.

## Comandos

| Comando                                 | O que faz                                 |
| --------------------------------------- | ----------------------------------------- |
| `pnpm --filter @portfolio/tokens build` | Gera `dist/tokens.css` e os nomes tipados |
| `pnpm --filter @portfolio/tokens test`  | Testes das camadas e dos temas (Vitest)   |
