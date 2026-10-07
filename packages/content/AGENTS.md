# packages/content

Todo o conteúdo do site em JSON (`data/`), validado com Zod e entregue aos apps como módulos tipados.

## Convenções

- Modelo em `docs/content/schema.md`; schemas em `src/schemas.ts`. Mude os dois juntos.
- Os apps importam só por subcaminho: `@portfolio/content/ui`, `@portfolio/content/profile`. Nunca leem `data/` direto.
- O build falha se um JSON for inválido. Item `published` precisa dos quatro idiomas.
- O build de produção exclui `draft`. Para incluir em desenvolvimento: `CONTENT_INCLUDE_DRAFTS=1`.
- Dado de exemplo é `draft` e claramente fictício. Nunca invente conteúdo sobre o autor.
- Zod fica só neste pacote; não entra no bundle de nenhum app.
- Hoje existem `ui/<locale>.json` e `profile.json`. Os demais arquivos do schema entram com as features.

## Comandos

| Comando                                  | O que faz                         |
| ---------------------------------------- | --------------------------------- |
| `pnpm --filter @portfolio/content build` | Valida os JSON e gera `dist/data` |
| `pnpm --filter @portfolio/content test`  | Testes da validação (Vitest)      |

Skill: `content-schema`.
