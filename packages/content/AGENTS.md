# packages/content

Todo o conteúdo do site em JSON (`data/`), validado com Zod e entregue aos apps como módulos tipados.

## Convenções

- Modelo em `docs/content/schema.md`; schemas em `src/schemas.ts`. Mude os dois juntos.
- Os apps importam só por subcaminho: `@portfolio/content/ui`, `@portfolio/content/home`, `@portfolio/content/profile`, `@portfolio/content/recruiter`. Nunca leem `data/` direto.
- O build falha se um JSON for inválido. Item `published` precisa dos três idiomas (pt-BR, en, es).
- O build de produção exclui `draft`. O `pnpm dev` da raiz já roda com `CONTENT_INCLUDE_DRAFTS=1`.
- Dado de exemplo é `draft` e claramente fictício. Nunca invente conteúdo sobre o autor.
- Zod fica só neste pacote; não entra no bundle de nenhum app.
- Texto que só um app usa não entra em `ui`: os MFEs importam `ui` inteiro, e cada chave nova pesa nos três.
- `ui.construction` (título, frase e rótulo do botão de volta da tela "em construção") e `ui.pauseMotion` ficam em `ui` porque o shell, os três MFEs e o Next.js usam.
- A área do recrutador importa só `@portfolio/content/recruiter`: `recruiter` (um objeto por idioma, já filtrado e traduzido, ou `null` sem perfil visível) e `recruiterUi` (textos de `recruiter/<locale>.json`). Campo novo da página entra em `src/recruiter.ts`; o MFE não recebe ids soltos nem os outros idiomas.
- Dado de exemplo: `status: "draft"`, id começando por `exemplo-`, nomes "... Exemplo" e URLs em `example.com`. O teste cobra. Exceção autorizada pelo autor em 2026-10-09: `scripts/build.mjs` liga `publishRecruiterExample`, e enquanto o perfil for rascunho a área do recrutador vai ao ar com esses dados, marcados por `example: true` (a página mostra a faixa "Dados de exemplo"). `profile` continua `null` em produção, então a home não muda. Publicar o perfil encerra a exceção sozinho: rascunho volta a ficar de fora.
- Hoje existem `ui/<locale>.json`, `home/<locale>.json`, `recruiter/<locale>.json`, `profile.json`, `contacts.json`, `skills.json`, `experiences.json`, `education.json` e `projects.json`. `services`, `testimonials` e `articles` entram com as features.

## Comandos

| Comando                                  | O que faz                         |
| ---------------------------------------- | --------------------------------- |
| `pnpm --filter @portfolio/content build` | Valida os JSON e gera `dist/data` |
| `pnpm --filter @portfolio/content test`  | Testes da validação (Vitest)      |

Skill: `content-schema`.
