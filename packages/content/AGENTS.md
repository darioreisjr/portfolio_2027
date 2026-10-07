# packages/content

Todo o conteúdo do site em JSON (`data/`), validado com Zod e entregue aos apps como módulos tipados.

## Convenções

- Modelo em `docs/content/schema.md`; schemas em `src/schemas.ts`. Mude os dois juntos.
- Os apps importam só por subcaminho: `@portfolio/content/ui`, `@portfolio/content/home`, `@portfolio/content/profile`. Nunca leem `data/` direto.
- O build falha se um JSON for inválido. Item `published` precisa dos quatro idiomas.
- O build de produção exclui `draft`. O `pnpm dev` da raiz já roda com `CONTENT_INCLUDE_DRAFTS=1`.
- Dado de exemplo é `draft` e claramente fictício. Nunca invente conteúdo sobre o autor.
- Zod fica só neste pacote; não entra no bundle de nenhum app.
- Texto que só um app usa não entra em `ui`: os MFEs importam `ui` inteiro, e cada chave nova pesa nos três.
- Hoje existem `ui/<locale>.json`, `home/<locale>.json` e `profile.json`. Os demais arquivos do schema entram com as features.

## Comandos

| Comando                                  | O que faz                         |
| ---------------------------------------- | --------------------------------- |
| `pnpm --filter @portfolio/content build` | Valida os JSON e gera `dist/data` |
| `pnpm --filter @portfolio/content test`  | Testes da validação (Vitest)      |

Skill: `content-schema`.
